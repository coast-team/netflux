import { merge, Observable, Subject } from 'rxjs'

import { Channel, ChannelType } from '../../Channel'
import { isWebRTCSupported, isWebSocketSupported, log } from '../../misc/util'
import { channelBuilder as proto } from '../../proto'
import { WebChannel } from '../../WebChannel'
import { CONNECT_TIMEOUT as WEBSOCKET_TIMEOUT, WebSocketBuilder } from '../../WebSocketBuilder'
import {
  CONNECT_TIMEOUT as DATACHANNEL_TIMEOUT,
  DataChannelBuilder,
} from '../dataChannelBuilder/DataChannelBuilder'
import { IAllStreams, Service } from '../Service'
import { ConnectionError } from './ConnectionError'
import { ConnectionsInProgress } from './ConnectionsInProgress'

// Timeout constants
const CONNECT_TIMEOUT = Math.max(DATACHANNEL_TIMEOUT, WEBSOCKET_TIMEOUT) + 5000
const RESPONSE_TIMEOUT = 2000

/**
 * It is responsible to build a channel between two peers with a help of `WebSocketBuilder` and `DataChannelBuilder`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
export class ChannelBuilder extends Service<proto.IMessage, proto.Message> {
  public static readonly SERVICE_ID = 74

  private static connectResTrueEncoded: Uint8Array
  private static connectResFalseEncoded: Uint8Array

  public onConnectionRequest: (data: Uint8Array) => boolean

  private negotiationEncoded: Uint8Array
  private allStreams: IAllStreams<proto.IMessage, proto.Message>
  private wc: WebChannel
  private dataChannelBuilder: DataChannelBuilder
  private channelsSubject: Subject<Channel>
  private connectsInProgress: ConnectionsInProgress
  private myInfo: proto.IInfo

  constructor(wc: WebChannel) {
    super(ChannelBuilder.SERVICE_ID, proto.Message)
    this.wc = wc
    this.allStreams = super.useAllStreams(wc, wc.signaling)
    this.connectsInProgress = new ConnectionsInProgress(this.wc.STREAM_ID)
    this.channelsSubject = new Subject()
    this.onConnectionRequest = () => true
    this.dataChannelBuilder = new DataChannelBuilder(this.wc, this.wc.rtcConfiguration)
    this.myInfo = {
      wsTried: false,
      wsSupported: isWebSocketSupported(),
      dcTried: false,
      dcSupported: isWebRTCSupported(),
    }

    // Encode messages beforehand for optimization
    this.negotiationEncoded = super.encode({ negotiation: { initiator: this.myInfo } })
    if (!ChannelBuilder.connectResTrueEncoded && !ChannelBuilder.connectResFalseEncoded) {
      ChannelBuilder.connectResTrueEncoded = super.encode({ connectionResponse: true })
      ChannelBuilder.connectResFalseEncoded = super.encode({ connectionResponse: false })
    }

    // Subscribe to WebChannel and Signalings streams
    this.allStreams.message.subscribe(({ streamId, senderId, msg }) => {
      this.handleMessage(streamId, senderId, msg as proto.Message)
    })

    // Subscribe to channels from WebSocket and WebRTC builders
    this.subscribeToChannels()

    // Subscribe to WebSocket server listen url changes and WebChannel id change
    this.subscribeToURLandIDChange()
  }

  clean() {
    this.dataChannelBuilder.clean()
    this.connectsInProgress.clean()
  }

  get onChannel(): Observable<Channel> {
    return this.channelsSubject.asObservable()
  }

  async connectOverWebChannel(id: number, cb = () => {}, data = new Uint8Array()): Promise<void> {
    return this.connectOver(this.wc.STREAM_ID, id, cb, data)
  }

  async connectOverSignaling(cb = () => {}, data = new Uint8Array()): Promise<void> {
    return this.connectOver(this.wc.signaling.STREAM_ID, 1, cb, data)
  }

  private async connectOver(
    streamId: number,
    id: number,
    cb: () => void,
    data: Uint8Array
  ): Promise<void> {
    let connection = this.connectsInProgress.get(streamId, id)
    if (!connection) {
      this.allStreams.sendOver(streamId, { connectionRequest: data }, id)
      connection = this.connectsInProgress.create(streamId, id, CONNECT_TIMEOUT, RESPONSE_TIMEOUT)
      await connection.promise
      cb()
      return connection.promise
    } else {
      throw new Error(ConnectionError.IN_PROGRESS)
    }
  }

  private handleMessage(streamId: number, senderId: number, msg: proto.Message): void {
    log.channelBuilder('new message', msg.type)
    switch (msg.type) {
      case 'connectionRequest': {
        let connection = this.connectsInProgress.get(streamId, senderId)
        if (connection) {
          if (senderId < this.wc.myId) {
            connection.reject(new Error(ConnectionError.IN_PROGRESS))
          } else {
            return
          }
        }

        if (this.onConnectionRequest(msg.connectionRequest)) {
          connection = this.connectsInProgress.create(
            streamId,
            senderId,
            CONNECT_TIMEOUT,
            RESPONSE_TIMEOUT
          )
          connection.resolve()
          this.allStreams.sendOver(streamId, ChannelBuilder.connectResTrueEncoded, senderId)
        } else {
          this.allStreams.sendOver(streamId, ChannelBuilder.connectResFalseEncoded, senderId)
        }
        break
      }
      case 'connectionResponse': {
        const connection = this.connectsInProgress.get(streamId, senderId)
        if (connection) {
          if (msg.connectionResponse) {
            connection.resolve()
            this.allStreams.sendOver(streamId, this.negotiationEncoded, senderId)
          } else {
            connection.reject(new Error(ConnectionError.DENIED))
          }
        }
        break
      }
      case 'negotiation': {
        if (this.connectsInProgress.has(streamId, senderId)) {
          const neg = msg.negotiation as proto.Negotiation
          const initiator = neg.initiator as proto.Info
          let passive = neg.passive as proto.Info | undefined

          if (!passive) {
            // This is the first message sent by the initiator
            initiator.id = senderId
            passive = Object.assign({}, this.myInfo) as proto.Info
            passive.id = streamId === this.wc.STREAM_ID ? this.wc.myId : 1
          }

          this.proceedNegotiation(streamId, initiator, passive, passive.id === senderId).catch(
            (err) => {
              const connection = this.connectsInProgress.get(streamId, senderId)
              if (connection) {
                connection.reject(err)
              }
              this.allStreams.sendOver(streamId, { negotiation: { initiator, passive } }, senderId)
            }
          )
        }
        break
      }
    }
  }

  private async proceedNegotiation(
    streamId: number,
    initiator: proto.Info,
    passive: proto.Info,
    amIInitiator: boolean
  ): Promise<void> {
    const [me, theOther] = amIInitiator ? [initiator, passive] : [passive, initiator]

    // Try to connect over WebSocket
    if (theOther.wss && !me.wsTried && (await this.tryWs(streamId, me, theOther, amIInitiator))) {
      return
    }

    // Prompt the other peer to connect over WebSocket as I was not able
    if (me.wss && !theOther.wsTried) {
      log.channelBuilder(`Prompt the other to connect over WebSocket`)
      this.allStreams.sendOver(streamId, { negotiation: { initiator, passive } }, theOther.id)
      return
    }

    // Try to connect over RTCDataChannel, because no luck with WebSocket
    if (me.dcSupported && theOther.dcSupported) {
      if (!me.dcTried && (await this.tryDc(streamId, me, theOther, amIInitiator))) {
        return
      }

      // Prompt the other peer to connect over RTCDataChannel as I was not able
      if (!theOther.dcTried) {
        log.channelBuilder(`Prompt the other to connect over RTCDataChannel`)
        this.allStreams.sendOver(streamId, { negotiation: { initiator, passive } }, theOther.id)
        return
      }
    }

    // All connection possibilities have been tried and none of them worked
    throw new Error(ConnectionError.NEGOTIATION_ERROR)
  }

  private async tryWs(
    streamId: number,
    me: proto.Info,
    theOther: proto.Info,
    amIInitiator: boolean
  ): Promise<boolean> {
    try {
      if (streamId === this.wc.STREAM_ID) {
        await this.wc.webSocketBuilder.connectInternal(theOther.wss, theOther.id)
      } else if (amIInitiator) {
        await this.wc.webSocketBuilder.connectToJoin(theOther.wss, theOther.wcId)
      } else {
        await this.wc.webSocketBuilder.connectToInvite(theOther.wss)
      }
      log.channelBuilder(`New WebSocket connection with ${theOther.id}`)
      return true
    } catch (err) {
      if (err.message !== 'clean') {
        log.channelBuilder(`WebSocket failed with ${theOther.id}`, err)
        me.wsTried = true
        return false
      } else {
        return true
      }
    }
  }

  private async tryDc(
    streamId: number,
    me: proto.Info,
    theOther: proto.Info,
    amIInitiator: boolean
  ): Promise<boolean> {
    try {
      if (streamId === this.wc.STREAM_ID) {
        await this.dataChannelBuilder.connectInternal(theOther.id)
      } else if (amIInitiator) {
        await this.dataChannelBuilder.connectToJoin(theOther.id)
      } else {
        await this.dataChannelBuilder.connectToInvite(theOther.id)
      }
      log.channelBuilder(`New RTCDataChannel with ${theOther.id}`)
      return true
    } catch (err) {
      if (err.message !== 'clean') {
        log.channelBuilder(`RTCDataChannel failed with ${theOther.id}`, err)
        me.dcTried = true
        return false
      } else {
        return true
      }
    }
  }

  private subscribeToChannels() {
    merge(this.dataChannelBuilder.onChannel(), this.wc.webSocketBuilder.onChannel()).subscribe(
      (channel) => {
        channel.init.then(() => {
          let connection
          if (channel.type === ChannelType.INTERNAL) {
            connection = this.connectsInProgress.get(this.wc.STREAM_ID, channel.id)
          } else if (channel.type === ChannelType.INVITED) {
            connection = this.connectsInProgress.get(this.wc.signaling.STREAM_ID, channel.id)
          } else if (channel.type === ChannelType.JOINING) {
            connection = this.connectsInProgress.get(this.wc.signaling.STREAM_ID, 1)
          }
          if (connection) {
            connection.resolve()
          }
          this.channelsSubject.next(channel)
        })
      }
    )
  }

  private subscribeToURLandIDChange() {
    WebSocketBuilder.listenUrl.subscribe((url) => {
      if (url) {
        this.myInfo.wss = url
        this.negotiationEncoded = super.encode({ negotiation: { initiator: this.myInfo } })
      }
    })
    this.wc.onIdChange.subscribe((id: number) => {
      this.myInfo.wcId = this.wc.id
      this.negotiationEncoded = super.encode({ negotiation: { initiator: this.myInfo } })
    })
  }
}

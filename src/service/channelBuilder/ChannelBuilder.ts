import { Observable } from 'rxjs/Observable'
import { merge } from 'rxjs/observable/merge'
import { Subject } from 'rxjs/Subject'

import { Channel, ChannelType } from '../../Channel'
import { isWebRTCSupported, isWebSocketSupported, log } from '../../misc/Util'
import { channelBuilder as proto } from '../../proto'
import { WebChannel } from '../../WebChannel'
import { CONNECT_TIMEOUT as WEBSOCKET_TIMEOUT, WebSocketBuilder } from '../../WebSocketBuilder'
import { Service } from '../Service'
import { CONNECT_TIMEOUT as WEBRTC_TIMEOUT, WebRTCBuilder } from '../webRTCBuilder/WebRTCBuilder'
import { PendingRequests } from './PendingRequests'

// Timeout constants
const CONNECT_TIMEOUT = 2 * Math.max(WEBRTC_TIMEOUT, WEBSOCKET_TIMEOUT)
const PING_DEFAULT_TIMEOUT = 700
const PING_MAX_TIMEOUT = 3000

/**
 * It is responsible to build a channel between two peers with a help of `WebSocketBuilder` and `WebRTCBuilder`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
export class ChannelBuilder extends Service<proto.IMessage, proto.Message> {
  public static readonly SERVICE_ID = 74

  // Pre-built messages for optimization (same for all ChannelBuilder instances)
  private static pingPreBuiltMsg: Uint8Array
  private static pongPreBuiltMsg: Uint8Array

  private webRTCBuilder: WebRTCBuilder
  private channelsSubject: Subject<Channel>
  private webChannelReqs: PendingRequests
  private signalingReqs: PendingRequests
  private pingReqs: PendingRequests

  // Parameters to be initialized after leave
  private myInfo: proto.IPeerInfo
  private pairPreBuiltMsg: Uint8Array
  private pingTimeout: number

  constructor(wc: WebChannel) {
    super(ChannelBuilder.SERVICE_ID, proto.Message)
    super.useWebChannelStream(wc)
    super.useSignalingStream(wc.signaling)

    // Subscribe to streams
    this.streams.message.subscribe(({ streamId, senderId, msg }) => {
      this.handleMessage(streamId, senderId, msg as proto.Message)
    })

    this.webChannelReqs = new PendingRequests()
    this.signalingReqs = new PendingRequests()
    this.pingReqs = new PendingRequests()
    this.channelsSubject = new Subject()
    this.webRTCBuilder = new WebRTCBuilder(this.wc, this.wc.rtcConfiguration)
    this.pingTimeout = 0
    this.myInfo = {}
    this.pairPreBuiltMsg = new Uint8Array()

    // Preconstruct messages for optimization
    if (!ChannelBuilder.pingPreBuiltMsg && !ChannelBuilder.pongPreBuiltMsg) {
      ChannelBuilder.pingPreBuiltMsg = super.encode({ ping: true })
      ChannelBuilder.pongPreBuiltMsg = super.encode({ pong: true })
    }

    // Subscribe to channels from WebSocket and WebRTC builders
    merge(this.webRTCBuilder.onChannel(), this.wc.webSocketBuilder.onChannel()).subscribe(
      (channel) => {
        log.channelBuilder('New CHANNEL: ', { id: channel.id, type: channel.type })
        channel.init.then(() => {
          let pendingReq
          if (channel.type === ChannelType.INTERNAL) {
            pendingReq = this.webChannelReqs.get(channel.id)
          } else if (channel.type === ChannelType.INVITED) {
            pendingReq = this.signalingReqs.get(channel.id)
          } else if (channel.type === ChannelType.JOINING) {
            pendingReq = this.signalingReqs.get(1)
          }
          if (pendingReq) {
            pendingReq.resolve()
          }
          this.channelsSubject.next(channel)
        })
      }
    )

    // WhenSubscribe to WebSocket server listen url changes
    WebSocketBuilder.listenUrl.subscribe((url) => {
      if (url) {
        this.myInfo.wss = url
        this.myInfo.wcId = this.wc.id
        this.pairPreBuiltMsg = super.encode({ pair: { initiator: this.myInfo } })
      }
    })

    this.init(wc.myId)
  }

  clean() {
    this.webRTCBuilder.clean()
    this.webChannelReqs.clean()
    this.signalingReqs.clean()
    this.pingReqs.clean()
  }

  init(id: number) {
    this.pingTimeout = PING_DEFAULT_TIMEOUT
    this.myInfo = {
      id,
      wsTried: false,
      wsSupported: isWebSocketSupported(),
      dcTried: false,
      dcSupported: isWebRTCSupported(),
    }
    this.pairPreBuiltMsg = super.encode({ pair: { initiator: this.myInfo } })
  }

  get onChannel(): Observable<Channel> {
    return this.channelsSubject.asObservable()
  }

  async connectOverWebChannel(id: number): Promise<void> {
    await this.ping(id)
    let req = this.webChannelReqs.get(id)
    if (!req) {
      req = this.webChannelReqs.add(id, CONNECT_TIMEOUT)
      this.wcStream.send(this.pairPreBuiltMsg, id)
    }
    return req.promise
  }

  async connectOverSignaling(): Promise<void> {
    await this.ping(1, this.wc.signaling.STREAM_ID)
    let req = this.signalingReqs.get(1)
    if (!req) {
      req = this.signalingReqs.add(1, CONNECT_TIMEOUT)
      this.sigStream.send(
        super.encode({
          pair: {
            initiator: Object.assign({}, this.myInfo, { id: undefined }),
            passive: { id: 1 },
          },
        }),
        1
      )
    }
    return req.promise
  }

  async ping(id: number, streamId = this.wc.STREAM_ID): Promise<void> {
    let req = this.pingReqs.get(id)
    if (!req) {
      req = this.pingReqs.add(id, this.pingTimeout)
      this.streams.sendOver(streamId, ChannelBuilder.pingPreBuiltMsg, id)
    }
    return req.promise
  }

  private handleMessage(streamId: number, senderId: number, msg: proto.Message): void {
    switch (msg.type) {
      case 'ping': {
        this.streams.sendOver(streamId, ChannelBuilder.pongPreBuiltMsg, senderId)
        break
      }
      case 'pong': {
        const req = this.pingReqs.get(senderId)
        if (req) {
          req.resolve()
        } else {
          const created = this.pingReqs.getTimeoutDate(senderId)
          if (created) {
            log.channelBuilder('INCREASING Ping/Pong timeout up to: ' + this.pingTimeout)
            this.pingTimeout = global.Math.min(global.Date.now() - created + 500, PING_MAX_TIMEOUT)
          } else {
            log.channelBuilder(
              'Could not find timeout request date. This message should never be shown: something is wrong.'
            )
          }
        }
        break
      }
      case 'pair': {
        const {
          pair,
          pair: { initiator },
        } = msg as {
          pair: { initiator: proto.PeerInfo; passive: proto.PeerInfo | undefined }
        }
        if (!initiator.id) {
          initiator.id = senderId // When the initiator is a new peer and the message is received from a signaling server
        }
        const passive = Object.assign({}, this.myInfo, pair.passive)
        log.channelBuilder(`${this.wc.myId}: Pair received`, {
          initiator: JSON.stringify(initiator),
          passive: JSON.stringify(passive),
        })

        this.proceedAlgo(streamId, initiator, passive).catch((err) => {
          if (initiator.id === this.wc.myId) {
            const reqs = streamId === this.wc.STREAM_ID ? this.webChannelReqs : this.signalingReqs
            const pendingReq = reqs.get(passive.id)
            if (pendingReq !== undefined) {
              pendingReq.reject(err)
            } else {
              log.channelBuilder(
                'Could not find connection request. This message should never be shown: something is wrong.'
              )
            }
          } else {
            this.streams.sendOver(streamId, { pair: { initiator, passive } }, initiator.id)
          }
        })
      }
    }
  }

  private async proceedAlgo(
    streamId: number,
    initiator: proto.PeerInfo,
    passive: proto.PeerInfo
  ): Promise<void> {
    let me: proto.PeerInfo
    let other: proto.PeerInfo
    if (initiator.id === this.wc.myId) {
      me = initiator
      other = passive
    } else {
      me = passive
      other = initiator
    }

    // Try to connect over WebSocket
    if (other.wss && !me.wsTried) {
      try {
        if (streamId === this.wcStream.id) {
          await this.wc.webSocketBuilder.connectInternal(other.wss)
        } else if (initiator.id === this.wc.myId) {
          await this.wc.webSocketBuilder.connectToJoin(other.wss)
        } else {
          await this.wc.webSocketBuilder.connectToInvite(other.wss)
        }
        log.channelBuilder(`New WebSocket connection with ${other.id}`)
        return
      } catch (err) {
        if (err.message !== 'clean') {
          log.channelBuilder(`WebSocket failed with ${other.id}`, err)
          me.wsTried = true
        } else {
          return
        }
      }
    }

    // Prompt other peer to connect over WebSocket as I was not able
    if (me.wss && !other.wsTried) {
      log.channelBuilder(`Prompt other to connect over WebSocket`)
      this.streams.sendOver(streamId, { pair: { initiator, passive } }, other.id)
      return
    }

    // Try to connect over RTCDataChannel, because no luck with WebSocket
    if (me.dcSupported && other.dcSupported) {
      if (!me.dcTried) {
        try {
          if (streamId === this.wcStream.id) {
            await this.webRTCBuilder.connectInternal(other.id)
          } else if (initiator.id === this.wc.myId) {
            await this.webRTCBuilder.connectToJoin(other.id)
          } else {
            await this.webRTCBuilder.connectToInvite(other.id)
          }
          log.channelBuilder(`New RTCDataChannel with ${other.id}`)
          return
        } catch (err) {
          if (err.message !== 'clean') {
            log.channelBuilder(`RTCDataChannel failed with ${other.id}`, err)
            me.dcTried = true
          } else {
            return
          }
        }
      }

      // Prompt other peer to connect over RTCDataChannel as I was not able
      if (!other.dcTried) {
        log.channelBuilder(`Prompt other to connect over RTCDataChannel`)
        this.streams.sendOver(streamId, { pair: { initiator, passive } }, other.id)
        return
      }
    }

    log.channelBuilder(`ChannelBuilder FAILED`)
    // All connection possibilities have been tried and none of them worked
    throw new Error(`Failed to establish a connection between ${me.id} and ${other.id}`)
  }
}

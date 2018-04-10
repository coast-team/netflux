import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

import { Channel } from '../Channel'
import { isWebRTCSupported, isWebSocketSupported, log } from '../misc/Util'
import { channelBuilder as proto } from '../proto'
import { CONNECT_TIMEOUT as WEBSOCKET_TIMEOUT, WebSocketBuilder } from '../WebSocketBuilder'
import { Service } from './Service'
import { WebChannel } from './WebChannel'
import { CONNECT_TIMEOUT as WEBRTC_TIMEOUT } from './WebRTCBuilder'

// Timeout constants
const CONNECT_TIMEOUT = 2 * Math.max(WEBRTC_TIMEOUT, WEBSOCKET_TIMEOUT)
const DEFAULT_PINGPONG_TIMEOUT = 700
const MAX_PINGPONG_TIMEOUT = 3000

// Pre-built messages for better performance
let pingPreBuiltMsg: Uint8Array
let pongPreBuiltMsg: Uint8Array

interface IConnectionRequest {
  resolve: (ch: Channel) => void
  reject: (err: Error) => void
}

interface IPingPongRequest {
  promise: Promise<void>
  resolve: () => void
}

/**
 * It is responsible to build a channel between two peers with a help of `WebSocketBuilder` and `WebRTCBuilder`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
export class ChannelBuilder extends Service<proto.IMessage, proto.Message> {
  public static readonly SERVICE_ID = 74
  private myInfo: proto.IPeerInfo
  private pairPreBuiltMsg: Uint8Array
  private connectionRequests: Map<number, IConnectionRequest>
  private pingPongRequests: Map<number, IPingPongRequest>
  private channelsSubject: Subject<Channel>
  private pingPongTimeout: number
  private pingPongDates: Map<number, number>

  constructor(wc: WebChannel) {
    super(ChannelBuilder.SERVICE_ID, proto.Message, wc.serviceMessageSubject)
    this.wc = wc
    this.connectionRequests = new Map()
    this.pingPongRequests = new Map()
    this.channelsSubject = new Subject()
    this.pingPongTimeout = DEFAULT_PINGPONG_TIMEOUT
    this.pingPongDates = new Map()

    this.myInfo = {
      id: this.wc.myId,
      wsTried: false,
      wsSupported: isWebSocketSupported(),
      dcTried: false,
      dcSupported: isWebRTCSupported(),
    }
    this.pairPreBuiltMsg = super.encode({ pair: { initiator: this.myInfo } })
    pingPreBuiltMsg = super.encode({ ping: true })
    pongPreBuiltMsg = super.encode({ pong: true })

    // Listen on Channels as RTCDataChannels if WebRTC is supported
    if (this.myInfo.dcSupported) {
      wc.webRTCBuilder.onChannelFromWebChannel().subscribe((ch) => this.handleChannel(ch))
    }

    // Listen on Channels as WebSockets if the peer is listening on WebSockets
    WebSocketBuilder.listen().subscribe((url) => {
      if (url) {
        this.myInfo.wss = url
        this.pairPreBuiltMsg = super.encode({ pair: { initiator: this.myInfo } })
        wc.webSocketBuilder.onChannel.subscribe((ch) => this.handleChannel(ch))
      }
    })

    // Subscribe to WebChannel internal messages
    this.onServiceMessage.subscribe((msg) => this.handleServiceMessage(msg))
  }

  get onChannel(): Observable<Channel> {
    return this.channelsSubject.asObservable()
  }

  /**
   * Establish a `Channel` with the peer identified by `id`.
   */
  async connectTo(id: number): Promise<Channel> {
    await this.isResponding(id)
    const channel: any = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.connectionRequests.delete(id)
        reject(new Error('ChannelBuilder timeout'))
      }, CONNECT_TIMEOUT)
      this.connectionRequests.set(id, {
        resolve: (ch: Channel) => {
          this.connectionRequests.delete(id)
          clearTimeout(timer)
          resolve(ch)
        },
        reject: (err: Error) => {
          this.connectionRequests.delete(id)
          reject(err)
        },
      })
      log.channelBuilder(`connectTo `, this.myInfo)
      super._sendTo(id, this.pairPreBuiltMsg)
    })
    return channel
  }

  isResponding(id: number): Promise<void> {
    const ppRequest = this.pingPongRequests.get(id)
    if (ppRequest) {
      return ppRequest.promise
    } else {
      super._sendTo(id, pingPreBuiltMsg)
      const promise: Promise<void> = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pingPongRequests.delete(id)
          reject(new Error('pingpong'))
        }, this.pingPongTimeout)

        this.pingPongRequests.set(id, {
          promise,
          resolve: () => {
            this.pingPongRequests.delete(id)
            clearTimeout(timer)
            resolve()
          },
        })
        this.pingPongDates.set(id, global.Date.now())
      })
      return promise
    }
  }

  private handleChannel(ch: Channel): void {
    const pendReq = this.connectionRequests.get(ch.id)
    if (pendReq) {
      pendReq.resolve(ch)
    } else {
      this.channelsSubject.next(ch)
    }
  }

  private handleServiceMessage({ senderId, msg }: { senderId: number; msg: proto.Message }): void {
    switch (msg.type) {
      case 'ping': {
        super._sendTo(senderId, pongPreBuiltMsg)
        break
      }
      case 'pong': {
        const ppRequest = this.pingPongRequests.get(senderId)
        const date = global.Date.now()
        const requestDate = this.pingPongDates.get(senderId)
        if (requestDate) {
          if (ppRequest) {
            log.channelBuilder('Ping/Pong latency is: ' + (date - requestDate))
            ppRequest.resolve()
          } else {
            log.channelBuilder(
              'INCREASING Ping/Pong timeout, as current latency is: ' + (date - requestDate) + ' new value: ',
              date - requestDate + 500
            )
            this.pingPongTimeout = global.Math.min(date - requestDate + 500, MAX_PINGPONG_TIMEOUT)
          }
        }
        break
      }
      case 'pair': {
        const { pair, pair: { initiator } } = msg as { pair: { initiator: proto.PeerInfo; passive: proto.PeerInfo | undefined } }
        const passive: proto.PeerInfo = pair.passive || Object.assign(this.myInfo)
        log.channelBuilder(`${this.wc.myId}: Pair received`, { initiator: JSON.stringify(initiator), passive: JSON.stringify(passive) })

        this.proceedConnectionAlgorithm(initiator, passive)
          .then((ch) => {
            if (ch) {
              this.handleChannel(ch)
            }
          })
          .catch((err) => {
            if (initiator.id === this.wc.myId) {
              const cr = this.connectionRequests.get(passive.id)
              if (cr !== undefined) {
                cr.reject(err)
              }
            } else {
              super._sendTo(initiator.id, { pair: { initiator, passive } })
            }
          })
      }
    }
  }

  private async proceedConnectionAlgorithm(initiator: proto.PeerInfo, passive: proto.PeerInfo): Promise<Channel | undefined> {
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
        const channel = (await this.wc.webSocketBuilder.connect(other.wss, other.id)) as Channel
        log.channelBuilder(`Connected over WebSocket with ${other.id}`)
        return channel
      } catch (err) {
        log.channelBuilder(`Failed to connect over WebSocket with ${other.id}`, err)
        me.wsTried = true
      }
    }

    // Prompt other peer to connect over WebSocket as I was not able
    if (me.wss && !other.wsTried) {
      log.channelBuilder(`Prompt other to connect over WebSocket`)
      super._sendTo(other.id, { pair: { initiator, passive } })
      return
    }

    // Try to connect over RTCDataChannel, because WebSocket has not been established
    if (me.dcSupported && other.dcSupported) {
      if (!me.dcTried) {
        try {
          const channel = await this.wc.webRTCBuilder.connectOverWebChannel(other.id)
          log.channelBuilder(`Connected over RTCDataChannel with ${other.id}`)
          return channel
        } catch (err) {
          log.channelBuilder(`${this.wc.myId}: me failed to connect over RTCDataChannel with ${other.id}`, err)
          me.dcTried = true
        }
      }
      if (!other.dcTried) {
        log.channelBuilder(`Prompt other to connect over RTCDataChannel`)
        super._sendTo(other.id, { pair: { initiator, passive } })
        return
      }
    }

    log.channelBuilder(`ChannelBuilder FAILED`)
    // All connection possibilities have been tried and none of them worked
    throw new Error(`Failed to establish a connection between ${me.id} and ${other.id}`)
  }
}

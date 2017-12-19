import { filter } from 'rxjs/operators'

import { isBrowser, log } from '../misc/Util'
import { channel as channelProto } from '../proto'
import { IServiceMessageDecoded, Service } from './Service'
import { WebChannel } from './WebChannel'

/**
 * Service id.
 */
const ID = 400

const MAXIMUM_MISSED_HEARTBEAT = 3
const HEARTBEAT_INTERVAL = 2000

/* Preconstructed messages */
const heartbeatMsg = Service.encodeServiceMessage(ID,
  channelProto.Message.encode(channelProto.Message.create({ heartbeat: true })).finish())

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel extends Service {

  public connection: WebSocket | RTCDataChannel
  public send: (data: Uint8Array) => void
  public isIntermediary: boolean
  /**
   * Id of the peer who is at the other end of this channel.
   */
  private _id: number
  private rtcPeerConnection: RTCPeerConnection
  private wc: WebChannel
  private heartbeatInterval: any
  private missedHeartbeat: number
  private heartbeatMsg: Uint8Array

  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   */
  constructor (
    wc: WebChannel,
    connection: WebSocket | RTCDataChannel,
    options: {rtcPeerConnection?: RTCPeerConnection, id: number} = {id: -1},
  ) {
    super(ID, channelProto.Message, wc.serviceMessageSubject)
    log.info(`new connection: Me: ${wc.myId} with ${options.id}`)
    this.wc = wc
    this.connection = connection
    this._id = options.id
    this.rtcPeerConnection = options.rtcPeerConnection
    this.isIntermediary = false
    this.updateHeartbeatMsg()

    // Configure `send` function
    if (isBrowser) {
      connection.binaryType = 'arraybuffer'
      this.send = this.sendInBrowser
    } else if (!this.rtcPeerConnection) {
      this.send = this.sendInNodeViaWebSocket
    } else {
      connection.binaryType = 'arraybuffer'
      this.send = this.sendInNodeViaDataChannel
    }

    // Configure handlers
    this.connection.onmessage = ({ data }) => wc.onMessageProxy(this, new Uint8Array(data))
    this.connection.onclose = (evt: Event) => {
      log.info(`Connection with ${this.id} has closed`)
      global.clearInterval(this.heartbeatInterval)
      this.connection.onclose = () => {}
      this.connection.onmessage = () => {}
      this.connection.onerror = () => {}
      wc.topologyService.onChannelClose(evt, this)
      if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
        this.rtcPeerConnection.close()
      }
    }
    this.connection.onerror = (evt) => {
      global.clearInterval(this.heartbeatInterval)
      this.connection.onclose = () => {}
      this.connection.onmessage = () => {}
      this.connection.onerror = () => {}
      wc.topologyService.onChannelError(evt, this)
      if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
        this.rtcPeerConnection.close()
      }
    }

    // Configure and start heartbeat interval
    this.onServiceMessage.pipe(filter(({ senderId }) => this.id === senderId))
      .subscribe(() => this.missedHeartbeat = 0)
    this.startHeartbeat()
  }

  get id () {
    return this._id
  }

  set id (value: number) {
    this._id = value
    this.updateHeartbeatMsg()
  }

  markAsIntermediry (): void {
    this.wc.topologyService.initIntermediary(this)
  }

  close (): void {
    if (
      this.connection.readyState !== 'closed' &&
      this.connection.readyState !== 'closing' &&
      this.connection.readyState !== WebSocket.CLOSED &&
      this.connection.readyState !== WebSocket.CLOSING
    ) {
      log.info(`I:${this.wc.myId} close connection with ${this.id}`)
      global.clearInterval(this.heartbeatInterval)
      if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
        this.rtcPeerConnection.close()
      } else {
        this.connection.close()
      }
    }
  }

  closeQuietly (): void {
    this.connection.onmessage = undefined
    this.connection.onclose = undefined
    this.connection.onerror = undefined
    if (
      this.connection.readyState !== 'closed' &&
      this.connection.readyState !== 'closing' &&
      this.connection.readyState !== WebSocket.CLOSED &&
      this.connection.readyState !== WebSocket.CLOSING
    ) {
      log.info(`I:${this.wc.myId} close QUIETLY connection with ${this.id}`)
      if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
        this.rtcPeerConnection.close()
      } else {
        this.connection.close()
      }
    }
  }

  private sendInBrowser (data: Uint8Array): void {
    // if (this.connection.readyState !== 'closed' && new Int8Array(data).length !== 0) {
    if (this.isOpen()) {
      try {
        (this.connection as any).send(data)
      } catch (err) {
        console.error(`Channel send: ${err.message}`)
      }
    }
  }

  private sendInNodeViaWebSocket (data: Uint8Array): void {
    if (this.isOpen()) {
      try {
        (this.connection as any).send(data, {binary: true})
      } catch (err) {
        console.error(`Channel send: ${err.message}`)
      }
    }
  }

  private sendInNodeViaDataChannel (data: Uint8Array): void {
    this.sendInBrowser(data.slice(0))
  }

  private isOpen (): boolean {
    return this.connection.readyState === WebSocket.OPEN || this.connection.readyState === 'open'
  }

  private startHeartbeat () {
    this.missedHeartbeat = 0
    this.heartbeatInterval = global.setInterval(() => {
      try {
        this.missedHeartbeat++
        if (this.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
          throw new Error('Too many missed heartbeats')
        }
        this.send(this.heartbeatMsg)
      } catch (err) {
        global.clearInterval(this.heartbeatInterval)
        log.info('Closing connection. Reason: ' + err.message)
        this.close()
      }
    }, HEARTBEAT_INTERVAL)
  }

  private updateHeartbeatMsg () {
    this.heartbeatMsg = this.wc.encode({ recipientId: this._id, content: heartbeatMsg })
  }
}

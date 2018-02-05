import { isBrowser, log } from './misc/Util'
import { WebChannel } from './service/WebChannel'

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {

  public connection: WebSocket | RTCDataChannel
  public send: (data: Uint8Array) => void
  public isIntermediary: boolean
  public missedHeartbeat: number

  /**
   * Id of the peer who is at the other end of this channel.
   */
  private _id: number
  private rtcPeerConnection: RTCPeerConnection
  private wc: WebChannel
  private topologyHeartbeatMsg: Uint8Array
  private fullHeartbeatMsg: Uint8Array

  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   */
  constructor (
    wc: WebChannel,
    connection: WebSocket | RTCDataChannel,
    options: {rtcPeerConnection?: RTCPeerConnection, id: number} = {id: 1},
  ) {
    log.info(`New Channel: Me: ${wc.myId} with ${options.id}`)
    this.wc = wc
    this.connection = connection
    this._id = options.id
    this.rtcPeerConnection = options.rtcPeerConnection
    this.isIntermediary = false
    this.missedHeartbeat = 0
    this.updateHeartbeatMsg(null)

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
      wc.topologyService.onChannelClose(evt, this)
      if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
        // this.rtcPeerConnection.close()
      }
    }
    this.connection.onerror = (evt) => {
      log.debug('Channel error: ', evt)
      wc.topologyService.onChannelError(evt, this)
      this.close()
    }
  }

  get id () {
    return this._id
  }

  set id (value: number) {
    this._id = value
    this.updateHeartbeatMsg(this.topologyHeartbeatMsg)
  }

  close (): void {
    this.connection.close()
  }

  closeQuietly (): void {
    this.connection.onmessage = undefined
    this.connection.onclose = undefined
    this.connection.onerror = undefined
    this.close()
  }

  sendHeartbeat () {
    this.send(this.fullHeartbeatMsg)
  }

  updateHeartbeatMsg (heartbeatMsg) {
    this.topologyHeartbeatMsg = heartbeatMsg
    this.fullHeartbeatMsg = this.wc.encode({ recipientId: this._id, content: heartbeatMsg })
  }

  private sendInBrowser (data: Uint8Array): void {
    try {
      (this.connection as any).send(data)
    } catch (err) {
      console.error('Channel send', err)
    }
  }

  private sendInNodeViaWebSocket (data: Uint8Array): void {
    try {
      (this.connection as any).send(data, {binary: true})
    } catch (err) {
      console.error('Channel send', err)
    }
  }

  private sendInNodeViaDataChannel (data: Uint8Array): void {
    this.sendInBrowser(data.slice(0))
  }
}

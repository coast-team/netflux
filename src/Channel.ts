import { isBrowser, isFirefox } from './misc/Util'
import { WebChannel } from './service/WebChannel'

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {

  public connection: WebSocket | RTCDataChannel
  /**
   * Id of the peer who is at the other end of this channel.
   */
  public id: number
  public send: (data: Uint8Array) => void
  public isIntermediary: boolean
  private rtcPeerConnection: RTCPeerConnection
  private onClose: (evt: Event) => void
  private wc: WebChannel

  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   */
  constructor (
    wc: WebChannel,
    connection: WebSocket | RTCDataChannel,
    options: {rtcPeerConnection?: RTCPeerConnection, id: number} = {id: -1},
  ) {
    this.wc = wc
    this.connection = connection
    this.id = options.id
    this.rtcPeerConnection = options.rtcPeerConnection
    this.isIntermediary = false

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

    this.onClose = (evt: Event) => {
      console.info(`NETFLUX: ${wc.myId} ONCLOSE CALLBACK ${this.id}`, {
        readyState: this.connection.readyState,
        iceConnectionState: this.rtcPeerConnection ? this.rtcPeerConnection.iceConnectionState : '',
        signalingState: this.rtcPeerConnection ? this.rtcPeerConnection.signalingState : '',
      })
      this.connection.onclose = () => {}
      this.connection.onmessage = () => {}
      this.connection.onerror = () => {}
      wc.topologyService.onChannelClose(evt, this)
      if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
        this.rtcPeerConnection.close()
      }
    }

    // Configure handlers
    this.connection.onmessage = ({ data }) => wc.onMessageProxy(this, new Uint8Array(data))
    this.connection.onclose = (evt) => this.onClose(evt)
    this.connection.onerror = (evt) => wc.topologyService.onChannelError(evt, this)
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
      console.info(`NETFLUX: ${this.wc.myId} CLOSE ${this.id}`, {
        readyState: this.connection.readyState,
        iceConnectionState: this.rtcPeerConnection ? this.rtcPeerConnection.iceConnectionState : '',
        signalingState: this.rtcPeerConnection ? this.rtcPeerConnection.signalingState : '',
      })
      this.connection.close()
      if (isFirefox && this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
        this.onClose(new global.Event('close'))
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
}

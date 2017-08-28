import { isBrowser } from './Util'
import { WebChannel } from './service/WebChannel'

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {

  private connection: WebSocket | RTCDataChannel
  private rtcPeerConnection: RTCPeerConnection
  /**
   * Id of the peer who is at the other end of this channel.
   */
  public peerId: number
  public send: (data: Uint8Array) => void

  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   */
  constructor (
    wc: WebChannel,
    connection: WebSocket | RTCDataChannel,
    options: {rtcPeerConnection?: RTCPeerConnection, id: number} = {id: -1}
  ) {
    this.connection = connection
    this.peerId = options.id
    this.rtcPeerConnection = options.rtcPeerConnection

    // Configure `send` function
    if (isBrowser()) {
      connection.binaryType = 'arraybuffer'
      this.send = this.sendInBrowser
    } else if (!this.rtcPeerConnection) {
      this.send = this.sendInNodeViaWebSocket
    } else {
      connection.binaryType = 'arraybuffer'
      this.send = this.sendInNodeViaDataChannel
    }

    // Configure handlers
    this.connection.onmessage = ({ data }) => wc._onMessage(this, new Uint8Array(data))
    this.connection.onclose = closeEvt => wc._topology.onChannelClose(closeEvt, this)
    this.connection.onerror = evt => wc._topology.onChannelError(evt, this)
  }

  close (): void {
    if (this.rtcPeerConnection) {
      /*
      We call close function on RTCPeerConnection rather then on RTCDataChannel
      in order to have the same behavior on Chrome and Firefox. Indeed in
      Firefox (Nigthly v 57) RTCDataChannel.close call does not fire Close Event
      on data channel, while in Chrome it does. However RTCPeerConnection.close
      fires Close Event in both browsers. As in Netflux we assume to have one
      RTCDataChannel per RTCPeerConnection, we can call it here.
      */
      this.rtcPeerConnection.close()
    } else {
      this.connection.close()
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
    const state: any = this.connection.readyState
    return state === 1 || state === 'open'
  }
}

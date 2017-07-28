import { Util } from './Util'
import { WebChannel } from './service/WebChannel'

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {

  private connection: WebSocket | RTCDataChannel
  /**
   * Id of the peer who is at the other end of this channel.
   */
  public peerId: number
  public send: (data: Uint8Array) => void

  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   */
  constructor (connection: WebSocket | RTCDataChannel, wc: WebChannel, id: number) {
    this.connection = connection
    this.peerId = id || -1

    // Configure `send` function
    if (Util.isBrowser()) {
      connection.binaryType = 'arraybuffer'
      this.send = this.sendInBrowser
    } else if (Util.isSocket(connection)) {
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
    this.connection.close()
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
    const state = this.connection.readyState
    return state === 1 || state === 'open'
  }
}

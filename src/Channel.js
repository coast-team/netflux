import { Util } from './Util'

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {
  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   * @param {WebSocket|RTCDataChannel} connection Data channel or web socket
   * @param {WebChannel} wc The `WebChannel` this channel will be part of
   * @param {number} id Peer id
   */
  constructor (connection, wc, id) {
    /**
     * DataChannel or WebSocket.
     * @private
     * @type {external:WebSocket|external:RTCDataChannel}
     */
    this.connection = connection

    /**
     * The `WebChannel` which this channel belongs to.
     * @type {WebChannel}
     */
    this.webChannel = wc

    /**
     * Identifier of the peer who is at the other end of this channel
     * @type {WebChannel}
     */
    this.peerId = id || -1

    /**
     * Send message.
     * @type {function(message: ArrayBuffer)}
     */
    this.send = undefined

    // Configure `send` function
    if (Util.isBrowser()) {
      connection.binaryType = 'arraybuffer'
      this.send = this.sendBrowser
    } else if (Util.isSocket(connection)) {
      this.send = this.sendInNodeViaWebSocket
    } else {
      connection.binaryType = 'arraybuffer'
      this.send = this.sendInNodeViaDataChannel
    }

    // Configure handlers
    if (!Util.isBrowser() && Util.isSocket(this.connection)) {
      this.connection.onmessage = msgEvt => {
        wc._onMessage(this, new Uint8Array(msgEvt.data))
      }
    } else {
      this.connection.onmessage = msgEvt => wc._onMessage(this, msgEvt.data)
    }
    this.connection.onclose = closeEvt => wc._topology.onChannelClose(closeEvt, this)
    this.connection.onerror = evt => wc._topology.onChannelError(evt, this)
  }

  /**
   * Send message over this channel. The message should be prepared beforhand by
   * the {@link MessageService} (see{@link MessageService#msg},
   * {@link MessageService#handleUserMessage}).
   *
   * @private
   * @param {ArrayBuffer} data Message
   */
  sendBrowser (data) {
    // if (this.connection.readyState !== 'closed' && new Int8Array(data).length !== 0) {
    if (this.isOpen()) {
      try {
        this.connection.send(data)
      } catch (err) {
        console.error(`Channel send: ${err.message}`)
      }
    }
  }

  /**
   * @private
   * @param {ArrayBuffer} data
   */
  sendInNodeViaWebSocket (data) {
    if (this.isOpen()) {
      try {
        this.connection.send(data, {binary: true})
      } catch (err) {
        console.error(`Channel send: ${err.message}`)
      }
    }
  }

  /**
   * @private
   * @param {ArrayBuffer} data
   */
  sendInNodeViaDataChannel (data) {
    this.sendBrowser(data.slice(0))
  }

  /**
   */
  clearHandlers () {
    this.onMessage = () => {}
    this.onClose = () => {}
    this.onError = () => {}
  }

  /**
   * @returns {boolean}
   */
  isOpen () {
    const state = this.connection.readyState
    return state === 1 || state === 'open'
  }

  /**
   * Close the channel.
   */
  close () {
    this.connection.close()
  }
}

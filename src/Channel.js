import { Util } from 'Util'

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {
  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   * @param {WebSocket|RTCDataChannel} connection Data channel or web socket
   * @param {WebChannel} wc The `WebChannel` this channel will be part of
   */
  constructor (connection, wc) {
    /**
     * Data channel or web socket.
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
    this.peerId = -1

    /**
     * Send message.
     * @type {function(message: ArrayBuffer)}
     */
    this.send = undefined

    if (Util.isBrowser()) {
      connection.binaryType = 'arraybuffer'
      this.send = this.sendBrowser
    } else if (Util.isSocket(connection)) {
      this.send = this.sendInNodeThroughSocket
    } else {
      connection.binaryType = 'arraybuffer'
      this.send = this.sendInNodeThroughDataChannel
    }
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
  sendInNodeThroughSocket (data) {
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
  sendInNodeThroughDataChannel (data) {
    this.sendBrowser(data.slice(0))
  }

  /**
   * @param {function(msg: ArrayBuffer)} handler
   */
  set onMessage (handler) {
    if (!Util.isBrowser() && Util.isSocket(this.connection)) {
      this.connection.onmessage = msgEvt => {
        handler(new Uint8Array(msgEvt.data).buffer)
      }
    } else this.connection.onmessage = msgEvt => handler(msgEvt.data)
  }

  /**
   * @param {function(message: CloseEvent)} handler
   */
  set onClose (handler) {
    this.connection.onclose = closeEvt => handler(closeEvt)
  }

  /**
   * @param {function(message: Event)} handler
   */
  set onError (handler) {
    this.connection.onerror = evt => handler(evt)
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

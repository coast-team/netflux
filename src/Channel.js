import { Util } from 'Util'

/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {
  /**
   * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
   * @param {WebSocket|RTCDataChannel} channel Data channel or web socket
   * @param {WebChannel} webChannel The `WebChannel` this channel will be part of
   * @param {number} peerId Identifier of the peer who is at the other end of
   * this channel
   */
  constructor (channel, webChannel, peerId) {
    /**
     * Data channel or web socket.
     * @private
     * @type {external:WebSocket|external:RTCDataChannel}
     */
    this.channel = channel

    /**
     * The `WebChannel` which this channel belongs to.
     * @type {WebChannel}
     */
    this.webChannel = null

    /**
     * Identifier of the peer who is at the other end of this channel
     * @type {WebChannel}
     */
    this.peerId = -1

    /**
     * Send message.
     * @type {function(message: ArrayBuffer)}
     */
    this.send = null

    if (Util.isBrowser()) {
      channel.binaryType = 'arraybuffer'
      this.send = this.sendBrowser
    } else if (Util.isSocket(channel)) {
      this.send = this.sendInNodeThroughSocket
    } else {
      channel.binaryType = 'arraybuffer'
      this.send = this.sendInNodeThroughDataChannel
    }
  }

  /**
   * Send message over this channel. The message should be prepared beforhand by
   * the {@link MessageBuilderService} (see{@link MessageBuilderService#msg},
   * {@link MessageBuilderService#handleUserMessage}).
   *
   * @private
   * @param {ArrayBuffer} data Message
   */
  sendBrowser (data) {
    // if (this.channel.readyState !== 'closed' && new Int8Array(data).length !== 0) {
    if (this.isOpen()) {
      try {
        this.channel.send(data)
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
        this.channel.send(data, {binary: true})
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
    if (!Util.isBrowser() && Util.isSocket(this.channel)) {
      this.channel.onmessage = msgEvt => {
        handler(new Uint8Array(msgEvt.data).buffer)
      }
    } else this.channel.onmessage = msgEvt => handler(msgEvt.data)
  }

  /**
   * @param {function(message: CloseEvent)} handler
   */
  set onClose (handler) {
    this.channel.onclose = closeEvt => {
      if (this.webChannel !== null && handler(closeEvt)) {
        this.webChannel.members.splice(this.webChannel.members.indexOf(this.peerId), 1)
        this.webChannel.onPeerLeave(this.peerId)
      } else handler(closeEvt)
    }
  }

  /**
   * @param {function(message: Event)} handler
   */
  set onError (handler) {
    this.channel.onerror = evt => handler(evt)
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
    const state = this.channel.readyState
    return state === 1 || state === 'open'
  }

  /**
   * Close the channel.
   */
  close () {
    this.channel.close()
  }
}

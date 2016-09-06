import {isBrowser} from 'helper'

/**
 * Wrapper class for {@link external:RTCDataChannel} and
 * {@link external:WebSocket}.
 */
class Channel {

  /**
   * Creates *Channel* instance from existing data channel or web socket, assigns
   * it to the specified *WebChannel* and gives him an identifier.
   * @param {external:WebSocket|external:RTCDataChannel} - Data channel or web
   * socket
   * @param {WebChannel} - The *WebChannel* this channel will be part of
   * @param {number} peerId - Identifier of the peer who is at the other end of
   * this channel
   */
  constructor (channel, webChannel, peerId) {
    channel.binaryType = 'arraybuffer'

    /**
     * Data channel or web socket.
     * @private
     * @type {external:WebSocket|external:RTCDataChannel}
     */
    this.channel = channel

    /**
     * The *WebChannel* which this channel belongs to.
     * @type {WebChannel}
     */
    this.webChannel = webChannel

    /**
     * Identifier of the peer who is at the other end of this channel
     * @type {WebChannel}
     */
    this.peerId = peerId

    this.send = isBrowser() ? this.sendBrowser : this.sendNode
  }

  /**
   * Configure this channel. Set up message, error and close event handlers.
   */
  config () {
    this.channel.onmessage = msgEvt => this.webChannel.onChannelMessage(this, msgEvt.data)
    this.channel.onerror = evt => this.webChannel.manager.onChannelError(evt, this)
    this.channel.onclose = evt => {
      if (this.webChannel.manager.onChannelClose(evt, this)) {
        this.webChannel.members.splice(this.webChannel.members.indexOf(this.peerId), 1)
        this.webChannel.onLeaving(this.peerId)
      }
    }
  }

  /**
   * Send message over this channel. The message should be prepared beforhand by
   * the {@link MessageBuilderService}
   * @see {@link MessageBuilderService#msg}, {@link MessageBuilderService#handleUserMessage}
   * @param {external:ArrayBuffer} data - Message
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

  sendNode (data) {
    this.sendBrowser(data.slice(0))
  }

  set onMessage (msgEvtHandler) {
    this.channel.onmessage = msgEvt => msgEvtHandler(this, msgEvt.data)
  }

  set onClose (closeEvtHandler) {
    this.channel.onclose = closeEvtHandler
  }

  set onError (errEvtHandler) {
    this.channel.onerror = evt => errEvtHandler(evt, this.peerId)
  }

  isOpen () {
    let state = this.channel.readyState
    return state === 1 || state === 'open'
  }

  /**
   * Close the channel.
   */
  close () {
    this.channel.close()
  }
}

export default Channel

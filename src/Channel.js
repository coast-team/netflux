import {isBrowser, isSocket} from 'helper'

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
  constructor (channel) {
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
    this.webChannel = null

    /**
     * Identifier of the peer who is at the other end of this channel
     * @type {WebChannel}
     */
    this.peerId = -1

    if (isBrowser()) {
      channel.binaryType = 'arraybuffer'
      this.send = this.sendBrowser
    } else if (isSocket(channel)) {
      this.send = this.sendInNodeThroughSocket
    } else {
      channel.binaryType = 'arraybuffer'
      this.send = this.sendInNodeThroughDataChannel
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

  sendInNodeThroughSocket (data) {
    if (this.isOpen()) {
      try {
        this.channel.send(data, {binary: true})
      } catch (err) {
        console.error(`Channel send: ${err.message}`)
      }
    }
  }

  sendInNodeThroughDataChannel (data) {
    this.sendBrowser(data.slice(0))
  }

  set onMessage (handler) {
    if (!isBrowser() && isSocket(this.channel)) {
      this.channel.onmessage = msgEvt => {
        let ab = new ArrayBuffer(msgEvt.data.length)
        let view = new Uint8Array(ab)
        for (let i = 0; i < msgEvt.data.length; i++) {
          view[i] = msgEvt.data[i]
        }
        handler(ab)
      }
    } else this.channel.onmessage = msgEvt => handler(msgEvt.data)
  }

  set onClose (handler) {
    this.channel.onclose = closeEvt => {
      if (this.webChannel !== null && handler(closeEvt)) {
        this.webChannel.members.splice(this.webChannel.members.indexOf(this.peerId), 1)
        this.webChannel.onLeaving(this.peerId)
      } else handler(closeEvt)
    }
  }

  set onError (handler) {
    this.channel.onerror = evt => handler(evt)
  }

  clearHandlers () {
    this.onmessage = () => {}
    this.onclose = () => {}
    this.onerror = () => {}
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

/**
 * Channel interface.
 * [RTCDataChannel]{@link https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel}
 * and
 * [WebSocket]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket}
 * implement it implicitly. Any other channel must implement this interface.
 *
 * @interface
 */
class Channel {
  constructor (channel, webChannel, peerId) {
    channel.binaryType = 'arraybuffer'
    this.channel = channel
    this.webChannel = webChannel
    this.peerId = peerId
  }

  config () {
    this.channel.onmessage = (msgEvt) => { this.webChannel.onChannelMessage(this, msgEvt.data) }
    this.channel.onerror = (evt) => { this.webChannel.onChannelError(evt) }
    this.channel.onclose = (evt) => { this.webChannel.onChannelClose(evt) }
  }

  /**
   * send - description.
   *
   * @abstract
   * @param {string} msg - Message in stringified JSON format.
   */
  send (data) {
    if (this.channel.readyState !== 'closed') {
      this.channel.send(data)
    }
  }

  /**
   * Close channel.
   *
   * @abstract
   */
  close () {
    this.channel.close()
  }
}

export default Channel

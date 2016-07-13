import {provide, MESSAGE_BUILDER} from './serviceProvider'

const msgBld = provide(MESSAGE_BUILDER)

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
    // FIXME:this does not work for WebSocket
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
  }

  /**
   * Configure this channel. Set up message, error and close event handlers.
   */
  config () {
    this.channel.onmessage = (msgEvt) => { this.webChannel.onChannelMessage(this, msgEvt.data) }
    this.channel.onerror = (evt) => { this.webChannel.onChannelError(evt) }
    this.channel.onclose = (evt) => { this.webChannel.onChannelClose(evt, this.peerId) }
  }

  /**
   * Send message over this channel. The message should be prepared beforhand by
   * the {@link MessageBuilderService}
   * @see {@link MessageBuilderService#msg}, {@link MessageBuilderService#handleUserMessage}
   * @param {external:ArrayBuffer} data - Message
   */
  send (data) {
    // if (this.channel.readyState !== 'closed' && new Int8Array(data).length !== 0) {
    if (this.channel.readyState !== 'closed') {
      try {
        msgBld.completeHeader(data, this.webChannel.myId)
        this.channel.send(data)
      } catch (err) {
        console.error(`Channel send: ${err.message}`)
      }
    }
  }

  /**
   * Close the channel.
   */
  close () {
    this.channel.close()
  }
}

export default Channel

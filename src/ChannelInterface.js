/**
 * Channel interface.
 * [RTCDataChannel]{@link https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel}
 * and
 * [WebSocket]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket}
 * implement it implicitly. Any other channel must implement this interface.
 *
 * @interface
 */
class ChannelInterface {
  constructor () {
    this.webChannel
    this.peerId
  }

  /**
   * On message event handler.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent}
   * @abstract
   * @param {MessageEvent} msgEvt - Message event.
   */
  onmessage (msgEvt) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * On close event handler.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
   * @abstract
   * @param  {CloseEvent} evt - Close event.
   */
  onclose (evt) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * On error event handler.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
   * @abstract
   * @param {Event} evt - Error event.
   */
  onerror (evt) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * send - description.
   *
   * @abstract
   * @param {string} msg - Message in stringified JSON format.
   */
  send (msg) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Close channel.
   *
   * @abstract
   */
  close () {
    throw new Error('Must be implemented by subclass!')
  }
}

export default ChannelInterface

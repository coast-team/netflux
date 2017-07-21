import { Service } from '../Service'

/**
 * It is responsible to preserve Web Channel
 * structure intact (i.e. all peers have the same vision of the Web Channel).
 * Among its duties are:
 *
 * - Add a new peer into Web Channel.
 * - Remove a peer from Web Channel.
 * - Send a broadcast message.
 * - Send a message to a particular peer.
 *
 * @see FullMesh
 * @interface
 */
export class TopologyInterface extends Service {
  /**
   * Add a new peer into WebChannel.
   *
   * @abstract
   * @param  {Channel} ch - Channel with the new peer
   */
  addJoining (ch) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * As a joining peer initializes the intermediary channel
   *
   * @abstract
   * @param  {Channel} ch - intermediary channel with one of the network member
   */
  initJoining (ch) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Broadcast a message to all network members.
   *
   * @abstract
   * @param  {Object} msg - Message to be send
   * @param  {number} [msg.senderId] - Id of the sender peer
   * @param  {number} [msg.recipientId] - Id of the recipient peer
   * @param  {boolean} [msg.isService] - True is it is an Netflux internal message and false
   *   means that is is a user message.
   * @param  {ArrayBuffer} [msg.content] - Message main content
   */
  send (msg) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Forward a broadcasted message. This method will be called onces
   * the peer receives a broadcasted message.
   *
   * @abstract
   * @param  {Object} msg
   * @param  {number} [msg.senderId] - Id of the sender peer
   * @param  {number} [msg.recipientId] - Id of the recipient peer
   * @param  {boolean} [msg.isService] - True if it is Netflux internal message
   *    and false if it is a user message.
   * @param  {ArrayBuffer} [msg.content] - Message main content
   */
  forward (msg) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Send a message to a particular peer in the network.
   *
   * @abstract
   * @param  {Object} msg - Message to be send
   * @param  {number} [msg.senderId] - Id of the sender peer
   * @param  {number} [msg.recipientId] - Id of the recipient peer
   * @param  {boolean} [msg.isService] - True is it is an Netflux internal message and false
   *   means that is is a user message.
   * @param  {ArrayBuffer} [msg.content] - Message main content
   */
  sendTo (msg) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Forward the message to its recipient or to some peer who knowns
   * how to forward this message to its recipient. This method
   * will be called onces the peer receives a private message
   * which is intended to someone else.
   *
   * @abstract
   * @param  {Object} msg
   * @param  {number} [msg.senderId] - Id of the sender peer
   * @param  {number} [msg.recipientId] - Id of the recipient peer
   * @param  {boolean} [msg.isService] - True if it is a Netflux internal message
   *    and false if it is a user message.
   * @param  {ArrayBuffer} [msg.content] - Message main content
   */
  forwardTo (msg) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Leave Web Channel.
   *
   * @abstract
   */
  leave () {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Close event handler for each `Channel` in the `WebChannel`.
   *
   * @param {CloseEvent} closeEvt
   * @param {Channel} channel
   */
  onChannelClose (closeEvt, channel) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Error event handler for each `Channel` in the `WebChannel`.
   *
   * @param {Event} evt
   * @param {Channel} channel
   */
  onChannelError (evt, channel) {
    throw new Error('Must be implemented by subclass!')
  }
}

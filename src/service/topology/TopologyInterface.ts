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
export abstract class TopologyInterface extends Service {
  /**
   * Add a new peer into WebChannel.
   *
   * @abstract
   * @param  {Channel} ch - Channel with the new peer
   */
  abstract addJoining (ch: any): void

  /**
   * As a joining peer initializes the intermediary channel
   *
   * @abstract
   * @param  {Channel} ch - intermediary channel with one of the network member
   */
  abstract initJoining (ch: any): void

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
  abstract send (msg: any): void

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
  abstract forward (msg): void

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
  abstract sendTo (msg): void

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
  abstract forwardTo (msg): void

  /**
   * Leave Web Channel.
   *
   * @abstract
   */
  abstract leave (): void

  /**
   * Close event handler for each `Channel` in the `WebChannel`.
   *
   * @param {CloseEvent} closeEvt
   * @param {Channel} channel
   */
  abstract onChannelClose (closeEvt, channel): void

  /**
   * Error event handler for each `Channel` in the `WebChannel`.
   *
   * @param {Event} evt
   * @param {Channel} channel
   */
  abstract onChannelError (evt, channel): void
}

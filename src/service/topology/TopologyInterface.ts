import { Service } from '../Service'
import { Channel } from '../../Channel'
import { Message } from '../../Util'

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
 */
export interface TopologyInterface {

  /**
   * As a network member, add a new peer into the network.
   *
   * @param ch  A channel between you and the joining peer
   */
  addJoining (ch: Channel): void

  /**
   * As a joining peer initialize the channel between you and
   * one of the network member through whom you are joining.
   *
   * @param ch  A channel between you and one of the network member
   */
  initJoining (ch: Channel): void

  /**
   * Broadcast a message to the network.
   */
  send (msg: Message): void

  /**
   * Forward a broadcasted message. This method should be called onces
   * the peer receives a broadcasted message.
   */
  forward (msg: Message): void

  /**
   * Send a message to a particular peer in the network.
   */
  sendTo (msg: Message): void

  /**
   * Forward the message to its recipient or to some peer who knowns how
   * to forward this message to its recipient. This method should be called
   * onces the peer receives a private message intended to someone else.
   */
  forwardTo (msg: Message): void

  /**
   * Disconnect from the network
   */
  leave (): void

  /**
   * This handler will be called when one of the network channel closed.
   */
  onChannelClose (closeEvt: CloseEvent, channel: Channel): void

  /**
   * This handler will be called when an error occured on one of the network
   * channel.
   */
  onChannelError (evt: Event, channel: Channel): void
}

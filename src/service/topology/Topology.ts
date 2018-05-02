import { Observable } from 'rxjs/Observable'
import { Channel } from '../../Channel'
import { IMessage } from '../../proto'

export enum TopologyEnum {
  FULL_MESH,
}

export enum TopologyState {
  JOINING,
  JOINED,
  DISCONNECTING,
  DISCONNECTED,
}

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
export interface ITopology {
  readonly onState: Observable<TopologyState>
  readonly state: TopologyState

  /**
   * Broadcast a message to the network.
   */
  send(msg: IMessage): void

  /**
   * Forward the message to its recipient(s).
   */
  forward(msg: IMessage): void

  /**
   * Send a message to a particular peer in the network.
   */
  sendTo(msg: IMessage): void

  /**
   * Disconnect from the network
   */
  leave(): void

  /**
   * This handler will be called when one of the network channel closed.
   */
  onChannelClose(event: Event, channel: Channel): void

  /**
   * This handler will be called when an error occured on one of the network
   * channel.
   */
  onChannelError(event: Event, channel: Channel): void
}

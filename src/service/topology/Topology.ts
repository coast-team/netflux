import { Observable } from 'rxjs/Observable'
import { Channel } from '../../Channel'
import { IMessage } from '../../proto'
import { Service } from '../Service'

export enum TopologyEnum {
  FULL_MESH,
}

export enum TopologyStateEnum {
  JOINING,
  JOINED,
  STABLE,
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
export interface ITopology extends Service {
  readonly onState: Observable<TopologyStateEnum>
  readonly state: TopologyStateEnum
  readonly heartbeat: Uint8Array

  /**
   * As a network member, add a new peer into the network.
   *
   * @param ch  A channel between you and the joining peer
   */
  addJoining(ch: Channel): void

  /**
   * This method is called when all necessary initialization messages have been
   * sent by WebChannel and notifies the topology that it is ready to be used.
   *
   * @param ch  A channel between you and one of the network member
   */
  initJoining(ch: Channel, ids: number[]): void

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

  /**
   * Signaling calls this method, when you are the first peer in the group.
   */
  setStable(): void
}

import { IMessage } from '../../proto';
import { Channel } from '../Channel';
import { Service } from '../Service';
export declare enum TopologyEnum {
    FULL_MESH = 0,
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
    /**
     * As a network member, add a new peer into the network.
     *
     * @param ch  A channel between you and the joining peer
     */
    addJoining(ch: Channel, members: [number]): void;
    /**
     * This method is called just after the channel between you and
     * one of the network member through whom you are joining has been
     * established. It called before initJoing method.
     *
     * @param ch  A channel between you and one of the network member
     */
    initIntermediary(ch: Channel): void;
    /**
     * This method is called when all necessary initialization messages have been
     * sent by WebChannel and notifies the topology that it is ready to be used.
     *
     * @param ch  A channel between you and one of the network member
     */
    initJoining(ch: Channel): void;
    /**
     * Broadcast a message to the network.
     */
    send(msg: IMessage): void;
    /**
     * Forward a broadcasted message. This method should be called onces
     * the peer receives a broadcasted message.
     */
    forward(msg: IMessage): void;
    /**
     * Send a message to a particular peer in the network.
     */
    sendTo(msg: IMessage): void;
    /**
     * Forward the message to its recipient or to some peer who knowns how
     * to forward this message to its recipient. This method should be called
     * onces the peer receives a private message intended to someone else.
     */
    forwardTo(msg: IMessage): void;
    /**
     * Disconnect from the network
     */
    leave(): void;
    /**
     * This handler will be called when one of the network channel closed.
     */
    onChannelClose(event: Event, channel: Channel): void;
    /**
     * This handler will be called when an error occured on one of the network
     * channel.
     */
    onChannelError(event: Event, channel: Channel): void;
    /**
     * Call this function before switching to another topology.
     */
    clean(): void;
}

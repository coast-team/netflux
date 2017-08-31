import 'rxjs/add/operator/map';
import { TopologyInterface } from './TopologyInterface';
import { IMessage } from '../../Protobuf';
import { Channel } from '../../Channel';
import { Service } from '../Service';
/**
 * {@link FullMesh} identifier.
 * @ignore
 * @type {number}
 */
export declare const FULL_MESH = 3;
/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 * @extends module:webChannelManager~WebChannelTopologyInterface
 */
export declare class FullMesh extends Service implements TopologyInterface {
    private wc;
    /**
     * Neighbours peers.
     */
    private channels;
    /**
     * Associate joining peer id to his intermediary peer accordingly.
     * When the connection with a joining peer is established, his id is removed
     * from this map and his associated channel is added to the `channels` property.
     */
    private jps;
    /**
     * The peer through whom you are joining. Equals to undefined if you are no
     * longer joining the network.
     */
    private intermediaryChannel;
    /**
     * Prebuild message for better performance.
     */
    private joinSucceedContent;
    private joinAttempts;
    constructor(wc: any);
    clean(): void;
    addJoining(ch: Channel, members: [number]): void;
    initJoining(ch: Channel): void;
    send(msg: IMessage): void;
    forward(msg: IMessage): void;
    sendTo(msg: IMessage): void;
    forwardTo(msg: IMessage): void;
    leave(): void;
    onChannelClose(event: Event, channel: Channel): void;
    onChannelError(evt: Event, channel: Channel): void;
    private handleSvcMsg({channel, senderId, recipientId, msg});
    private checkMembers(ch, members);
    private peerJoined(ch);
}

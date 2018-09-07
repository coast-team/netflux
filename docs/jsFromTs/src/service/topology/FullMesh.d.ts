import { Channel } from '../../Channel';
import { fullMesh as proto } from '../../proto/index';
import { InWcMsg, WebChannel } from '../../WebChannel';
import { ITopology, Topology } from './Topology';
/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 */
export declare class FullMesh extends Topology<proto.IMessage, proto.Message> implements ITopology {
    static readonly SERVICE_ID: number;
    /**
     * Directly connected peers.
     */
    private adjacentMembers;
    /**
     * Peers that are not adjacent. When the connection with a distant peer is established,
     * his id is removed from this map a new entry is added to the `adjacentMembers` property.
     */
    private distantMembers;
    private antecedentId;
    private heartbeatInterval;
    private delayedMembers;
    private delayedMembersTimers;
    private membersCheckInterval;
    private heartbeatMsg;
    private adjacentBots;
    constructor(wc: WebChannel);
    send(msg: InWcMsg): void;
    sendTo(msg: InWcMsg): void;
    forward(msg: InWcMsg): void;
    leave(): void;
    onChannelClose(channel: Channel): void;
    readonly neighbors: Channel[];
    private clean;
    private handleServiceMessage;
    private connectToMembers;
    private notifyDistantMembers;
    private startMembersCheckIntervals;
    private startHeartbeatInterval;
    private sendToDistantPeer;
    private findRoutedChannel;
    private createOrUpdateDistantMember;
    private updateAntecedentId;
}

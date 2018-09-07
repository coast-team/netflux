import { Observable } from 'rxjs';
import { Channel } from '../../Channel';
import { IMessage } from '../../proto/index';
import { WebChannel } from '../../WebChannel';
import { IMessageFactory, IWebChannelStream, Service } from '../Service';
export declare enum TopologyEnum {
    FULL_MESH = 0
}
export declare enum TopologyState {
    CONSTRUCTING = 0,
    CONSTRUCTED = 1,
    IDLE = 2
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
export declare abstract class Topology<OutMsg, InMsg extends OutMsg> extends Service<OutMsg, InMsg> {
    protected wcStream: IWebChannelStream<OutMsg, InMsg>;
    protected wc: WebChannel;
    private _state;
    private stateSubject;
    constructor(wc: WebChannel, serviceId: number, proto: IMessageFactory<OutMsg, InMsg>);
    readonly onState: Observable<TopologyState>;
    readonly state: TopologyState;
    setJoinedState(): void;
    protected setState(state: TopologyState): void;
    abstract readonly neighbors: Channel[];
}
export interface ITopology {
    onState: Observable<TopologyState>;
    state: TopologyState;
    neighbors: Channel[];
    setJoinedState(): void;
    /**
     * Broadcast a message to the network.
     */
    send(msg: IMessage): void;
    /**
     * Forward the message to its recipient(s).
     */
    forward(msg: IMessage): void;
    /**
     * Send a message to a particular peer in the network.
     */
    sendTo(msg: IMessage): void;
    /**
     * Disconnect from the network
     */
    leave(): void;
    /**
     * This handler will be called when one of the network channel closed.
     */
    onChannelClose(channel: Channel): void;
}

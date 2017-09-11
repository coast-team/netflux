import { Subject } from 'rxjs/Subject';
import { Channel } from '../Channel';
import { Service, ServiceMessageEncoded } from './Service';
import { Signaling, SignalingState } from '../Signaling';
import { ChannelBuilder } from './ChannelBuilder';
import { WebSocketBuilder } from '../WebSocketBuilder';
import { WebRTCBuilder } from './WebRTCBuilder';
import { UserDataType } from '../UserMessage';
import { TopologyInterface, Topology } from './topology/Topology';
export interface WebChannelOptions {
    topology: Topology;
    signalingURL: string;
    iceServers: RTCIceServer[];
    autoRejoin: boolean;
}
export declare const wcDefaults: WebChannelOptions;
export declare enum WebChannelState {
    JOINING = 0,
    JOINED = 1,
    LEFT = 2,
}
/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 * [[include:installation.md]]
 */
export declare class WebChannel extends Service {
    /**
     * An array of all peer ids except yours.
     */
    readonly members: number[];
    /**
     * Topology id.
     */
    topology: Topology;
    /**
     * WebChannel id.
     */
    id: number;
    /**
     * Your id as a peer in the network.
     */
    myId: number;
    /**
     * Unique string mandatory to join a network.
     */
    key: string;
    /**
     * If true, when the connection with Signaling is closed, will continuously
     * trying to reconnect to Signaling until succeed in order to join the network.
     */
    autoRejoin: boolean;
    /**
     * Thi handler is called each time the state of Signaling server changes.
     */
    onSignalingStateChanged: (state: SignalingState) => void;
    /**
     * Thi handler is called each time the state of the network changes.
     */
    onStateChanged: (state: WebChannelState) => void;
    /**
     * This handler is called when a new peer has joined the network.
     */
    onMemberJoin: (id: number) => void;
    /**
     * This handler is called when a peer hes left the network.
     */
    onMemberLeave: (id: number) => void;
    /**
     *  This handler is called when a message has been received from the network.
     */
    onMessage: (id: number, msg: UserDataType, isBroadcast: boolean) => void;
    joinSubject: Subject<Error | void>;
    serviceMessageSubject: Subject<ServiceMessageEncoded>;
    webRTCBuilder: WebRTCBuilder;
    webSocketBuilder: WebSocketBuilder;
    channelBuilder: ChannelBuilder;
    topologyService: TopologyInterface;
    state: WebChannelState;
    signaling: Signaling;
    private userMsg;
    private pingTime;
    private maxTime;
    private pingFinish;
    private pongNb;
    private rejoinTimer;
    private isRejoinDisabled;
    /**
     * @param options Web channel settings
     */
    constructor({topology, signalingURL, iceServers, autoRejoin}?: {
        topology?: Topology;
        signalingURL?: string;
        iceServers?: RTCIceServer[];
        autoRejoin?: boolean;
    });
    /**
     * Join the network via a key provided by one of the network member or a `Channel`.
     */
    join(key?: string): void;
    /**
     * Invite a server peer to join the network.
     */
    invite(url: string): void;
    /**
     * Close the connection with Signaling server.
     */
    closeSignaling(): void;
    /**
     * Leave the network which means close channels with all peers and connection
     * with Signaling server.
     */
    leave(): void;
    /**
     * Broadcast a message to the network.
     */
    send(data: UserDataType): void;
    /**
     * Send a message to a particular peer in the network.
     */
    sendTo(id: number, data: UserDataType): void;
    /**
     * Get the ping of the `network. It is an amount in milliseconds which
     * corresponds to the longest ping to each network member.
     */
    ping(): Promise<number>;
    onMemberJoinProxy(id: number): void;
    onMemberLeaveProxy(id: number): void;
    /**
     * Send service message to a particular peer in the network.
     */
    sendToProxy({senderId, recipientId, isService, content}?: {
        senderId?: number;
        recipientId?: number;
        isService?: boolean;
        content?: any;
    }): void;
    /**
     * Broadcast service message to the network.
     */
    sendProxy({senderId, recipientId, isService, content, isMeIncluded}?: {
        senderId?: number;
        recipientId?: number;
        isService?: boolean;
        content?: any;
        isMeIncluded?: boolean;
    }): void;
    encode({senderId, recipientId, isService, content}?: {
        senderId?: number;
        recipientId?: number;
        isService?: boolean;
        content?: any;
    }): Uint8Array;
    /**
     * Message handler. All messages arrive here first.
     */
    onMessageProxy(channel: Channel, bytes: Uint8Array): void;
    private treatMessage(channel, msg);
    private treatServiceMessage({channel, senderId, recipientId, msg});
    private setState(state);
    /**
     * Delegate adding a new peer in the network to topology.
     */
    private initChannel(ch);
    private setTopology(topology);
    private rejoin();
    /**
     * Generate random id for a `WebChannel` or a new peer.
     */
    private generateId(excludeIds?);
}

import { Subject } from 'rxjs/Subject';
import { Channel } from '../Channel';
import { Service } from './Service';
import { ChannelBuilder } from './ChannelBuilder';
import { WebSocketBuilder } from '../WebSocketBuilder';
import { WebRTCBuilder } from './WebRTCBuilder';
import { IMessage } from '../Protobuf';
import { UserDataType } from '../UserMessage';
import { TopologyInterface } from './topology/TopologyInterface';
export declare enum Topologies {
    FULL_MESH = 0,
}
export interface WebChannelOptions {
    topology: Topologies;
    signalingURL: string;
    iceServers: RTCIceServer[];
    autoRejoin: boolean;
}
export declare const wcDefaults: WebChannelOptions;
/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 * [[include:installation.md]]
 */
export declare class WebChannel extends Service {
    static JOINING: number;
    static JOINED: number;
    static LEFT: number;
    static SIGNALING_CONNECTING: number;
    static SIGNALING_OPEN: number;
    static SIGNALING_FIRST_CONNECTED: number;
    static SIGNALING_READY_TO_JOIN_OTHERS: number;
    static SIGNALING_CLOSED: number;
    /**
     * An array of all peer ids except yours.
     */
    readonly members: number[];
    /**
     * Topology id.
     */
    topology: number;
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
    onSignalingStateChanged: (state: number) => void;
    /**
     * Thi handler is called each time the state of the network changes.
     */
    onStateChanged: (state: number) => void;
    /**
     * This handler is called when a new peer has joined the network.
     */
    onPeerJoin: (id: number) => void;
    /**
     * This handler is called when a peer hes left the network.
     */
    onPeerLeave: (id: number) => void;
    /**
     *  This handler is called when a message has been received from the network.
     */
    onMessage: (id: number, msg: UserDataType, isBroadcast: boolean) => void;
    _joinResult: Subject<Error | void>;
    _webRTCBuilder: WebRTCBuilder;
    _webSocketBuilder: WebSocketBuilder;
    _channelBuilder: ChannelBuilder;
    _topology: TopologyInterface;
    _serviceMessageSubject: Subject<any>;
    private _state;
    private _signaling;
    private _userMsg;
    private _pingTime;
    private _maxTime;
    private _pingFinish;
    private _pongNb;
    private _rejoinTimer;
    private _isRejoinDisabled;
    /**
     * @param options Web channel settings
     */
    constructor({topology, signalingURL, iceServers, autoRejoin}?: {
        topology?: Topologies;
        signalingURL?: string;
        iceServers?: RTCIceServer[];
        autoRejoin?: boolean;
    });
    _setState(state: number): void;
    readonly state: number;
    readonly signalingState: number;
    readonly signalingURL: string;
    /**
     * Join the network via a key provided by one of the network member or a `Channel`.
     */
    join(value?: string | Channel): void;
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
    _onPeerJoin(id: number): void;
    _onPeerLeave(id: number): void;
    /**
     * Send service message to a particular peer in the network.
     */
    _sendTo({senderId, recipientId, isService, content}?: {
        senderId?: number;
        recipientId?: number;
        isService?: boolean;
        content?: any;
    }): void;
    /**
     * Broadcast service message to the network.
     */
    _send({senderId, recipientId, isService, content, isMeIncluded}?: {
        senderId?: number;
        recipientId?: number;
        isService?: boolean;
        content?: any;
        isMeIncluded?: boolean;
    }): void;
    _encode({senderId, recipientId, isService, content}?: {
        senderId?: number;
        recipientId?: number;
        isService?: boolean;
        content?: any;
    }): Uint8Array;
    _decode(bytes: Uint8Array): IMessage;
    /**
     * Message handler. All messages arrive here first.
     */
    _onMessage(channel: Channel, bytes: Uint8Array): void;
    private _treatMessage(channel, msg);
    private _treatServiceMessage({channel, senderId, recipientId, msg});
    /**
     * Delegate adding a new peer in the network to topology.
     */
    private _initChannel(ch);
    private _setTopology(topology);
    private _rejoin();
    /**
     * Generate random id for a `WebChannel` or a new peer.
     */
    private _generateId(excludeIds?);
}

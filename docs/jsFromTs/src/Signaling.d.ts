import { Observable } from 'rxjs';
import { IStream } from './misc/util';
import { IMessage, Message } from './proto/index';
import { WebChannel } from './WebChannel';
export declare type InSigMsg = Message;
export declare type OutSigMsg = IMessage;
export declare enum SignalingState {
    CONNECTING = 0,
    OPEN = 1,
    CHECKING = 2,
    CHECKED = 4,
    CLOSED = 3
}
/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export declare class Signaling implements IStream<OutSigMsg, InSigMsg> {
    readonly STREAM_ID: number;
    url: string;
    state: SignalingState;
    connected: boolean;
    private wc;
    private stateSubject;
    private ws;
    private connectionTimeout;
    private streamSubject;
    private heartbeatInterval;
    private missedHeartbeat;
    constructor(wc: WebChannel, url: string);
    readonly messageFromStream: Observable<InSigMsg>;
    sendOverStream(msg: OutSigMsg): void;
    readonly onState: Observable<SignalingState>;
    check(): void;
    connect(key: string): void;
    /**
     * Close the `WebSocket` with Signaling server.
     */
    close(): void;
    private clean;
    private handleMessage;
    private setState;
    private startHeartbeat;
    private send;
    private heartbeat;
    private fullUrl;
}

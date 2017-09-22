import { Observable } from 'rxjs/Observable';
import { Channel } from './Channel';
import { WebChannel } from './service/WebChannel';
export declare enum SignalingState {
    CONNECTING = 0,
    OPEN = 1,
    FIRST_CONNECTED = 2,
    READY_TO_JOIN_OTHERS = 3,
    CLOSED = 4,
}
/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export declare class Signaling {
    url: string;
    state: SignalingState;
    private wc;
    private stateSubject;
    private channelSubject;
    private rxWs;
    private pingInterval;
    private pongReceived;
    constructor(wc: WebChannel, url: string);
    readonly onState: Observable<SignalingState>;
    readonly onChannel: Observable<Channel>;
    /**
     * Notify Signaling server that you had joined the network and ready
     * to join new peers to the network.
     */
    open(): void;
    join(key: string): void;
    /**
     * Close the `WebSocket` with Signaling server.
     */
    close(): void;
    private setState(state);
    private startPingInterval();
    private createRxWs(ws);
    private getFullURL(params);
}

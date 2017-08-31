import { Observable } from 'rxjs/Observable';
import { WebChannel } from './service/WebChannel';
import { Channel } from './Channel';
/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export declare class Signaling {
    static CONNECTING: number;
    static OPEN: number;
    static FIRST_CONNECTED: number;
    static READY_TO_JOIN_OTHERS: number;
    static CLOSED: number;
    url: string;
    state: number;
    private wc;
    private stateSubject;
    private channelSubject;
    private rxWs;
    private pingInterval;
    private pongReceived;
    constructor(wc: WebChannel, url: string);
    readonly onState: Observable<number>;
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
}

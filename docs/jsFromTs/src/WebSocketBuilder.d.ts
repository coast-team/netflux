import { BehaviorSubject, Observable } from 'rxjs';
import { Channel } from './Channel';
import { WebChannel } from './WebChannel';
export declare const CONNECT_TIMEOUT = 4000;
/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export declare class WebSocketBuilder {
    static readonly listenUrl: BehaviorSubject<string>;
    private readonly wc;
    private readonly channelsSubject;
    constructor(wc: WebChannel);
    readonly channels: Observable<{
        id: number;
        channel: Channel;
    }>;
    newWebSocket(ws: WebSocket, id: number, type: number): void;
    connect(url: string, type: number, targetId: number, myId: number, wcId: number): Promise<void>;
    private composeUrl;
}

import 'rxjs/add/operator/filter';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Channel } from './service/Channel';
import { WebChannel } from './service/WebChannel';
/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export declare class WebSocketBuilder {
    static listen(): BehaviorSubject<string>;
    static newIncomingSocket(wc: any, ws: any, senderId: any): void;
    private wc;
    private channelsSubject;
    constructor(wc: WebChannel);
    readonly onChannel: Observable<Channel>;
    /**
     * Establish `WebSocket` with a server.
     *
     * @param url Server url
     */
    connect(url: string): Promise<WebSocket>;
    /**
     * Establish a `Channel` with a server peer identified by `id`.
     *
     * @param url Server url
     * @param id  Peer id
     */
    connectTo(url: string, id: number): Promise<Channel>;
}

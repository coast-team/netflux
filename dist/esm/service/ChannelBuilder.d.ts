import { Observable } from 'rxjs/Observable';
import { Channel } from './Channel';
import { Service } from './Service';
import { WebChannel } from './WebChannel';
/**
 * It is responsible to build a channel between two peers with a help of `WebSocketBuilder` and `WebRTCBuilder`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
export declare class ChannelBuilder extends Service {
    private wc;
    private pendingRequests;
    private channelsSubject;
    constructor(wc: WebChannel);
    readonly onChannel: Observable<Channel>;
    /**
     * Establish a `Channel` with the peer identified by `id`.
     */
    connectTo(id: number): Promise<Channel>;
    private handleChannel(ch);
    private treatServiceMessage({channel, senderId, recipientId, msg});
}

import { Observable } from 'rxjs';
import { Channel } from '../../Channel';
import '../../misc/env';
import { dataChannelBuilder as proto } from '../../proto/index';
import { WebChannel } from '../../WebChannel';
import { Service } from '../Service';
export declare const CONNECT_TIMEOUT = 9000;
/**
 * Service class responsible to establish `RTCDataChannel` between two remotes via
 * signaling server or `WebChannel`.
 */
export declare class DataChannelBuilder extends Service<proto.IMessage, proto.Message> {
    static readonly SERVICE_ID: number;
    private readonly remotes;
    private readonly channelsSubject;
    private rtcConfiguration;
    private allStreams;
    private wc;
    constructor(wc: WebChannel, rtcConfiguration: RTCConfiguration);
    readonly channels: Observable<{
        id: number;
        channel: Channel;
    }>;
    /**
     * Establish an `RTCDataChannel`. Starts by sending an **SDP offer**.
     */
    connect(targetId: number, myId: number, type: number): Promise<void>;
    clean(id?: number): void;
    private createRemote;
}

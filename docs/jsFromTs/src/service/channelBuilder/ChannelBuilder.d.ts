import { Observable } from 'rxjs';
import { Channel } from '../../Channel';
import { channelBuilder as proto } from '../../proto/index';
import { WebChannel } from '../../WebChannel';
import { Service } from '../Service';
/**
 * It is responsible to build a channel between two peers with a help of `WebSocketBuilder` and `DataChannelBuilder`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
export declare class ChannelBuilder extends Service<proto.IMessage, proto.Message> {
    static readonly SERVICE_ID: number;
    private static connectResTrueEncoded;
    private static connectResFalseEncoded;
    onConnectionRequest: (streamId: number, data: Uint8Array) => boolean;
    private negotiationEncoded;
    private allStreams;
    private wc;
    private dataChannelBuilder;
    private channelsSubject;
    private connectsInProgress;
    private myInfo;
    constructor(wc: WebChannel);
    clean(): void;
    readonly onChannel: Observable<Channel>;
    connectOverWebChannel(id: number, cb?: () => void, data?: Uint8Array): Promise<void>;
    connectOverSignaling(cb?: () => void, data?: Uint8Array): Promise<void>;
    private connectOver;
    private handleMessage;
    private proceedNegotiation;
    private tryWs;
    private tryDc;
    private getType;
    private isNagotiable;
    private subscribeToChannels;
    private subscribeToURLandIDChange;
    private rejectConnection;
}

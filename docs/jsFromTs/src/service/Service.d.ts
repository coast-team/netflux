import { Observable } from 'rxjs';
import { Channel } from '../Channel';
import { IStream } from '../misc/util';
import { InSigMsg, OutSigMsg } from '../Signaling';
import { InWcMsg, OutWcMessage, WebChannel } from '../WebChannel';
export interface IMessageFactory<OutMsg, InMsg extends OutMsg> {
    create: (properties?: OutMsg) => InMsg;
    encode: (message: OutMsg) => {
        finish: () => Uint8Array;
    };
    decode: (reader: Uint8Array) => InMsg;
}
export interface IWebChannelStream<OutMsg, InMsg> {
    id: number;
    message: Observable<{
        senderId: number;
        msg: InMsg;
        channel: Channel;
        recipientId: number;
    }>;
    send: (msg: Uint8Array | OutMsg, recipientId: number) => void;
}
export interface ISignalingStream<OutMsg, InMsg> {
    id: number;
    message: Observable<{
        senderId: number;
        recipientId: number;
        msg: InMsg;
    }>;
    send: (msg: Uint8Array | OutMsg, recipientId: number, senderId: number) => void;
}
export interface IAllStreams<OutMsg, InMsg> {
    message: Observable<{
        streamId: number;
        senderId: number;
        recipientId: number;
        msg: InMsg;
    }>;
    sendOver: (streamId: number, msg: Uint8Array | OutMsg, recipientId: number, senderId: number) => void;
}
/**
 * Services are specific classes. Instance of such class communicates via
 * network with another instance of the same class. Indeed each peer in the
 * network instantiates its own service.
 * Each service has `.proto` file containing the desciption of its
 * communication protocol.
 */
export declare abstract class Service<OutMsg, InMsg extends OutMsg> {
    private serviceId;
    private proto;
    constructor(serviceId: number, proto: IMessageFactory<OutMsg, InMsg>);
    protected useWebChannelStream(wc: IStream<OutWcMessage, InWcMsg> & WebChannel): IWebChannelStream<OutMsg, InMsg>;
    protected useSignalingStream(sig: IStream<OutSigMsg, InSigMsg>): ISignalingStream<OutMsg, InMsg>;
    protected useAllStreams(wc: IStream<OutWcMessage, InWcMsg> & WebChannel, sig: IStream<OutSigMsg, InSigMsg>): IAllStreams<OutMsg, InMsg>;
    /**
     * Encode service message for sending over the network.
     *
     * @param msg Service specific message object
     */
    protected encode(msg: OutMsg): Uint8Array;
    /**
     * Decode service message received from the network.
     *
     * @return  Service specific message object
     */
    protected decode(bytes: Uint8Array): InMsg;
}

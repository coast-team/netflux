import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Channel } from './Channel';
export interface IServiceMessageEncoded {
    channel: Channel;
    senderId: number;
    recipientId: number;
    id: number;
    content: Uint8Array;
}
export interface IServiceMessageDecoded {
    channel: Channel;
    senderId: number;
    recipientId: number;
    msg: any;
}
/**
 * Services are specific classes. Instance of such class communicates via
 * network with another instance of the same class. Indeed each peer in the
 * network instantiates its own service.
 * Each service has `.proto` file containing the desciption of its
 * communication protocol.
 */
export declare abstract class Service {
    static encodeServiceMessage(serviceId: any, content: Uint8Array): Uint8Array;
    serviceId: number;
    protected onServiceMessage: Observable<IServiceMessageDecoded>;
    private protoMessage;
    constructor(id: number, protoMessage: any, serviceMessageSubject?: Subject<IServiceMessageEncoded>);
    /**
     * Encode service message for sending over the network.
     *
     * @param msg Service specific message object
     */
    encode(msg: any): Uint8Array;
    /**
     * Decode service message received from the network.
     *
     * @return  Service specific message object
     */
    decode(bytes: Uint8Array): any;
    protected setupServiceMessage(serviceMessageSubject: Subject<IServiceMessageEncoded>): void;
}

import { userMessage as proto } from '../proto/index';
import { Service } from '../service/Service';
export declare type UserDataType = Uint8Array | string;
/**
 * Message builder service is responsible to build messages to send them over the
 * `WebChannel` and treat messages received by the `WebChannel`. It also manage
 * big messages (more then 16ko) sent by users. Internal messages are always less
 * 16ko.
 */
export declare class UserMessage extends Service<proto.IMessage, proto.Message> {
    static readonly SERVICE_ID: number;
    private buffers;
    constructor();
    clean(): void;
    /**
     * Encode user message for sending over the network.
     */
    encodeUserMessage(data: UserDataType): Uint8Array[];
    /**
     * Decode user message received from the network.
     */
    decodeUserMessage(bytes: Uint8Array, senderId: number): UserDataType | undefined;
    /**
     * Identify the user data type.
     */
    private userDataToType;
    private getBuffer;
    private setBuffer;
}

export declare type UserDataType = Uint8Array | string;
/**
 * Message builder service is responsible to build messages to send them over the
 * `WebChannel` and treat messages received by the `WebChannel`. It also manage
 * big messages (more then 16ko) sent by users. Internal messages are always less
 * 16ko.
 */
export declare class UserMessage {
    private buffers;
    constructor();
    /**
     * Encode user message for sending over the network.
     */
    encode(data: any): Uint8Array[];
    /**
     * Decode user message received from the network.
     */
    decode(bytes: Uint8Array, senderId: number): UserDataType;
    /**
     * Identify the user data type.
     */
    private userDataToType(data);
    private getBuffer(peerId, msgId);
    private setBuffer(peerId, msgId, buffer);
}

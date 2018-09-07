import { RTCDataChannel } from './misc/env';
import { IMessage } from './proto/index';
import { WebChannel } from './WebChannel';
export interface IChannelInitData {
    members: number[];
}
export declare const MAXIMUM_MISSED_HEARTBEAT = 3;
/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export declare class Channel {
    static WITH_INTERNAL: number;
    static WITH_JOINING: number;
    static WITH_MEMBER: number;
    static remoteType(type: number): number;
    id: number;
    send: (data: Uint8Array) => void;
    type: number;
    missedHeartbeat: number;
    init: Promise<void>;
    initData: IChannelInitData | undefined;
    /**
     * Id of the peer who is at the other end of this channel.
     */
    private wsOrDc;
    private pc;
    private wc;
    private heartbeatMsg;
    private resolveInit;
    /**
     * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
     */
    constructor(wc: WebChannel, wsOrDc: WebSocket | RTCDataChannel, type: number, id: number, pc?: RTCPeerConnection);
    readonly url: string;
    encodeAndSend({ senderId, recipientId, serviceId, content }?: IMessage): void;
    close(): void;
    sendHeartbeat(): void;
    private sendInBrowser;
    private sendInNodeOverWebSocket;
    private sendInNodeOverDataChannel;
    private handleInitMessage;
    private initHandlers;
    private createHeartbeatMsg;
    private sendInitPing;
}

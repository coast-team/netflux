import { Service } from './Service';
import { WebChannel } from './WebChannel';
/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export declare class Channel extends Service {
    connection: WebSocket | RTCDataChannel;
    /**
     * Id of the peer who is at the other end of this channel.
     */
    id: number;
    send: (data: Uint8Array) => void;
    isIntermediary: boolean;
    private rtcPeerConnection;
    private onClose;
    private wc;
    private pongReceived;
    private pingMsg;
    private pongMsg;
    /**
     * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
     */
    constructor(wc: WebChannel, connection: WebSocket | RTCDataChannel, options?: {
        rtcPeerConnection?: RTCPeerConnection;
        id: number;
    });
    markAsIntermediry(): void;
    close(): void;
    closeQuietly(): void;
    private sendInBrowser(data);
    private sendInNodeViaWebSocket(data);
    private sendInNodeViaDataChannel(data);
    private isOpen();
    private ping();
}

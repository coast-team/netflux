import { WebChannel } from './service/WebChannel';
/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export declare class Channel {
    connection: WebSocket | RTCDataChannel;
    /**
     * Id of the peer who is at the other end of this channel.
     */
    id: number;
    send: (data: Uint8Array) => void;
    private rtcPeerConnection;
    private onClose;
    private wc;
    /**
     * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
     */
    constructor(wc: WebChannel, connection: WebSocket | RTCDataChannel, options?: {
        rtcPeerConnection?: RTCPeerConnection;
        id: number;
    });
    close(): void;
    private sendInBrowser(data);
    private sendInNodeViaWebSocket(data);
    private sendInNodeViaDataChannel(data);
    private isOpen();
}

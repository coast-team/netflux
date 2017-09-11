import { isBrowser, isFirefox } from './misc/Util';
/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {
    /**
     * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
     */
    constructor(wc, connection, options = { id: -1 }) {
        this.wc = wc;
        this.connection = connection;
        this.peerId = options.id;
        this.rtcPeerConnection = options.rtcPeerConnection;
        // Configure `send` function
        if (isBrowser) {
            connection.binaryType = 'arraybuffer';
            this.send = this.sendInBrowser;
        }
        else if (!this.rtcPeerConnection) {
            this.send = this.sendInNodeViaWebSocket;
        }
        else {
            connection.binaryType = 'arraybuffer';
            this.send = this.sendInNodeViaDataChannel;
        }
        this.onClose = (evt) => {
            console.info(`NETFLUX: ${wc.myId} ONCLOSE CALLBACK ${this.peerId}`, {
                readyState: this.connection.readyState,
                iceConnectionState: this.rtcPeerConnection ? this.rtcPeerConnection.iceConnectionState : '',
                signalingState: this.rtcPeerConnection ? this.rtcPeerConnection.signalingState : ''
            });
            this.connection.onclose = () => { };
            this.connection.onmessage = () => { };
            this.connection.onerror = () => { };
            wc.topologyService.onChannelClose(evt, this);
            if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
                this.rtcPeerConnection.close();
            }
        };
        // Configure handlers
        this.connection.onmessage = ({ data }) => wc.onMessageProxy(this, new Uint8Array(data));
        this.connection.onclose = evt => this.onClose(evt);
        this.connection.onerror = evt => wc.topologyService.onChannelError(evt, this);
    }
    close() {
        if (this.connection.readyState !== 'closed' &&
            this.connection.readyState !== 'closing' &&
            this.connection.readyState !== WebSocket.CLOSED &&
            this.connection.readyState !== WebSocket.CLOSING) {
            console.info(`NETFLUX: ${this.wc.myId} CLOSE ${this.peerId}`, {
                readyState: this.connection.readyState,
                iceConnectionState: this.rtcPeerConnection ? this.rtcPeerConnection.iceConnectionState : '',
                signalingState: this.rtcPeerConnection ? this.rtcPeerConnection.signalingState : ''
            });
            this.connection.close();
            if (isFirefox && this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
                this.onClose(new Event('close'));
            }
        }
    }
    sendInBrowser(data) {
        // if (this.connection.readyState !== 'closed' && new Int8Array(data).length !== 0) {
        if (this.isOpen()) {
            try {
                this.connection.send(data);
            }
            catch (err) {
                console.error(`Channel send: ${err.message}`);
            }
        }
    }
    sendInNodeViaWebSocket(data) {
        if (this.isOpen()) {
            try {
                this.connection.send(data, { binary: true });
            }
            catch (err) {
                console.error(`Channel send: ${err.message}`);
            }
        }
    }
    sendInNodeViaDataChannel(data) {
        this.sendInBrowser(data.slice(0));
    }
    isOpen() {
        return this.connection.readyState === WebSocket.OPEN || this.connection.readyState === 'open';
    }
}

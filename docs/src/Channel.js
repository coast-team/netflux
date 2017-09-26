import { isBrowser, isFirefox, log } from './misc/Util';
/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {
    /**
     * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
     */
    constructor(wc, connection, options = { id: -1 }) {
        log.info('I have just connected with ' + options.id);
        this.wc = wc;
        this.connection = connection;
        this.id = options.id;
        this.rtcPeerConnection = options.rtcPeerConnection;
        this.isIntermediary = false;
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
            log.info(`Channel with ${this.id} has closed`, {
                iceConnectionState: this.rtcPeerConnection ? this.rtcPeerConnection.iceConnectionState : '',
            });
            this.connection.onclose = () => { };
            this.connection.onmessage = () => { };
            this.connection.onerror = () => { };
            wc.topologyService.onChannelClose(evt, this);
            if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
                log.info(`I am closing peer connection with ${this.id}`, {
                    iceConnectionState: this.rtcPeerConnection ? this.rtcPeerConnection.iceConnectionState : '',
                });
                this.rtcPeerConnection.close();
            }
        };
        // Configure handlers
        this.connection.onmessage = ({ data }) => wc.onMessageProxy(this, new Uint8Array(data));
        this.connection.onclose = (evt) => this.onClose(evt);
        this.connection.onerror = (evt) => wc.topologyService.onChannelError(evt, this);
    }
    markAsIntermediry() {
        this.wc.topologyService.initIntermediary(this);
    }
    close() {
        if (this.connection.readyState !== 'closed' &&
            this.connection.readyState !== 'closing' &&
            this.connection.readyState !== WebSocket.CLOSED &&
            this.connection.readyState !== WebSocket.CLOSING) {
            log.info(`I am closing channel with ${this.id}`);
            this.connection.close();
            if (isFirefox && this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
                this.onClose(new global.Event('close'));
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

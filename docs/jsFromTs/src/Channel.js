import { isBrowser, log } from './misc/Util';
/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {
    /**
     * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
     */
    constructor(wc, connection, options = { id: -1 }) {
        log.info(`new connection: Me: ${wc.myId} with ${options.id}`);
        this.wc = wc;
        this.connection = connection;
        this._id = options.id;
        this.rtcPeerConnection = options.rtcPeerConnection;
        this.isIntermediary = false;
        this.missedHeartbeat = 0;
        this.updateHeartbeatMsg(null);
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
        // Configure handlers
        this.connection.onmessage = ({ data }) => wc.onMessageProxy(this, new Uint8Array(data));
        this.connection.onclose = (evt) => {
            log.info(`Connection with ${this.id} has closed`);
            this.connection.onclose = () => { };
            this.connection.onmessage = () => { };
            this.connection.onerror = () => { };
            wc.topologyService.onChannelClose(evt, this);
            if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
                this.rtcPeerConnection.close();
            }
        };
        this.connection.onerror = (evt) => {
            this.connection.onclose = () => { };
            this.connection.onmessage = () => { };
            this.connection.onerror = () => { };
            wc.topologyService.onChannelError(evt, this);
            if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
                this.rtcPeerConnection.close();
            }
        };
    }
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
        this.updateHeartbeatMsg(this.topologyHeartbeatMsg);
    }
    markAsIntermediry() {
        this.wc.topologyService.initIntermediary(this);
    }
    close() {
        if (this.connection.readyState !== 'closed' &&
            this.connection.readyState !== 'closing' &&
            this.connection.readyState !== WebSocket.CLOSED &&
            this.connection.readyState !== WebSocket.CLOSING) {
            log.info(`I:${this.wc.myId} close connection with ${this.id}`);
            if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
                this.rtcPeerConnection.close();
            }
            else {
                this.connection.close();
            }
        }
    }
    closeQuietly() {
        this.connection.onmessage = undefined;
        this.connection.onclose = undefined;
        this.connection.onerror = undefined;
        this.close();
    }
    sendHeartbeat() {
        this.send(this.fullHeartbeatMsg);
    }
    updateHeartbeatMsg(heartbeatMsg) {
        this.topologyHeartbeatMsg = heartbeatMsg;
        this.fullHeartbeatMsg = this.wc.encode({ recipientId: this._id, content: heartbeatMsg });
    }
    sendInBrowser(data) {
        try {
            this.connection.send(data);
        }
        catch (err) {
            console.error('Channel send', err);
        }
    }
    sendInNodeViaWebSocket(data) {
        try {
            this.connection.send(data, { binary: true });
        }
        catch (err) {
            console.error('Channel send', err);
        }
    }
    sendInNodeViaDataChannel(data) {
        this.sendInBrowser(data.slice(0));
    }
}

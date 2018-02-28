import { isBrowser, log } from './misc/Util';
/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {
    /**
     * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
     */
    constructor(wc, connection, options = { id: 1 }) {
        log.channel(`New Channel: Me: ${wc.myId} with ${options.id}`);
        this.wc = wc;
        this.connection = connection;
        this._id = options.id;
        this.rtcPeerConnection = options.rtcPeerConnection;
        this.isIntermediary = false;
        this.missedHeartbeat = 0;
        this.updateHeartbeatMsg(this.wc.topologyService.heartbeat);
        if (this.rtcPeerConnection) {
            this.maximumMissedHeartBeat = 3;
        }
        else {
            this.maximumMissedHeartBeat = 5;
        }
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
            log.channel(`Connection with ${this.id} has closed`);
            wc.topologyService.onChannelClose(evt, this);
        };
        this.connection.onerror = (evt) => {
            log.channel('Channel error: ', evt);
            wc.topologyService.onChannelError(evt, this);
            this.close();
        };
    }
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
        this.fullHeartbeatMsg = this.wc.encode({ recipientId: value, content: this.topologyHeartbeatMsg });
    }
    close() {
        this.connection.close();
        if (this.rtcPeerConnection) {
            this.rtcPeerConnection.close();
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
            log.channel('Channel sendInBrowser ERROR', err);
        }
    }
    sendInNodeViaWebSocket(data) {
        try {
            this.connection.send(data, { binary: true });
        }
        catch (err) {
            log.channel('Channel sendInNodeViaWebSocket ERROR', err);
        }
    }
    sendInNodeViaDataChannel(data) {
        this.sendInBrowser(data.slice(0));
    }
}

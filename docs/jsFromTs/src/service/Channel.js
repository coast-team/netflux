import { isBrowser, isFirefox, log } from '../misc/Util';
import { channel as channelProto } from '../proto';
import { Service } from './Service';
/**
 * Service id.
 */
const ID = 400;
const WEBSOCKET_PING_TIMEOUT = 3000;
const WEBSOCKET_PING_START_DELAY = 2000;
/* Preconstructed messages */
const pingMsg = Service.encodeServiceMessage(ID, channelProto.Message.encode(channelProto.Message.create({ ping: true })).finish());
const pongMsg = Service.encodeServiceMessage(ID, channelProto.Message.encode(channelProto.Message.create({ pong: true })).finish());
/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel extends Service {
    /**
     * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
     */
    constructor(wc, connection, options = { id: -1 }) {
        super(ID, channelProto.Message, wc.serviceMessageSubject);
        log.info(`new connection: Me: ${wc.myId} with ${options.id}`);
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
            log.info(`Connection with ${this.id} has closed`);
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
        this.connection.onclose = (evt) => this.onClose(evt);
        this.connection.onerror = (evt) => wc.topologyService.onChannelError(evt, this);
        // Start ping interval for WebSocket
        if (!this.rtcPeerConnection) {
            this.onServiceMessage.subscribe(({ msg }) => {
                if (msg.ping) {
                    this.send(this.wc.encode({ recipientId: this.id, content: pongMsg }));
                }
                else if (msg.pong) {
                    this.pongReceived = true;
                }
                else {
                    log.warn('Unknown message from Channel service', msg);
                }
            });
            global.setTimeout(() => {
                this.ping();
            }, WEBSOCKET_PING_START_DELAY);
        }
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
            this.connection.close();
            if (isFirefox && this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
                this.onClose(new global.Event('close'));
            }
        }
    }
    closeQuietly() {
        this.connection.onmessage = undefined;
        this.connection.onclose = undefined;
        this.connection.onerror = undefined;
        if (this.rtcPeerConnection) {
            this.rtcPeerConnection.oniceconnectionstatechange = undefined;
        }
        log.info(`I:${this.wc.myId} close QUIETLY connection with ${this.id}`);
        this.connection.close();
        if (this.rtcPeerConnection && this.rtcPeerConnection.signalingState !== 'closed') {
            this.rtcPeerConnection.close();
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
    ping() {
        this.pongReceived = false;
        if (this.isOpen()) {
            this.send(this.wc.encode({ recipientId: this.id, content: pingMsg }));
            global.setTimeout(() => {
                if (this.isOpen()) {
                    if (this.pongReceived) {
                        this.ping();
                    }
                    else {
                        this.close();
                    }
                }
            }, WEBSOCKET_PING_TIMEOUT);
        }
    }
}

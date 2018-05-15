import { Subject } from 'rxjs';
import { isBrowser, isWebSocketSupported, log } from './misc/util';
import { Message, signaling as proto } from './proto';
const MAXIMUM_MISSED_HEARTBEAT = 3;
const HEARTBEAT_INTERVAL = 5000;
/* Preconstructed messages */
const heartbeatMsg = proto.Message.encode(proto.Message.create({ heartbeat: true })).finish();
export var SignalingState;
(function (SignalingState) {
    SignalingState[SignalingState["CONNECTING"] = 0] = "CONNECTING";
    SignalingState[SignalingState["OPEN"] = 1] = "OPEN";
    SignalingState[SignalingState["CHECKING"] = 2] = "CHECKING";
    SignalingState[SignalingState["CHECKED"] = 4] = "CHECKED";
    SignalingState[SignalingState["CLOSED"] = 3] = "CLOSED";
})(SignalingState || (SignalingState = {}));
/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export class Signaling {
    constructor(wc, url) {
        this.STREAM_ID = 1;
        this.wc = wc;
        this.url = url;
        this.state = SignalingState.CLOSED;
        this.connected = false;
        this.missedHeartbeat = 0;
        this.streamSubject = new Subject();
        this.stateSubject = new Subject();
    }
    get messageFromStream() {
        return this.streamSubject.asObservable();
    }
    sendOverStream(msg) {
        log.signaling(this.wc.myId + ' Forward message', msg);
        this.send({
            content: {
                id: msg.recipientId,
                lastData: msg.content === undefined,
                data: Message.encode(Message.create(msg)).finish(),
            },
        });
    }
    get onState() {
        return this.stateSubject.asObservable();
    }
    check() {
        this.setState(SignalingState.CHECKING);
        this.send({
            connect: { id: this.wc.myId, members: this.wc.members.filter((id) => id !== this.wc.myId) },
        });
    }
    connect(key) {
        if (isWebSocketSupported()) {
            this.setState(SignalingState.CONNECTING);
            this.ws = new global.WebSocket(this.fullUrl(key));
            this.ws.binaryType = 'arraybuffer';
            this.connectionTimeout = setTimeout(() => {
                if (this.ws && this.ws.readyState !== this.ws.OPEN) {
                    log.signaling(`Failed to connect to Signaling server ${this.url}: connection timeout`);
                    this.close();
                }
            }, 10000);
            this.ws.onopen = () => {
                this.setState(SignalingState.OPEN);
                if (this.connectionTimeout) {
                    clearTimeout(this.connectionTimeout);
                }
                this.startHeartbeat();
            };
            this.ws.onerror = (err) => log.signaling(`WebSocket ERROR`, err);
            this.ws.onclose = (closeEvt) => {
                this.clean();
                this.setState(SignalingState.CLOSED);
            };
            this.ws.onmessage = ({ data }) => this.handleMessage(data);
        }
        else {
            throw new Error('Failed to join over Signaling: WebSocket is not supported by your environment');
        }
    }
    /**
     * Close the `WebSocket` with Signaling server.
     */
    close() {
        if (this.state !== SignalingState.CLOSED) {
            if (this.ws) {
                this.ws.onmessage = () => { };
                this.ws.onclose = () => { };
                this.ws.onerror = () => { };
                this.ws.close(1000);
            }
            this.clean();
            this.setState(SignalingState.CLOSED);
        }
    }
    clean() {
        if (this.connectionTimeout) {
            global.clearTimeout(this.connectionTimeout);
        }
        if (this.heartbeatInterval) {
            global.clearInterval(this.heartbeatInterval);
        }
        this.ws = undefined;
    }
    handleMessage(bytes) {
        const msg = proto.Message.decode(new Uint8Array(bytes));
        switch (msg.type) {
            case 'heartbeat':
                this.missedHeartbeat = 0;
                break;
            case 'connected':
                this.connected = msg.connected;
                this.setState(SignalingState.CHECKED);
                if (!msg.connected) {
                    this.wc.channelBuilder.connectOverSignaling().catch(() => this.check());
                }
                break;
            case 'content': {
                const { data, id } = msg.content;
                const streamMessage = Message.decode(data);
                streamMessage.senderId = id;
                log.signaling('StreamMessage RECEIVED: ', streamMessage);
                this.streamSubject.next(streamMessage);
                break;
            }
        }
    }
    setState(state) {
        if (this.state !== state) {
            this.state = state;
            this.stateSubject.next(state);
        }
    }
    startHeartbeat() {
        this.missedHeartbeat = 0;
        this.heartbeatInterval = global.setInterval(() => {
            try {
                this.missedHeartbeat++;
                if (this.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
                    throw new Error('Too many missed heartbeats');
                }
                this.heartbeat();
            }
            catch (err) {
                this.close();
            }
        }, HEARTBEAT_INTERVAL);
    }
    send(msg) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(proto.Message.encode(proto.Message.create(msg)).finish());
            }
            catch (err) {
                log.signaling('Failed send to Signaling', err);
            }
        }
    }
    heartbeat() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(heartbeatMsg);
            }
            catch (err) {
                log.signaling('Failed send to Signaling: ' + err.message);
            }
        }
    }
    fullUrl(key) {
        const urlWithKey = this.url.endsWith('/') ? this.url + key : this.url + '/' + key;
        if (isBrowser) {
            return urlWithKey;
        }
        else {
            return urlWithKey + '?favored';
        }
    }
}

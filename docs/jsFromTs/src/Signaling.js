import { filter, pluck } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import { log } from './misc/Util';
import { signaling as sigProto } from './proto';
const MAXIMUM_MISSED_HEARTBEAT = 3;
const HEARTBEAT_INTERVAL = 5000;
/* WebSocket error codes */
const HEARTBEAT_ERROR_CODE = 4002;
const MESSAGE_ERROR_CODE = 4010;
/* Preconstructed messages */
const heartbeatMsg = sigProto.Message.encode(sigProto.Message.create({ heartbeat: true })).finish();
export var SignalingState;
(function (SignalingState) {
    SignalingState[SignalingState["CONNECTING"] = 0] = "CONNECTING";
    SignalingState[SignalingState["CONNECTED"] = 1] = "CONNECTED";
    SignalingState[SignalingState["STABLE"] = 2] = "STABLE";
    SignalingState[SignalingState["CLOSING"] = 3] = "CLOSING";
    SignalingState[SignalingState["CLOSED"] = 4] = "CLOSED";
})(SignalingState || (SignalingState = {}));
/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export class Signaling {
    constructor(wc, url) {
        // public
        this.url = url;
        this.state = SignalingState.CLOSED;
        // private
        this.wc = wc;
        this.completeWs = () => { };
        this.stateSubject = new Subject();
        this.channelSubject = new Subject();
    }
    get onState() {
        return this.stateSubject.asObservable();
    }
    get onChannel() {
        return this.channelSubject.asObservable();
    }
    /**
     * Notify Signaling server that you had joined the network and ready
     * to join new peers to the network.
     */
    open() {
        if (this.state === SignalingState.CONNECTED) {
            this.send({ stable: true });
            this.setState(SignalingState.STABLE);
        }
    }
    join(key) {
        if (this.state !== SignalingState.CLOSING && this.state !== SignalingState.CLOSED) {
            this.ws.onclose = () => { };
            this.ws.onmessage = () => { };
            this.ws.onerror = () => { };
            clearInterval(this.heartbeatInterval);
            this.missedHeartbeat = 0;
            this.completeWs();
            this.ws.close();
        }
        this.setState(SignalingState.CONNECTING);
        this.wc.webSocketBuilder
            .connect(this.getFullURL(key))
            .then((ws) => {
            this.ws = ws;
            this.wsObservable = this.createObservable(this.ws);
            this.startHeartbeat();
            this.wsObservable.subscribe((msg) => {
                switch (msg.type) {
                    case 'heartbeat':
                        this.missedHeartbeat = 0;
                        break;
                    case 'isFirst':
                        if (msg.isFirst) {
                            this.setState(SignalingState.STABLE);
                        }
                        else {
                            this.connectOverSignaling();
                        }
                        break;
                }
            });
        })
            .catch(() => this.setState(SignalingState.CLOSED));
    }
    /**
     * Close the `WebSocket` with Signaling server.
     */
    close() {
        if (this.state !== SignalingState.CLOSING && this.state !== SignalingState.CLOSED) {
            this.setState(SignalingState.CLOSING);
            if (this.ws) {
                this.ws.close(1000);
            }
        }
    }
    connectOverSignaling() {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.wc.webRTCBuilder.connectOverSignaling(this.getWebRTCStream())
                .then(() => this.setState(SignalingState.CONNECTED))
                .catch(() => this.send({ tryAnother: true }));
        }
    }
    setState(state) {
        if (this.state !== state) {
            this.state = state;
            this.stateSubject.next(state);
            if (state === SignalingState.STABLE) {
                this.wc.webRTCBuilder
                    .onChannelFromSignaling(this.getWebRTCStream())
                    .subscribe((ch) => this.channelSubject.next(ch));
            }
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
                global.clearInterval(this.heartbeatInterval);
                log.signaling('Closing connection with Signaling. Reason: ' + err.message);
                this.setState(SignalingState.CLOSING);
                this.ws.close(HEARTBEAT_ERROR_CODE, 'Signaling is not responding');
            }
        }, HEARTBEAT_INTERVAL);
    }
    createObservable(ws) {
        const subject = new Subject();
        this.completeWs = () => subject.complete();
        ws.binaryType = 'arraybuffer';
        ws.onmessage = (evt) => {
            try {
                subject.next(sigProto.Message.decode(new Uint8Array(evt.data)));
            }
            catch (err) {
                ws.close(MESSAGE_ERROR_CODE, err.message);
            }
        };
        ws.onerror = (err) => subject.error(err);
        ws.onclose = (closeEvt) => {
            clearInterval(this.heartbeatInterval);
            this.missedHeartbeat = 0;
            this.setState(SignalingState.CLOSED);
            subject.complete();
            log.signaling(`Connection with Signaling '${this.url}' closed: ${closeEvt.code}: ${closeEvt.reason}`);
        };
        return subject.asObservable();
    }
    send(msg) {
        if (this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(sigProto.Message.encode(sigProto.Message.create(msg)).finish());
            }
            catch (err) {
                log.signaling('Failed send to Signaling: ' + err.message);
            }
        }
    }
    heartbeat() {
        if (this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(heartbeatMsg);
            }
            catch (err) {
                log.signaling('Failed send to Signaling: ' + err.message);
            }
        }
    }
    getWebRTCStream() {
        return {
            message: this.wsObservable
                .pipe(filter(({ type }) => type === 'content'), pluck('content')),
            send: (m) => this.send({ content: m }),
        };
    }
    getFullURL(params) {
        if (this.url.endsWith('/')) {
            return this.url + params;
        }
        else {
            return this.url + '/' + params;
        }
    }
}

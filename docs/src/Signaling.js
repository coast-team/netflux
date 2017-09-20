import { Subject } from 'rxjs/Subject';
import { signaling } from './proto';
const PING_INTERVAL = 3000;
/* WebSocket error codes */
const MESSAGE_ERROR_CODE = 4000;
const PING_ERROR_CODE = 4001;
const FIRST_CONNECTION_ERROR_CODE = 4002;
/* Preconstructed messages */
const pingMsg = signaling.Message.encode(signaling.Message.create({ ping: true })).finish();
const pongMsg = signaling.Message.encode(signaling.Message.create({ pong: true })).finish();
export var SignalingStateEnum;
(function (SignalingStateEnum) {
    SignalingStateEnum[SignalingStateEnum["CONNECTING"] = 0] = "CONNECTING";
    SignalingStateEnum[SignalingStateEnum["OPEN"] = 1] = "OPEN";
    SignalingStateEnum[SignalingStateEnum["FIRST_CONNECTED"] = 2] = "FIRST_CONNECTED";
    SignalingStateEnum[SignalingStateEnum["READY_TO_JOIN_OTHERS"] = 3] = "READY_TO_JOIN_OTHERS";
    SignalingStateEnum[SignalingStateEnum["CLOSED"] = 4] = "CLOSED";
})(SignalingStateEnum || (SignalingStateEnum = {}));
/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export class Signaling {
    constructor(wc, url) {
        // public
        this.url = url.endsWith('/') ? url : url + '/';
        this.state = SignalingStateEnum.CLOSED;
        // private
        this.wc = wc;
        this.stateSubject = new Subject();
        this.channelSubject = new Subject();
        this.rxWs = undefined;
        this.pingInterval = undefined;
        this.pongReceived = false;
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
        if (this.state === SignalingStateEnum.FIRST_CONNECTED) {
            this.rxWs.send({ joined: true });
            this.setState(SignalingStateEnum.READY_TO_JOIN_OTHERS);
        }
    }
    join(key) {
        if (this.state === SignalingStateEnum.READY_TO_JOIN_OTHERS) {
            throw new Error('Failed to join via signaling: connection with signaling is already opened');
        }
        if (this.state !== SignalingStateEnum.CLOSED) {
            this.close();
        }
        this.setState(SignalingStateEnum.CONNECTING);
        this.wc.webSocketBuilder.connect(this.url + key)
            .then(ws => {
            this.setState(SignalingStateEnum.OPEN);
            this.rxWs = this.createRxWs(ws);
            this.startPingInterval();
            this.rxWs.onMessage.subscribe(msg => {
                switch (msg.type) {
                    case 'ping':
                        this.rxWs.pong();
                        break;
                    case 'pong':
                        this.pongReceived = true;
                        break;
                    case 'isFirst':
                        if (msg.isFirst) {
                            this.setState(SignalingStateEnum.READY_TO_JOIN_OTHERS);
                        }
                        else {
                            this.wc.webRTCBuilder.connectOverSignaling({
                                onMessage: this.rxWs.onMessage.filter(msg => msg.type === 'content')
                                    .map(({ content }) => content),
                                send: (msg) => this.rxWs.send({ content: msg })
                            })
                                .then(() => this.setState(SignalingStateEnum.FIRST_CONNECTED))
                                .catch(err => {
                                this.rxWs.close(FIRST_CONNECTION_ERROR_CODE, `Failed to join over Signaling: ${err.message}`);
                            });
                        }
                        break;
                }
            });
        })
            .catch(err => this.setState(SignalingStateEnum.CLOSED));
    }
    /**
     * Close the `WebSocket` with Signaling server.
     */
    close() {
        if (this.rxWs) {
            this.rxWs.close(1000);
        }
    }
    setState(state) {
        if (this.state !== state) {
            this.state = state;
            this.stateSubject.next(state);
            if (state === SignalingStateEnum.READY_TO_JOIN_OTHERS) {
                this.wc.webRTCBuilder.onChannelFromSignaling({
                    onMessage: this.rxWs.onMessage.filter(msg => msg.type === 'content')
                        .map(({ content }) => content),
                    send: msg => this.rxWs.send({ content: msg })
                }).subscribe(ch => this.channelSubject.next(ch));
            }
        }
    }
    startPingInterval() {
        this.rxWs.ping();
        this.pingInterval = setInterval(() => {
            if (this.state !== SignalingStateEnum.CLOSED) {
                if (!this.pongReceived) {
                    clearInterval(this.pingInterval);
                    this.rxWs.close(PING_ERROR_CODE, 'Signaling is not responding');
                }
                else {
                    this.pongReceived = false;
                    this.rxWs.ping();
                }
            }
        }, PING_INTERVAL);
    }
    createRxWs(ws) {
        const subject = new Subject();
        ws.binaryType = 'arraybuffer';
        ws.onmessage = evt => {
            try {
                subject.next(signaling.Message.decode(new Uint8Array(evt.data)));
            }
            catch (err) {
                ws.close(MESSAGE_ERROR_CODE, err.message);
            }
        };
        ws.onerror = err => subject.error(err);
        ws.onclose = closeEvt => {
            clearInterval(this.pingInterval);
            this.setState(SignalingStateEnum.CLOSED);
            if (closeEvt.code === 1000) {
                subject.complete();
            }
            else {
                subject.error(new Error(`Connection with Signaling '${this.url}' closed: ${closeEvt.code}: ${closeEvt.reason}`));
            }
        };
        return {
            onMessage: subject.asObservable(),
            send: msg => {
                if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
                    ws.send(signaling.Message.encode(signaling.Message.create(msg)).finish());
                }
            },
            ping: () => {
                if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
                    ws.send(pingMsg);
                }
            },
            pong: () => {
                if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
                    ws.send(pongMsg);
                }
            },
            close: (code = 1000, reason = '') => {
                ws.onclose = undefined;
                ws.close(code, reason);
                this.setState(SignalingStateEnum.CLOSED);
                clearInterval(this.pingInterval);
                subject.complete();
            }
        };
    }
}

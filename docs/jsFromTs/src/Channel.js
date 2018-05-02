import { isBrowser, log } from './misc/Util';
import { channel as proto, Message } from './proto';
import { UserMessage } from './service/UserMessage';
export var ChannelType;
(function (ChannelType) {
    ChannelType[ChannelType["INTERNAL"] = 0] = "INTERNAL";
    ChannelType[ChannelType["INVITED"] = 1] = "INVITED";
    ChannelType[ChannelType["JOINING"] = 2] = "JOINING";
})(ChannelType || (ChannelType = {}));
const heartbeat = Message.create({ serviceId: 0 });
export const MAXIMUM_MISSED_HEARTBEAT = 3;
/**
 * Wrapper class for `RTCDataChannel` and `WebSocket`.
 */
export class Channel {
    static heartbeatMsg(senderId, recipientId) {
        heartbeat.senderId = senderId;
        heartbeat.recipientId = recipientId;
        return Message.encode(heartbeat).finish();
    }
    /**
     * Creates a channel from existing `RTCDataChannel` or `WebSocket`.
     */
    constructor(wc, connection, type, id = 1, rtcPeerConnection) {
        log.channel(`New Channel ${ChannelType[type]}: Me: ${wc.myId} with ${id}`);
        this.wc = wc;
        this.connection = connection;
        this.type = type;
        this.id = id;
        this.rtcPeerConnection = rtcPeerConnection;
        this.missedHeartbeat = 0;
        // Configure `send` function
        if (isBrowser) {
            connection.binaryType = 'arraybuffer';
            this.send = this.sendInBrowser;
        }
        else if (!this.rtcPeerConnection) {
            this.send = this.sendInNodeOverWebSocket;
        }
        else {
            connection.binaryType = 'arraybuffer';
            this.send = this.sendInNodeOverDataChannel;
        }
        if (type === ChannelType.INTERNAL) {
            this.heartbeatMsg = Channel.heartbeatMsg(this.wc.myId, this.id);
            this.init = Promise.resolve();
            this.initHandlers();
        }
        else {
            this.init = new Promise((resolve, reject) => (this.resolveInit = () => {
                this.heartbeatMsg = Channel.heartbeatMsg(this.wc.myId, this.id);
                resolve();
            }));
            this.connection.onmessage = ({ data }) => {
                this.handleInitMessage(proto.Message.decode(new Uint8Array(data)));
            };
        }
    }
    initialize() {
        this.send(proto.Message.encode(proto.Message.create({
            initPing: {
                topology: this.wc.topology,
                wcId: this.wc.id,
                senderId: this.wc.myId,
                members: this.wc.members,
            },
        })).finish());
    }
    encodeAndSend({ senderId = this.wc.myId, recipientId = 0, serviceId, content } = {}) {
        this.send(Message.encode(Message.create({ senderId, recipientId, serviceId, content })).finish());
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
        this.missedHeartbeat++;
        if (this.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT) {
            log.channel(`${this.id} channel closed: too many missed heartbeats`);
            this.close();
        }
        this.send(this.heartbeatMsg);
    }
    sendInBrowser(data) {
        try {
            this.connection.send(data);
        }
        catch (err) {
            log.channel('Channel sendInBrowser ERROR', err);
        }
    }
    sendInNodeOverWebSocket(data) {
        try {
            this.connection.send(data, { binary: true });
        }
        catch (err) {
            log.channel('Channel sendInNodeOverWebSocket ERROR', err);
        }
    }
    sendInNodeOverDataChannel(data) {
        this.sendInBrowser(data.slice(0));
    }
    handleInitMessage(msg) {
        switch (msg.type) {
            case 'initPing': {
                log.channel(`${this.wc.myId} received InitPing`);
                const { topology, wcId, senderId, members } = msg.initPing;
                if (this.wc.topology !== topology) {
                    // TODO: implement when there are more than one topology implementation
                    // Reinitialize WebChannel: clean/leave etc.
                    // change topology
                    log.channel('Different topology. This message should never be shown: something is wrong');
                }
                else if (members.includes(this.id) && wcId !== this.wc.id) {
                    // TODO: this is a rare case, when the joining peer id equals to the
                    // one among group members  (the different identifiers insure that
                    // the peer was not a member of the group previously)
                    // clean/leave
                    // generate new Id (this.wc.myId) which is not in members
                }
                this.wc.id = wcId;
                this.id = senderId;
                log.channel(`${this.wc.myId} send InitPong`);
                this.send(proto.Message.encode(proto.Message.create({ initPong: this.wc.myId })).finish());
                this.initData = { members };
                this.initHandlers();
                this.resolveInit();
                break;
            }
            case 'initPong':
                log.channel(`${this.wc.myId} received InitPong`);
                this.id = msg.initPong;
                this.initHandlers();
                this.resolveInit();
                break;
            default:
                log.channel(`Unknown message type: "${msg.type}". This message should never be shown: something went wrong`);
        }
    }
    initHandlers() {
        // Configure handlers
        this.connection.onmessage = ({ data }) => {
            const msg = Message.decode(new Uint8Array(data));
            // 0: broadcast message
            if (msg.recipientId === 0 || msg.recipientId === this.wc.myId) {
                // User Message
                if (msg.serviceId === UserMessage.SERVICE_ID) {
                    const userData = this.wc.userMsg.decodeUserMessage(msg.content, msg.senderId);
                    if (userData) {
                        this.wc.onMessage(msg.senderId, userData);
                    }
                    // Heartbeat message
                }
                else if (msg.serviceId === 0) {
                    this.missedHeartbeat = 0;
                    // Service Message
                }
                else {
                    this.wc.streamSubject.next(Object.assign({ channel: this }, msg));
                }
            }
            if (msg.recipientId !== this.wc.myId) {
                this.wc.topologyService.forward(msg);
            }
        };
        this.connection.onclose = (evt) => {
            log.channel(`Connection with ${this.id} has closed`);
            this.wc.topologyService.onChannelClose(evt, this);
        };
        this.connection.onerror = (evt) => {
            log.channel('Channel error: ', evt);
            this.wc.topologyService.onChannelError(evt, this);
            this.close();
        };
    }
}

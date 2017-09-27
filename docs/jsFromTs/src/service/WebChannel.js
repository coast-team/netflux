import { Subject } from 'rxjs/Subject';
import { Channel } from '../Channel';
import { generateKey, isURL, log, MAX_KEY_LENGTH } from '../misc/Util';
import { Message, service, webChannel } from '../proto';
import { Signaling, SignalingState } from '../Signaling';
import { UserMessage } from '../UserMessage';
import { WebSocketBuilder } from '../WebSocketBuilder';
import { ChannelBuilder } from './ChannelBuilder';
import { Service } from './Service';
import { FullMesh } from './topology/FullMesh';
import { TopologyEnum } from './topology/Topology';
import { WebRTCBuilder } from './WebRTCBuilder';
const REJOIN_TIMEOUT = 3000;
/**
 * Timout for ping `WebChannel` in milliseconds.
 * @type {number}
 */
const PING_TIMEOUT = 5000;
export const defaultOptions = {
    topology: TopologyEnum.FULL_MESH,
    signalingURL: 'wss://www.coedit.re:10473',
    iceServers: [
        { urls: 'stun:stun3.l.google.com:19302' },
    ],
    autoRejoin: true,
};
export var WebChannelState;
(function (WebChannelState) {
    WebChannelState[WebChannelState["JOINING"] = 0] = "JOINING";
    WebChannelState[WebChannelState["JOINED"] = 1] = "JOINED";
    WebChannelState[WebChannelState["LEFT"] = 2] = "LEFT";
})(WebChannelState || (WebChannelState = {}));
/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 * [[include:installation.md]]
 */
export class WebChannel extends Service {
    constructor({ topology = defaultOptions.topology, signalingURL = defaultOptions.signalingURL, iceServers = defaultOptions.iceServers, autoRejoin = defaultOptions.autoRejoin, } = {}) {
        super(10, webChannel.Message);
        // PUBLIC MEMBERS
        this.topology = topology;
        this.id = this.generateId();
        this.myId = this.generateId();
        this.members = [this.myId];
        this.key = '';
        this.autoRejoin = autoRejoin;
        // PUBLIC EVENT HANDLERS
        this.onMemberJoin = function none() { };
        this.onMemberLeave = function none() { };
        this.onMessage = function none() { };
        this.onStateChange = function none() { };
        this.onSignalingStateChange = function none() { };
        // PRIVATE
        this.state = WebChannelState.LEFT;
        this.userMsg = new UserMessage();
        // Signaling init
        this.signaling = new Signaling(this, signalingURL);
        this.signaling.onChannel.subscribe((ch) => this.initChannel(ch));
        this.signaling.onState.subscribe((state) => {
            this.onSignalingStateChange(state);
            switch (state) {
                case SignalingState.OPEN:
                    this.setState(WebChannelState.JOINING);
                    break;
                case SignalingState.READY_TO_JOIN_OTHERS:
                    this.setState(WebChannelState.JOINED);
                    break;
                case SignalingState.CLOSED:
                    if (this.members.length === 1) {
                        this.setState(WebChannelState.LEFT);
                        if (this.isRejoinDisabled) {
                            this.key = '';
                        }
                    }
                    if (!this.isRejoinDisabled) {
                        this.rejoin();
                    }
                    break;
            }
        });
        // Services init
        this.serviceMessageSubject = new Subject();
        super.setupServiceMessage(this.serviceMessageSubject);
        this.webRTCBuilder = new WebRTCBuilder(this, iceServers);
        this.webSocketBuilder = new WebSocketBuilder(this);
        this.channelBuilder = new ChannelBuilder(this);
        this.onServiceMessage.subscribe((msg) => this.treatServiceMessage(msg), (err) => console.error('service/WebChannel inner message error', err));
        // Topology init
        this.setTopology(topology);
        this.joinSubject = new Subject();
        this.joinSubject.subscribe((err) => {
            if (err !== undefined) {
                console.error('Failed to join: ' + err.message, err);
                this.signaling.close();
            }
            else {
                this.setState(WebChannelState.JOINED);
                this.signaling.open();
            }
        });
        // Ping-pong init
        this.pingTime = 0;
        this.maxTime = 0;
        this.pingFinish = () => { };
        this.pongNb = 0;
    }
    /**
     * Join the network via a key provided by one of the network member or a `Channel`.
     */
    join(key = generateKey()) {
        if (this.state === WebChannelState.LEFT && this.signaling.state === SignalingState.CLOSED) {
            if (typeof key !== 'string') {
                throw new Error(`Failed to join: the key type "${typeof key}" is not a "string"`);
            }
            else if (key === '') {
                throw new Error('Failed to join: the key is an empty string');
            }
            else if (key.length > MAX_KEY_LENGTH) {
                throw new Error(`Failed to join : the key length of ${key.length} exceeds the maximum of ${MAX_KEY_LENGTH} characters`);
            }
            this.key = key;
            this.isRejoinDisabled = !this.autoRejoin;
            this.setState(WebChannelState.JOINING);
            this.signaling.join(this.key);
        }
        else {
            console.warn('Trying to join a group while already joined or joining. Maybe forgot to call leave().');
        }
    }
    /**
     * Invite a server peer to join the network.
     */
    invite(url) {
        if (isURL(url)) {
            this.webSocketBuilder.connect(`${url}/invite?wcId=${this.id}&senderId=${this.myId}`)
                .then((connection) => this.initChannel(new Channel(this, connection)))
                .catch((err) => console.error(`Failed to invite the bot ${url}: ${err.message}`));
        }
        else {
            throw new Error(`Failed to invite a bot: ${url} is not a valid URL`);
        }
    }
    /**
     * Close the connection with Signaling server.
     */
    closeSignaling() {
        this.isRejoinDisabled = true;
        this.signaling.close();
    }
    /**
     * Leave the network which means close channels with all peers and connection
     * with Signaling server.
     */
    leave() {
        this.key = '';
        this.isRejoinDisabled = true;
        this.initPing();
        this.topologyService.leave();
        this.signaling.close();
    }
    /**
     * Broadcast a message to the network.
     */
    send(data) {
        if (this.members.length !== 1) {
            const msg = {
                senderId: this.myId,
                recipientId: 0,
                isService: false,
            };
            const chunkedData = this.userMsg.encode(data);
            for (const chunk of chunkedData) {
                msg.content = chunk;
                this.topologyService.send(msg);
            }
        }
    }
    /**
     * Send a message to a particular peer in the network.
     */
    sendTo(id, data) {
        if (this.members.length !== 1) {
            const msg = {
                senderId: this.myId,
                recipientId: id,
                isService: false,
            };
            const chunkedData = this.userMsg.encode(data);
            for (const chunk of chunkedData) {
                msg.content = chunk;
                this.topologyService.sendTo(msg);
            }
        }
    }
    /**
     * Get the ping of the `network. It is an amount in milliseconds which
     * corresponds to the longest ping to each network member.
     */
    ping() {
        if (this.members.length !== 1 && this.pingTime === 0) {
            return new Promise((resolve, reject) => {
                if (this.pingTime === 0) {
                    this.pingTime = Date.now();
                    this.maxTime = 0;
                    this.pongNb = 0;
                    this.pingFinish = (delay) => resolve(delay);
                    this.sendProxy({ content: super.encode({ ping: true }) });
                    setTimeout(() => resolve(PING_TIMEOUT), PING_TIMEOUT);
                }
            });
        }
        else {
            return Promise.reject(new Error('No peers to ping'));
        }
    }
    onMemberJoinProxy(id) {
        this.members[this.members.length] = id;
        this.onMemberJoin(id);
    }
    onMemberLeaveProxy(id) {
        this.members.splice(this.members.indexOf(id), 1);
        this.onMemberLeave(id);
        if (this.members.length === 1 && this.signaling.state !== SignalingState.READY_TO_JOIN_OTHERS) {
            this.setState(WebChannelState.LEFT);
        }
    }
    /**
     * Send service message to a particular peer in the network.
     */
    sendToProxy({ senderId = this.myId, recipientId = this.myId, isService = true, content } = {}) {
        const msg = { senderId, recipientId, isService, content };
        if (msg.recipientId === this.myId) {
            this.treatMessage(undefined, msg);
        }
        else {
            this.topologyService.sendTo(msg);
        }
    }
    /**
     * Broadcast service message to the network.
     */
    sendProxy({ senderId = this.myId, recipientId = 0, isService = true, content, isMeIncluded = false } = {}) {
        const msg = { senderId, recipientId, isService, content };
        if (isMeIncluded) {
            this.treatMessage(undefined, msg);
        }
        this.topologyService.send(msg);
    }
    encode({ senderId = this.myId, recipientId = 0, isService = true, content } = {}) {
        const msg = { senderId, recipientId, isService, content };
        return Message.encode(Message.create(msg)).finish();
    }
    /**
     * Message handler. All messages arrive here first.
     */
    onMessageProxy(channel, bytes) {
        const msg = Message.decode(new Uint8Array(bytes));
        switch (msg.recipientId) {
            // If the message is broadcasted
            case 0:
                this.treatMessage(channel, msg);
                this.topologyService.forward(msg);
                break;
            // If it is a private message to me
            case this.myId:
                this.treatMessage(channel, msg);
                break;
            // If is is a message to me from a peer who does not know yet my ID
            case 1:
                this.treatMessage(channel, msg);
                break;
            // Otherwise the message should be forwarded to the intended peer
            default:
                this.topologyService.forwardTo(msg);
        }
    }
    treatMessage(channel, msg) {
        // User Message
        if (!msg.isService) {
            const data = this.userMsg.decode(msg.content, msg.senderId);
            if (data !== undefined) {
                this.onMessage(msg.senderId, data, msg.recipientId === 0);
            }
            // Service Message
        }
        else {
            this.serviceMessageSubject.next(Object.assign({
                channel,
                senderId: msg.senderId,
                recipientId: msg.recipientId,
            }, service.Message.decode(msg.content)));
        }
    }
    treatServiceMessage({ channel, senderId, recipientId, msg }) {
        switch (msg.type) {
            case 'init': {
                const { topology, wcId, generatedIds } = msg.init;
                // Check whether the intermidiary peer is already a member of your
                // network (possible when merging two networks (works with FullMesh)).
                // If it is a case then you are already a member of the network.
                if (this.members.includes(senderId)) {
                    if (!generatedIds.includes(this.myId)) {
                        console.warn(`Failed merge networks: my members contain intermediary peer id,
            but my id is not included into the intermediary peer members`);
                        channel.close();
                        return;
                    }
                    if (this.topology !== topology) {
                        console.warn('Failed merge networks: different topologies');
                        channel.close();
                        return;
                    }
                    log.info('I close connection with intermediary member, because already connected with him');
                    this.setState(WebChannelState.JOINED);
                    this.signaling.open();
                    channel.close();
                }
                else {
                    this.setTopology(topology);
                    this.id = wcId;
                    channel.id = senderId;
                    this.topologyService.initJoining(channel);
                    channel.send(this.encode({
                        recipientId: channel.id,
                        content: super.encode({ initOk: { members: this.members } }),
                    }));
                }
                break;
            }
            case 'initOk': {
                channel.id = senderId;
                this.topologyService.addJoining(channel, msg.initOk.members);
                break;
            }
            case 'ping': {
                this.sendToProxy({
                    recipientId: channel.id,
                    content: super.encode({ pong: true }),
                });
                break;
            }
            case 'pong': {
                const now = Date.now();
                this.pongNb++;
                this.maxTime = Math.max(this.maxTime, now - this.pingTime);
                if (this.pongNb === this.members.length - 1) {
                    this.pingFinish(this.maxTime);
                    this.pingTime = 0;
                }
                break;
            }
            default:
                throw new Error(`Unknown message type: "${msg.type}"`);
        }
    }
    setState(state) {
        if (this.state !== state) {
            this.state = state;
            this.onStateChange(state);
            if (state === WebChannelState.LEFT) {
                this.initPing();
            }
        }
    }
    initPing() {
        this.pingTime = 0;
        this.maxTime = 0;
        this.pingFinish = () => { };
        this.pongNb = 0;
    }
    /**
     * Delegate adding a new peer in the network to topology.
     */
    initChannel(ch) {
        const msg = this.encode({
            recipientId: 1,
            content: super.encode({ init: {
                    topology: this.topology,
                    wcId: this.id,
                    generatedIds: this.members,
                } }),
        });
        ch.send(msg);
    }
    setTopology(topology) {
        if (this.topologyService !== undefined) {
            if (this.topology !== topology) {
                this.topology = topology;
                this.topologyService.clean();
                this.topologyService = new FullMesh(this);
            }
        }
        else {
            this.topology = topology;
            this.topologyService = new FullMesh(this);
        }
    }
    rejoin() {
        this.rejoinTimer = setTimeout(() => this.signaling.join(this.key), REJOIN_TIMEOUT);
    }
    /**
     * Generate random id for a `WebChannel` or a new peer.
     */
    generateId(excludeIds = []) {
        const id = global.crypto.getRandomValues(new Uint32Array(1))[0];
        if (excludeIds.includes(id)) {
            return this.generateId();
        }
        return id;
    }
}

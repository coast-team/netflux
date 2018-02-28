import { Subject } from 'rxjs/Subject';
import { Channel } from '../Channel';
import { generateKey, isBrowser, isOnline, isURL, isVisible, log, MAX_KEY_LENGTH, randNumbers } from '../misc/Util';
import { Message, service, webChannel } from '../proto';
import { Signaling, SignalingState } from '../Signaling';
import { UserMessage } from '../UserMessage';
import { WebSocketBuilder } from '../WebSocketBuilder';
import { ChannelBuilder } from './ChannelBuilder';
import { Service } from './Service';
import { FullMesh } from './topology/FullMesh';
import { TopologyEnum, TopologyStateEnum } from './topology/Topology';
import { WebRTCBuilder } from './WebRTCBuilder';
/**
 * Service id.
 */
const ID = 200;
export const defaultOptions = {
    topology: TopologyEnum.FULL_MESH,
    signalingServer: 'wss://signaling.netflux.coedit.re',
    rtcConfiguration: {
        iceServers: [
            { urls: 'stun:stun3.l.google.com:19302' },
        ],
    },
    autoRejoin: true,
};
export var WebChannelState;
(function (WebChannelState) {
    WebChannelState[WebChannelState["JOINING"] = 0] = "JOINING";
    WebChannelState[WebChannelState["JOINED"] = 1] = "JOINED";
    WebChannelState[WebChannelState["LEAVING"] = 2] = "LEAVING";
    WebChannelState[WebChannelState["LEFT"] = 3] = "LEFT";
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
    constructor({ topology = defaultOptions.topology, signalingServer = defaultOptions.signalingServer, rtcConfiguration = defaultOptions.rtcConfiguration, autoRejoin = defaultOptions.autoRejoin, } = {}) {
        super(ID, webChannel.Message);
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
        this.signaling = new Signaling(this, signalingServer);
        this.signaling.onChannel.subscribe((ch) => this.initChannel(ch));
        this.signaling.onState.subscribe((state) => {
            log.signalingState(SignalingState[state], this.myId);
            this.onSignalingStateChange(state);
            switch (state) {
                case SignalingState.CONNECTING:
                    this.setState(WebChannelState.JOINING);
                    break;
                case SignalingState.CLOSED:
                    if (this.topologyService.state === TopologyStateEnum.DISCONNECTED) {
                        this.setState(WebChannelState.LEFT);
                    }
                    this.rejoin(3000);
                    break;
                case SignalingState.STABLE:
                    this.topologyService.setStable();
                    break;
            }
        });
        // Services init
        this.serviceMessageSubject = new Subject();
        super.setupServiceMessage(this.serviceMessageSubject);
        this.webRTCBuilder = new WebRTCBuilder(this, rtcConfiguration);
        this.webSocketBuilder = new WebSocketBuilder(this);
        this.channelBuilder = new ChannelBuilder(this);
        this.onServiceMessage.subscribe((msg) => this.treatServiceMessage(msg), (err) => console.error('service/WebChannel inner message error', err));
        // Topology init
        this.setTopology(topology);
        // FIXME: manage topologyService onState subscription
        // Listen to browser events only
        if (isBrowser) {
            // global.window.addEventListener('offline', () => {
            //   setTimeout(() => {
            //     if (!isOnline()) {
            //       this.internalLeave()
            //     }
            //   }, 2000)
            // })
            global.window.addEventListener('online', () => {
                if (isVisible() && this.state === WebChannelState.LEFT) {
                    this.rejoin();
                }
            });
            global.window.addEventListener('visibilitychange', () => {
                if (isVisible() && this.state === WebChannelState.LEFT) {
                    this.rejoin();
                }
            });
            global.window.addEventListener('beforeunload', () => this.internalLeave());
        }
    }
    /**
     * Join the network via a key provided by one of the network member or a `Channel`.
     */
    join(key = generateKey()) {
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
        if (isOnline() && this.state === WebChannelState.LEFT && this.signaling.state === SignalingState.CLOSED) {
            this.setState(WebChannelState.JOINING);
            this.isRejoinDisabled = !this.autoRejoin;
            this.signaling.join(this.key);
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
     * Leave the network which means close channels with all peers and connection
     * with Signaling server.
     */
    leave() {
        if (this.state !== WebChannelState.LEAVING && this.state !== WebChannelState.LEFT) {
            this.setState(WebChannelState.LEAVING);
            this.key = '';
            this.isRejoinDisabled = true;
            this.signaling.close();
            this.topologyService.leave();
        }
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
    onMemberJoinProxy(id) {
        if (!this.members.includes(id)) {
            this.members[this.members.length] = id;
            this.onMemberJoin(id);
        }
    }
    onMemberLeaveProxy(id) {
        if (this.members.includes(id)) {
            this.members.splice(this.members.indexOf(id), 1);
            this.onMemberLeave(id);
        }
    }
    /**
     * Send service message to a particular peer in the network.
     */
    sendToProxy({ senderId = this.myId, recipientId = this.myId, isService = true, content } = {}) {
        this.topologyService.sendTo({ senderId, recipientId, isService, content });
    }
    /**
     * Broadcast service message to the network.
     */
    sendProxy({ senderId = this.myId, recipientId = 0, isService = true, content } = {}) {
        this.topologyService.send({ senderId, recipientId, isService, content });
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
        // recipientId values:
        // 0: broadcast message
        // 1: is a message to me from a peer who does not know yet my ID
        if (msg.recipientId === 0 || msg.recipientId === this.myId || msg.recipientId === 1) {
            this.treatMessage(channel, msg);
        }
        if (msg.recipientId !== this.myId) {
            this.topologyService.forward(msg);
        }
    }
    treatMessage(channel, msg) {
        // User Message
        if (!msg.isService) {
            const data = this.userMsg.decode(msg.content, msg.senderId);
            if (data !== undefined) {
                this.onMessage(msg.senderId, data);
            }
            // Service Message
        }
        else {
            const fullMsg = service.Message.decode(msg.content);
            fullMsg.channel = channel;
            fullMsg.senderId = msg.senderId;
            fullMsg.recipientId = msg.recipientId;
            this.serviceMessageSubject.next(fullMsg);
        }
    }
    treatServiceMessage({ channel, senderId, msg }) {
        switch (msg.type) {
            case 'init': {
                const { topology, wcId, generatedIds, members } = msg.init;
                // Check whether the intermidiary peer is already a member of your
                // network (possible when merging two networks (works with FullMesh)).
                // If it is a case then you are already a member of the network.
                if (this.members.includes(senderId)) {
                    if (!generatedIds.includes(this.myId)) {
                        this.setState(WebChannelState.LEAVING);
                        console.warn(`Failed merge networks: my members contain intermediary peer id,
            but my id is not included into the intermediary peer members`);
                        channel.closeQuietly();
                        this.topologyService.leave();
                        return;
                    }
                    if (this.topology !== topology) {
                        this.setState(WebChannelState.LEAVING);
                        console.warn('Failed merge networks: different topologies');
                        channel.closeQuietly();
                        this.topologyService.leave();
                        return;
                    }
                    log.webgroup(`I:${this.myId} close connection with intermediary member ${senderId},
          because already connected with him`);
                    this.setState(WebChannelState.JOINED);
                    channel.closeQuietly();
                }
                else {
                    this.setTopology(topology);
                    this.id = wcId;
                    channel.id = senderId;
                    channel.send(this.encode({ recipientId: channel.id, content: super.encode({ initOk: true }) }));
                    this.topologyService.initJoining(channel, members);
                }
                break;
            }
            case 'initOk': {
                channel.id = senderId;
                this.topologyService.addJoining(channel);
                break;
            }
            default:
                throw new Error(`Unknown message type: "${msg.type}"`);
        }
    }
    setState(state) {
        if (this.state !== state) {
            log.webGroupState(WebChannelState[state], this.myId);
            this.state = state;
            this.onStateChange(state);
        }
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
                    members: this.members,
                } }),
        });
        ch.send(msg);
    }
    setTopology(topology) {
        if (this.topologyService !== undefined) {
            if (this.topology !== topology) {
                this.topology = topology;
                this.topologyService.leave();
                this.topologyService = new FullMesh(this);
                this.subscribeToTopology();
            }
        }
        else {
            this.topology = topology;
            this.topologyService = new FullMesh(this);
            this.subscribeToTopology();
        }
    }
    subscribeToTopology() {
        if (this.topologySub) {
            this.topologySub.unsubscribe();
        }
        this.topologySub = this.topologyService.onState.subscribe((state) => {
            switch (state) {
                case TopologyStateEnum.JOINING:
                    this.setState(WebChannelState.JOINING);
                    break;
                case TopologyStateEnum.JOINED:
                    this.setState(WebChannelState.JOINED);
                    break;
                case TopologyStateEnum.STABLE:
                    this.setState(WebChannelState.JOINED);
                    this.signaling.open();
                    break;
                case TopologyStateEnum.DISCONNECTED:
                    if (this.signaling.state === SignalingState.CLOSED) {
                        this.setState(WebChannelState.LEFT);
                    }
                    this.rejoin(2000);
                    break;
            }
        });
    }
    rejoin(timeout = 0) {
        if (!this.isRejoinDisabled) {
            this.isRejoinDisabled = !this.autoRejoin;
            global.clearTimeout(this.rejoinTimer);
            this.rejoinTimer = setTimeout(() => {
                if (isOnline() && isVisible()) {
                    log.webgroup('REJOIN...');
                    this.signaling.join(this.key);
                }
            }, timeout);
        }
    }
    /**
     * Generate random id for a `WebChannel` or a new peer.
     */
    generateId(excludeIds = []) {
        const id = randNumbers()[0];
        if (excludeIds.includes(id)) {
            return this.generateId();
        }
        return id;
    }
    internalLeave() {
        if (this.state !== WebChannelState.LEAVING && this.state !== WebChannelState.LEFT) {
            this.signaling.close();
            this.topologyService.leave();
            this.setState(WebChannelState.LEFT);
        }
    }
}

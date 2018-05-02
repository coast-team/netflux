import { Subject } from 'rxjs/Subject';
import { generateId, generateKey, isBrowser, isOnline, isURL, isVisible, log, MAX_KEY_LENGTH, } from './misc/Util';
import { ChannelBuilder } from './service/channelBuilder/ChannelBuilder';
import { FullMesh } from './service/topology/FullMesh';
import { TopologyEnum, TopologyState } from './service/topology/Topology';
import { UserMessage } from './service/UserMessage';
import { Signaling, SignalingState } from './Signaling';
import { WebChannelState } from './WebChannelState';
import { WebSocketBuilder } from './WebSocketBuilder';
export const defaultOptions = {
    topology: TopologyEnum.FULL_MESH,
    signalingServer: 'wss://signaling.netflux.coedit.re',
    rtcConfiguration: {
        iceServers: [{ urls: 'stun:stun3.l.google.com:19302' }],
    },
    autoRejoin: true,
};
const REJOIN_TIMEOUT = 3000;
/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 * [[include:installation.md]]
 */
export class WebChannel {
    constructor({ topology = defaultOptions.topology, signalingServer = defaultOptions.signalingServer, rtcConfiguration = defaultOptions.rtcConfiguration, autoRejoin = defaultOptions.autoRejoin, } = {}) {
        this.STREAM_ID = 2;
        this.streamSubject = new Subject();
        // PUBLIC MEMBERS
        this.topology = topology;
        this.id = generateId();
        this.myId = generateId();
        this.members = [this.myId];
        this.key = '';
        this.autoRejoin = autoRejoin;
        this.rtcConfiguration = rtcConfiguration;
        // PUBLIC EVENT HANDLERS
        this.onMemberJoin = function none() { };
        this.onMemberLeave = function none() { };
        this.onMessage = function none() { };
        this.onStateChange = function none() { };
        this.onSignalingStateChange = function none() { };
        // PRIVATE
        this.isJoinRequested = false;
        this.state = WebChannelState.LEFT;
        this.rejoinTimer = undefined;
        this.userMsg = new UserMessage(this);
        // Signaling init
        this.signaling = new Signaling(this, signalingServer);
        this.signaling.onState.subscribe((state) => {
            log.signalingState(SignalingState[state], this.myId);
            this.onSignalingStateChange(state);
            switch (state) {
                case SignalingState.CLOSED:
                    if (this.topologyService.state === TopologyState.DISCONNECTED) {
                        if (isVisible() &&
                            isOnline() &&
                            !this.rejoinTimer &&
                            (this.isJoinRequested || !this.isRejoinDisabled)) {
                            this.startJoin();
                        }
                        else {
                            this.setState(WebChannelState.LEFT);
                        }
                    }
                    else if (this.state !== WebChannelState.LEAVING) {
                        this.signaling.connect(this.key);
                    }
                    break;
                case SignalingState.OPEN:
                    if (this.topologyService.state === TopologyState.DISCONNECTED ||
                        this.topologyService.state === TopologyState.JOINED) {
                        this.signaling.sendConnectRequest();
                    }
                    break;
                case SignalingState.CHECKED:
                    if (this.state === WebChannelState.JOINING &&
                        this.topologyService.state === TopologyState.DISCONNECTED &&
                        this.signaling.connected) {
                        this.setJoined();
                    }
                    break;
            }
        });
        // Services init
        this.webSocketBuilder = new WebSocketBuilder(this);
        this.channelBuilder = new ChannelBuilder(this);
        // Topology init
        this.setTopology(topology);
        // Listen to browser events only
        if (isBrowser) {
            global.window.addEventListener('online', () => {
                if (this.state === WebChannelState.LEFT && isVisible() && !this.rejoinTimer) {
                    if (this.isJoinRequested || !this.isRejoinDisabled) {
                        this.startJoin();
                    }
                }
            });
            global.window.addEventListener('visibilitychange', () => {
                if (isVisible() && this.state === WebChannelState.LEFT && isOnline() && !this.rejoinTimer) {
                    if (this.isJoinRequested || !this.isRejoinDisabled) {
                        this.startJoin();
                    }
                }
            });
            global.window.addEventListener('beforeunload', () => this.leave());
        }
    }
    get messageFromStream() {
        return this.streamSubject.asObservable();
    }
    sendOverStream(msg) {
        this.topologyService.sendTo(msg);
    }
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
        if (this.state === WebChannelState.LEAVING ||
            (this.state === WebChannelState.LEFT && (!isOnline() || !isVisible()))) {
            this.isRejoinDisabled = !this.autoRejoin;
            this.isJoinRequested = true;
        }
        else {
            this.startJoin();
        }
    }
    invite(url) {
        if (isURL(url)) {
            this.webSocketBuilder
                .connectToInvite(url)
                .catch((err) => log.webgroup(`Failed to invite the bot ${url}: ${err.message}`));
        }
        else {
            throw new Error(`Failed to invite a bot: ${url} is not a valid URL`);
        }
    }
    leave() {
        if (this.state === WebChannelState.JOINING || this.state === WebChannelState.JOINED) {
            this.setState(WebChannelState.LEAVING);
            this.key = '';
            this.isRejoinDisabled = true;
            this.signaling.close();
            this.topologyService.leave();
        }
    }
    send(data) {
        if (this.members.length !== 1) {
            for (const chunk of this.userMsg.encodeUserMessage(data)) {
                this.topologyService.send({
                    senderId: this.myId,
                    recipientId: 0,
                    serviceId: UserMessage.SERVICE_ID,
                    content: chunk,
                });
            }
        }
    }
    sendTo(id, data) {
        if (this.members.length !== 1) {
            for (const chunk of this.userMsg.encodeUserMessage(data)) {
                this.topologyService.sendTo({
                    senderId: this.myId,
                    recipientId: id,
                    serviceId: UserMessage.SERVICE_ID,
                    content: chunk,
                });
            }
        }
    }
    onMemberJoinProxy(id) {
        if (!this.members.includes(id)) {
            this.members[this.members.length] = id;
            this.onMemberJoin(id);
        }
    }
    onMemberLeaveProxy(id, isAdjacent) {
        if (this.members.includes(id)) {
            this.members.splice(this.members.indexOf(id), 1);
            this.onMemberLeave(id);
        }
        if (isAdjacent &&
            this.signaling.state === SignalingState.CHECKED &&
            this.topologyService.state === TopologyState.JOINED) {
            this.signaling.sendConnectRequest();
        }
    }
    setState(state) {
        if (this.state !== state) {
            log.webGroupState(WebChannelState[state], this.myId);
            this.state = state;
            this.onStateChange(state);
        }
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
                case TopologyState.JOINING:
                    this.setState(WebChannelState.JOINING);
                    break;
                case TopologyState.JOINED:
                    this.setJoined();
                    if (this.signaling.state === SignalingState.OPEN ||
                        this.signaling.state === SignalingState.CHECKED) {
                        this.signaling.sendConnectRequest();
                    }
                    break;
                case TopologyState.DISCONNECTED:
                    if (this.signaling.state === SignalingState.CLOSED &&
                        isVisible() &&
                        isOnline() &&
                        !this.rejoinTimer &&
                        (this.isJoinRequested || !this.isRejoinDisabled)) {
                        this.startJoin();
                    }
                    else {
                        this.setState(WebChannelState.LEFT);
                    }
                    break;
            }
        });
    }
    startJoin() {
        this.setState(WebChannelState.JOINING);
        this.signaling.connect(this.key);
        this.isJoinRequested = false;
        this.rejoinTimer = global.setTimeout(() => {
            if (this.state === WebChannelState.LEFT &&
                isVisible() &&
                isOnline() &&
                !this.isRejoinDisabled) {
                this.startJoin();
            }
            else {
                this.rejoinTimer = undefined;
            }
        }, REJOIN_TIMEOUT);
    }
    setJoined() {
        this.setState(WebChannelState.JOINED);
        global.clearTimeout(this.rejoinTimer);
        this.rejoinTimer = undefined;
    }
}

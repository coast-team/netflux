import { Subject } from 'rxjs';
import { extractHostnameAndPort, generateId, generateKey, isBrowser, isOnline, isURL, isVisible, log, validateKey, } from './misc/util';
import { ChannelBuilder } from './service/channelBuilder/ChannelBuilder';
import { FullMesh } from './service/topology/FullMesh';
import { TopologyEnum, TopologyState } from './service/topology/Topology';
import { UserMessage } from './service/UserMessage';
import { Signaling, SignalingState } from './Signaling';
import { WebChannelState } from './WebChannelState';
import { WebSocketBuilder } from './WebSocketBuilder';
export const webChannelDefaultOptions = {
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
    constructor(options) {
        this.STREAM_ID = 2;
        const fullOptions = Object.assign({}, webChannelDefaultOptions, options);
        this.streamSubject = new Subject();
        this.idSubject = new Subject();
        this.topologyEnum = fullOptions.topology;
        this.autoRejoin = fullOptions.autoRejoin;
        this.rtcConfiguration = fullOptions.rtcConfiguration;
        this.members = [];
        this._id = 0;
        this.key = '';
        this.myId = 0;
        this.state = WebChannelState.LEFT;
        this.rejoinEnabled = false;
        this.rejoinTimer = undefined;
        this.topology = {};
        this._onAlone = () => { };
        this.onMemberJoin = function none() { };
        this.onMemberLeave = function none() { };
        this.onMessage = function none() { };
        this.onStateChange = function none() { };
        this.onSignalingStateChange = function none() { };
        // Initialize services
        this.userMsg = new UserMessage();
        this.signaling = new Signaling(this, fullOptions.signalingServer);
        this.subscribeToSignalingState();
        this.webSocketBuilder = new WebSocketBuilder(this);
        this.channelBuilder = new ChannelBuilder(this);
        this.setTopology(fullOptions.topology);
        // Listen to browser events
        if (isBrowser) {
            this.subscribeToBrowserEvents();
        }
    }
    get onIdChange() {
        return this.idSubject.asObservable();
    }
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
        this.idSubject.next(value);
    }
    get messageFromStream() {
        return this.streamSubject.asObservable();
    }
    set onAlone(handler) {
        this._onAlone = handler;
    }
    sendOverStream(msg) {
        this.topology.sendTo(msg);
    }
    join(key = generateKey()) {
        validateKey(key);
        if (this.state === WebChannelState.LEFT) {
            this.startJoin(key);
        }
    }
    invite(url) {
        if (isURL(url)) {
            const hostnamePort = extractHostnameAndPort(url);
            for (const ch of this.topology.neighbors) {
                if (hostnamePort === extractHostnameAndPort(ch.url)) {
                    return;
                }
            }
            this.webSocketBuilder
                .connectToInvite(url)
                .catch((err) => log.webgroup(`Failed to invite the bot ${url}: ${err.message}`));
        }
        else {
            throw new Error(`Failed to invite a bot: ${url} is not a valid URL`);
        }
    }
    leave() {
        if (this.state !== WebChannelState.LEFT) {
            this.rejoinEnabled = false;
            this.key = '';
            this.signaling.close();
            this.topology.leave();
            this.clean();
            this.setState(WebChannelState.LEFT);
        }
    }
    send(data) {
        if (this.members.length !== 1) {
            for (const chunk of this.userMsg.encodeUserMessage(data)) {
                this.topology.send({
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
                this.topology.sendTo({
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
    onAdjacentMembersLeaveProxy(ids) {
        if (ids.length !== 0) {
            this.onMemberLeaveProxy(ids);
            if (this.members.length === 1) {
                this._onAlone();
                this.topology.setLeftState();
            }
            else if (this.signaling.state === SignalingState.CHECKED &&
                this.topology.state === TopologyState.JOINED) {
                this.signaling.check();
            }
        }
    }
    onDistantMembersLeaveProxy(ids) {
        this.onMemberLeaveProxy(ids);
    }
    init(key, id = generateId()) {
        this.id = id;
        this.myId = generateId();
        this.members = [this.myId];
        this.key = key;
        this.rejoinEnabled = this.autoRejoin;
        if (this.rejoinTimer) {
            global.clearTimeout(this.rejoinTimer);
            this.rejoinTimer = undefined;
        }
        this.setState(WebChannelState.JOINING);
    }
    clean() {
        if (this.rejoinTimer) {
            global.clearTimeout(this.rejoinTimer);
            this.rejoinTimer = undefined;
        }
        this.channelBuilder.clean();
        this.userMsg.clean();
        this.members = [];
        this.id = 0;
        this.myId = 0;
    }
    setState(state) {
        if (this.state !== state) {
            log.webGroupState(WebChannelState[state], this.myId);
            this.state = state;
            this.onStateChange(state);
        }
    }
    setTopology(topologyEnum) {
        this.topologyEnum = topologyEnum;
        this.topology = new FullMesh(this);
        this.topology.onState.subscribe((state) => {
            switch (state) {
                case TopologyState.JOINING:
                    this.setState(WebChannelState.JOINING);
                    if (this.signaling.state === SignalingState.CLOSED) {
                        // This is for a bot who was invited to the group
                        this.signaling.connect(this.key);
                    }
                    break;
                case TopologyState.JOINED:
                    this.setState(WebChannelState.JOINED);
                    if (this.signaling.state === SignalingState.OPEN ||
                        this.signaling.state === SignalingState.CHECKED) {
                        this.signaling.check();
                    }
                    break;
                case TopologyState.LEFT:
                    switch (this.signaling.state) {
                        case SignalingState.CLOSED:
                            this.rejoinOrLeave();
                            break;
                        case SignalingState.CONNECTING:
                            this.setState(WebChannelState.JOINING);
                            break;
                        case SignalingState.OPEN:
                            this.setState(WebChannelState.JOINING);
                            this.signaling.check();
                            break;
                        case SignalingState.CHECKING:
                            this.setState(WebChannelState.JOINING);
                            break;
                        case SignalingState.CHECKED:
                            this.signaling.check();
                            break;
                    }
                    break;
            }
        });
    }
    subscribeToSignalingState() {
        this.signaling.onState.subscribe((state) => {
            log.signalingState(SignalingState[state], this.myId);
            this.onSignalingStateChange(state);
            switch (state) {
                case SignalingState.CLOSED:
                    if (this.topology.state === TopologyState.LEFT) {
                        this.rejoinOrLeave();
                    }
                    else if (this.topology.state === TopologyState.JOINED && this.rejoinEnabled) {
                        this.signaling.connect(this.key);
                    }
                    break;
                case SignalingState.OPEN:
                    if (this.topology.state !== TopologyState.JOINING) {
                        this.signaling.check();
                    }
                    break;
                case SignalingState.CHECKED:
                    if (this.state === WebChannelState.JOINING &&
                        this.topology.state === TopologyState.LEFT &&
                        this.signaling.connected) {
                        this.topology.setJoinedState();
                    }
                    break;
            }
        });
    }
    subscribeToBrowserEvents() {
        global.addEventListener('online', () => {
            if (this.state === WebChannelState.LEFT &&
                isVisible() &&
                !this.rejoinTimer &&
                this.rejoinEnabled) {
                this.startJoin();
            }
        });
        global.addEventListener('visibilitychange', () => {
            if (isVisible() &&
                this.state === WebChannelState.LEFT &&
                isOnline() &&
                !this.rejoinTimer &&
                this.rejoinEnabled) {
                this.startJoin();
            }
        });
        global.addEventListener('beforeunload', () => this.leave());
    }
    startJoin(key = this.key) {
        this.init(key);
        this.signaling.connect(key);
    }
    rejoinOrLeave() {
        this.clean();
        if (this.rejoinEnabled) {
            this.init(this.key);
            this.rejoinTimer = global.setTimeout(() => {
                if (this.state === WebChannelState.LEFT &&
                    isVisible() &&
                    isOnline() &&
                    this.rejoinEnabled) {
                    this.startJoin();
                }
            }, REJOIN_TIMEOUT);
        }
        else {
            this.setState(WebChannelState.LEFT);
        }
    }
    onMemberLeaveProxy(ids) {
        ids.forEach((id) => {
            if (this.members.includes(id)) {
                this.members.splice(this.members.indexOf(id), 1);
                this.onMemberLeave(id);
            }
        });
    }
}

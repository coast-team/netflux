import { ChannelType, createHeartbeatMsg, MAXIMUM_MISSED_HEARTBEAT, } from '../../Channel';
import { log } from '../../misc/util';
import { fullMesh as proto } from '../../proto';
import { Topology, TopologyState } from './Topology';
const REQUEST_MEMBERS_INTERVAL = 6000;
const MAX_ROUTE_DISTANCE = 3;
const HEARTBEAT_INTERVAL = 3000;
/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 */
export class FullMesh extends Topology {
    constructor(wc) {
        super(wc, FullMesh.SERVICE_ID, proto.Message);
        this.adjacentMembers = new Map();
        this.distantMembers = new Map();
        // Encode message beforehand for optimization
        this.membersRequestEncoded = super.encode({ membersRequest: true });
        // Subscribe to WebChannel stream
        this.wcStream.message.subscribe(({ channel, senderId, msg }) => this.handleServiceMessage(channel, senderId, msg));
        // Subscribe to channels from ChannelBuilder
        this.wc.channelBuilder.onChannel.subscribe((ch) => {
            log.topology('Adding new adjacent member: ', ch.id);
            this.distantMembers.delete(ch.id);
            const member = this.adjacentMembers.get(ch.id);
            if (member) {
                log.topology('Replacing the same channel');
                member.close();
            }
            this.adjacentMembers.set(ch.id, ch);
            this.wc.onMemberJoinProxy(ch.id);
            if (this.adjacentMembers.size === 1 && this.membersRequestInterval === undefined) {
                this.startIntervals();
            }
            if (ch.type === ChannelType.JOINING) {
                super.setState(TopologyState.JOINING);
                const { members } = ch.initData;
                this.connectToMany(members, ch.id).then(() => {
                    this.membersRequest();
                    super.setState(TopologyState.JOINED);
                });
            }
            else {
                this.notifyDistantMembers();
            }
        });
        global.fullmesh = () => {
            log.topology('Fullmesh info:', {
                myId: this.wc.myId,
                signalingState: this.wc.signaling.state,
                webGroupState: this.wc.state,
                topologyState: TopologyState[this.state],
                adjacentMembers: Array.from(this.adjacentMembers.keys()).toString(),
                distantMembers: Array.from(this.distantMembers.keys()).toString(),
                distantMembersDETAILS: Array.from(this.distantMembers.keys()).map((id) => {
                    const adjacentMembers = this.distantMembers.get(id);
                    return { id, adjacentMembers: adjacentMembers ? adjacentMembers.adjacentIds : [] };
                }),
            });
        };
    }
    send(msg) {
        this.adjacentMembers.forEach((ch) => ch.encodeAndSend(msg));
        this.distantMembers.forEach((distantMember, id) => {
            this.sendToDistantPeer(distantMember, Object.assign(msg, { recipientId: id }));
        });
    }
    sendTo(msg) {
        const ch = this.adjacentMembers.get(msg.recipientId);
        if (ch) {
            ch.encodeAndSend(msg);
        }
        else {
            this.sendToDistantPeer(this.distantMembers.get(msg.recipientId), msg);
        }
    }
    forward(msg) {
        this.sendTo(msg);
    }
    leave() {
        if (this.state !== TopologyState.LEFT) {
            this.clean();
            this.adjacentMembers.forEach((ch) => ch.close());
            this.wc.onAdjacentMembersLeaveProxy(Array.from(this.adjacentMembers.keys()));
            super.setState(TopologyState.LEFT);
        }
    }
    onChannelClose(channel) {
        this.adjacentMembers.delete(channel.id);
        if (this.adjacentMembers.size === 0) {
            this.clean();
        }
        else {
            this.notifyDistantMembers();
        }
        this.wc.onAdjacentMembersLeaveProxy([channel.id]);
    }
    get neighbors() {
        return Array.from(this.adjacentMembers.values());
    }
    clean() {
        this.wc.onDistantMembersLeaveProxy(Array.from(this.distantMembers.keys()));
        this.distantMembers.clear();
        global.clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = undefined;
        global.clearInterval(this.membersRequestInterval);
        this.membersRequestInterval = undefined;
    }
    handleServiceMessage(channel, senderId, msg) {
        switch (msg.type) {
            case 'membersResponse': {
                this.connectToMany(msg.membersResponse.ids, senderId);
                break;
            }
            case 'membersRequest': {
                channel.encodeAndSend({
                    recipientId: channel.id,
                    serviceId: FullMesh.SERVICE_ID,
                    content: super.encode({ membersResponse: { ids: this.wc.members } }),
                });
                break;
            }
            case 'adjacentMembers': {
                const { adjacentMembers: { ids }, } = msg;
                if (!this.adjacentMembers.has(senderId)) {
                    const distantMember = this.distantMembers.get(senderId);
                    // If it the first time you have met this ID, then send him your neighbours' ids.
                    // Otherwise just update the list of distant peer's neighbours
                    if (distantMember) {
                        distantMember.adjacentIds = ids;
                    }
                    else {
                        this.distantMembers.set(senderId, {
                            adjacentIds: ids,
                            missedHeartbeat: 0,
                        });
                        this.wcStream.send({ adjacentMembers: { ids: Array.from(this.adjacentMembers.keys()) } }, senderId);
                    }
                }
                break;
            }
            case 'heartbeat': {
                const distantMember = this.distantMembers.get(senderId);
                if (distantMember) {
                    distantMember.missedHeartbeat = 0;
                }
                break;
            }
        }
    }
    connectToMany(ids, adjacentId) {
        const missingIds = ids.filter((id) => !this.adjacentMembers.has(id) && id !== this.wc.myId);
        if (missingIds.length !== 0) {
            const msg = super.encode({
                adjacentMembers: { ids: Array.from(this.adjacentMembers.keys()) },
            });
            const attempts = [];
            missingIds.forEach((id) => {
                if (!this.distantMembers.has(id)) {
                    this.distantMembers.set(id, { adjacentIds: [adjacentId], missedHeartbeat: 0 });
                }
                // It's important to notify all peers about my adjacentIds first
                // for some specific case such when you should connect to a peer with
                // distance more than 1
                this.wcStream.send(msg, id);
                attempts[attempts.length] = this.wc.channelBuilder
                    .connectOverWebChannel(id)
                    .catch((err) => {
                    if (err.message !== 'ping') {
                        this.wc.onMemberJoinProxy(id);
                    }
                });
            });
            return Promise.all(attempts);
        }
        return Promise.resolve();
    }
    membersRequest() {
        if (this.adjacentMembers.size !== 0) {
            // Randomly choose a group member to send him a request for his member list
            const index = Math.floor(Math.random() * this.adjacentMembers.size);
            const iterator = this.adjacentMembers.values();
            for (let i = 0; i < index; i++) {
                iterator.next();
            }
            const channel = iterator.next().value;
            channel.encodeAndSend({
                recipientId: channel.id,
                serviceId: FullMesh.SERVICE_ID,
                content: this.membersRequestEncoded,
            });
        }
    }
    notifyDistantMembers() {
        if (this.distantMembers.size !== 0) {
            const msg = super.encode({
                adjacentMembers: { ids: Array.from(this.adjacentMembers.keys()) },
            });
            this.distantMembers.forEach((dm, id) => this.wcStream.send(msg, id));
        }
    }
    startIntervals() {
        // Members check interval
        this.membersRequestInterval = global.setInterval(() => this.membersRequest(), REQUEST_MEMBERS_INTERVAL);
        // Heartbeat interval
        this.heartbeatInterval = global.setInterval(() => {
            this.adjacentMembers.forEach((ch) => ch.sendHeartbeat());
            this.distantMembers.forEach((peer, id) => {
                peer.missedHeartbeat++;
                if (peer.missedHeartbeat >= MAXIMUM_MISSED_HEARTBEAT + 1) {
                    log.topology(`Distant peer ${id} has left: too many missed heartbeats`);
                    this.distantMembers.delete(id);
                    this.wc.onDistantMembersLeaveProxy([id]);
                }
                this.wcStream.send(createHeartbeatMsg(this.wc.id, id));
            });
        }, HEARTBEAT_INTERVAL);
    }
    sendToDistantPeer(distantMember, msg) {
        // NO LUCK: recepient is not directly connected to me, thus check distant peers
        // First those who are at distance 1, then 2 etc. up to MAX_ROUTE_DISTANCE
        // (Peer X has a distance equals to 1 if I am not directly connected to X and
        // there is a peer Y which is directly connected to X and to me)
        for (let d = 1; d <= MAX_ROUTE_DISTANCE; d++) {
            const ch = this.findRoutedChannel(distantMember, d);
            if (ch) {
                ch.encodeAndSend(msg);
                return;
            }
        }
    }
    findRoutedChannel(distantMember, distance) {
        if (distantMember) {
            for (const [neighbourId, ch] of this.adjacentMembers) {
                if (distantMember.adjacentIds.includes(neighbourId)) {
                    return ch;
                }
            }
            if (distance !== 0) {
                for (const id of distantMember.adjacentIds) {
                    const ch = this.findRoutedChannel(this.distantMembers.get(id), distance - 1);
                    if (ch) {
                        return ch;
                    }
                }
            }
        }
        return undefined;
    }
}
FullMesh.SERVICE_ID = 74315;

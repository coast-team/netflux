import 'rxjs/add/operator/map';
import { fullMesh } from '../../proto';
import { Service } from '../Service';
/**
 * {@link FullMesh} identifier.
 * @ignore
 * @type {number}
 */
export const FULL_MESH = 3;
const MAX_JOIN_ATTEMPTS = 100;
/**
 * Fully connected web channel manager. Implements fully connected topology
 * network, when each peer is connected to each other.
 *
 */
export class FullMesh extends Service {
    constructor(wc) {
        super(FULL_MESH, fullMesh.Message, wc.serviceMessageSubject);
        this.wc = wc;
        this.channels = new Set();
        this.jps = new Map();
        this.joinAttempts = 0;
        this.intermediaryChannel = undefined;
        this.joinSucceedContent = super.encode({ joinSucceed: true });
        this.onServiceMessage.subscribe((msg) => this.handleSvcMsg(msg));
        this.wc.channelBuilder.onChannel.subscribe((ch) => this.peerJoined(ch));
    }
    clean() { }
    addJoining(ch, members) {
        console.info(this.wc.myId + ' addJoining ' + ch.id);
        this.peerJoined(ch);
        this.checkMembers(ch, members);
    }
    initJoining(ch) {
        console.info(this.wc.myId + ' initJoining ' + ch.id);
        this.peerJoined(ch);
        this.joinAttempts = 0;
        this.intermediaryChannel = ch;
    }
    send(msg) {
        const bytes = this.wc.encode(msg);
        for (const ch of this.channels) {
            ch.send(bytes);
        }
    }
    forward(msg) { }
    sendTo(msg) {
        const bytes = this.wc.encode(msg);
        for (const ch of this.channels) {
            if (ch.id === msg.recipientId) {
                ch.send(bytes);
                return;
            }
        }
        if (this.intermediaryChannel) {
            this.intermediaryChannel.send((bytes));
            return;
        }
        else {
            for (const [id, ch] of this.jps) {
                if (id === msg.recipientId) {
                    ch.send((bytes));
                    return;
                }
            }
        }
        console.error(this.wc.myId + ' The recipient could not be found', msg.recipientId);
    }
    forwardTo(msg) {
        this.sendTo(msg);
    }
    leave() {
        for (const ch of this.channels) {
            ch.close();
        }
        this.jps = new Map();
        this.joinAttempts = 0;
        this.intermediaryChannel = undefined;
    }
    onChannelClose(event, channel) {
        if (this.intermediaryChannel && this.intermediaryChannel === channel) {
            this.leave();
            this.wc.joinSubject.next(new Error(`Intermediary channel closed: ${event.type}`));
        }
        if (this.channels.delete(channel)) {
            this.wc.onMemberLeaveProxy(channel.id);
            console.info(this.wc.myId + ' onMemberLeaveProxy ' + channel.id);
        }
    }
    onChannelError(evt, channel) {
        console.error(`Channel error: ${evt.type}`);
    }
    handleSvcMsg({ channel, senderId, recipientId, msg }) {
        switch (msg.type) {
            case 'connectTo': {
                // Filter only missing peers
                const missingPeers = msg.connectTo.members.filter((id) => id !== this.wc.myId && !this.wc.members.includes(id));
                // Establish connection to the missing peers
                const misssingConnections = [];
                for (const id of missingPeers) {
                    misssingConnections[misssingConnections.length] = new Promise((resolve) => {
                        this.wc.channelBuilder.connectTo(id)
                            .then((ch) => {
                            this.peerJoined(ch);
                            resolve();
                        })
                            .catch((err) => {
                            console.warn(this.wc.myId + ' failed to connect to ' + id, err.message);
                            resolve();
                        });
                    });
                }
                // Notify the intermediary peer about your members
                Promise.all(misssingConnections).then(() => {
                    const send = () => channel.send(this.wc.encode({
                        recipientId: channel.id,
                        content: super.encode({ connectedTo: { members: this.wc.members } }),
                    }));
                    if (this.joinAttempts === MAX_JOIN_ATTEMPTS) {
                        this.leave();
                        this.wc.joinSubject.next(new Error('Failed to join: maximum join attempts has reached'));
                    }
                    else if (this.joinAttempts > 0) {
                        setTimeout(() => send(), 200 + 100 * Math.random());
                    }
                    else {
                        send();
                    }
                    this.joinAttempts++;
                });
                break;
            }
            case 'connectedTo': {
                this.checkMembers(channel, msg.connectedTo.members);
                break;
            }
            case 'joiningPeerId': {
                if (msg.joiningPeerId !== this.wc.myId && !this.wc.members.includes(msg.joiningPeerId)) {
                    this.jps.set(msg.joiningPeerId, channel);
                }
                break;
            }
            case 'joinSucceed': {
                this.intermediaryChannel = undefined;
                this.wc.joinSubject.next();
                console.info(this.wc.myId + ' _joinSucceed ');
                break;
            }
        }
    }
    checkMembers(ch, members) {
        // Joining succeed if the joining peer and his intermediary peer
        // have same members (excludings themselves)
        if (this.wc.members.length === members.length && members.every((id) => id === this.wc.myId || this.wc.members.includes(id))) {
            console.log(this.wc.myId + ' checkMembers JOIN SUCCEED');
            ch.send(this.wc.encode({
                recipientId: ch.id,
                content: this.joinSucceedContent,
            }));
            return;
        }
        // Joining did not finish, resend my members to the joining peer
        this.wc.sendProxy({ content: super.encode({ joiningPeerId: ch.id }) });
        ch.send(this.wc.encode({
            recipientId: ch.id,
            content: super.encode({ connectTo: { members: this.wc.members } }),
        }));
    }
    peerJoined(ch) {
        this.channels.add(ch);
        this.wc.onMemberJoinProxy(ch.id);
        this.jps.delete(ch.id);
        console.info(this.wc.myId + ' peerJoined ' + ch.id);
    }
}

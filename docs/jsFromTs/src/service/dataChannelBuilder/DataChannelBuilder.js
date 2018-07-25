import { Subject } from 'rxjs';
import { Channel } from '../../Channel';
import '../../misc/env';
import { env } from '../../misc/env';
import { log } from '../../misc/util';
import { dataChannelBuilder as proto } from '../../proto/index';
import { Service } from '../Service';
import { Remote } from './Remote';
export const CONNECT_TIMEOUT = 9000;
/**
 * Service class responsible to establish `RTCDataChannel` between two remotes via
 * signaling server or `WebChannel`.
 */
export class DataChannelBuilder extends Service {
    constructor(wc, rtcConfiguration) {
        super(DataChannelBuilder.SERVICE_ID, proto.Message);
        this.wc = wc;
        this.allStreams = super.useAllStreams(wc, wc.signaling);
        this.rtcConfiguration = rtcConfiguration;
        this.channelsSubject = new Subject();
        this.remotes = new Map();
        this.allStreams.message.subscribe(({ streamId, senderId, recipientId, msg }) => {
            let remote = this.remotes.get(senderId);
            if (remote && remote.finalMessageReceived) {
                remote.clean(false);
                remote = undefined;
            }
            if (!remote) {
                if (msg.type && (msg.type === 'offer' || msg.type === 'candidate')) {
                    try {
                        remote = this.createRemote(streamId, senderId, recipientId, true);
                    }
                    catch (err) {
                        return;
                    }
                }
                else {
                    return;
                }
            }
            remote.handleMessage(msg);
        });
    }
    get channels() {
        return this.channelsSubject.asObservable();
    }
    /**
     * Establish an `RTCDataChannel`. Starts by sending an **SDP offer**.
     */
    async connect(targetId, myId, type) {
        log.webrtc('connectWith call', { targetId, myId, type });
        const streamId = type === Channel.WITH_INTERNAL ? this.wc.STREAM_ID : this.wc.signaling.STREAM_ID;
        let remote = this.remotes.get(targetId);
        if (remote) {
            remote.clean();
        }
        else {
            remote = this.createRemote(streamId, targetId, myId);
        }
        const remoteType = Channel.remoteType(type);
        const dc = remote.pc.createDataChannel(`{"id":${this.wc.myId},"type":${remoteType}}`);
        const offerInit = await remote.pc.createOffer();
        await remote.pc.setLocalDescription(offerInit);
        const offer = remote.pc.localDescription.sdp;
        this.allStreams.sendOver(streamId, { offer }, targetId, myId);
        remote.sdpIsSent();
        const channel = (await new Promise((resolve, reject) => {
            remote.onError = (err) => reject(err);
            dc.onopen = () => {
                remote.dataChannelOpen(dc);
                resolve(new Channel(this.wc, dc, type, targetId, remote.pc));
            };
        }));
        this.channelsSubject.next({ id: targetId, channel });
    }
    clean(id) {
        if (id) {
            const remote = this.remotes.get(id);
            if (remote) {
                remote.clean(false);
            }
        }
        else {
            this.remotes.forEach((remote) => remote.onError(new Error('clean')));
        }
    }
    createRemote(streamId, recipientId, senderId, passive = false) {
        const remote = new Remote(recipientId, new env.RTCPeerConnection(this.rtcConfiguration), (msg) => this.allStreams.sendOver(streamId, msg, recipientId, senderId), this.remotes, CONNECT_TIMEOUT);
        if (passive) {
            log.webrtc(`create a new remote object with ${recipientId} - PASSIVE`);
            const pc = remote.pc;
            pc.ondatachannel = ({ channel: dc }) => {
                const { id, type } = JSON.parse(dc.label);
                dc.onopen = () => {
                    remote.dataChannelOpen(dc);
                    const channel = new Channel(this.wc, dc, type, id, remote.pc);
                    this.channelsSubject.next({ id: recipientId, channel });
                };
            };
        }
        else {
            log.webrtc(`create a new remote object with ${recipientId} - INITIATOR`);
        }
        return remote;
    }
}
DataChannelBuilder.SERVICE_ID = 7431;

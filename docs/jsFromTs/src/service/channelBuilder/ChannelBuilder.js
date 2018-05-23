import { merge, Subject } from 'rxjs';
import { ChannelType } from '../../Channel';
import { isWebRTCSupported, isWebSocketSupported, log } from '../../misc/util';
import { channelBuilder as proto } from '../../proto';
import { CONNECT_TIMEOUT as WEBSOCKET_TIMEOUT, WebSocketBuilder } from '../../WebSocketBuilder';
import { CONNECT_TIMEOUT as DATACHANNEL_TIMEOUT, DataChannelBuilder, } from '../dataChannelBuilder/DataChannelBuilder';
import { Service } from '../Service';
import { PendingRequests } from './PendingRequests';
// Timeout constants
const CONNECT_TIMEOUT = Math.max(DATACHANNEL_TIMEOUT, WEBSOCKET_TIMEOUT) + 5000;
const PING_DEFAULT_TIMEOUT = 700;
const PING_MAX_TIMEOUT = 3000;
/**
 * It is responsible to build a channel between two peers with a help of `WebSocketBuilder` and `DataChannelBuilder`.
 * Its algorithm determine which channel (socket or dataChannel) should be created
 * based on the services availability and peers' preferences.
 */
export class ChannelBuilder extends Service {
    constructor(wc) {
        super(ChannelBuilder.SERVICE_ID, proto.Message);
        this.wc = wc;
        this.allStreams = super.useAllStreams(wc, wc.signaling);
        this.pendingReqs = new PendingRequests(this.wc.STREAM_ID);
        this.channelsSubject = new Subject();
        this.dataChannelBuilder = new DataChannelBuilder(this.wc, this.wc.rtcConfiguration);
        this.pingTimeout = PING_DEFAULT_TIMEOUT;
        this.myInfo = {
            wsTried: false,
            wsSupported: isWebSocketSupported(),
            dcTried: false,
            dcSupported: isWebRTCSupported(),
        };
        // Encode messages beforehand for optimization
        this.pairEncoded = super.encode({ pair: { initiator: this.myInfo } });
        this.encodePingPong();
        // Subscribe to WebChannel and Signalings streams
        this.allStreams.message.subscribe(({ streamId, senderId, msg }) => {
            this.handleMessage(streamId, senderId, msg);
        });
        // Subscribe to channels from WebSocket and WebRTC builders
        this.subscribeToChannels();
        // Subscribe to WebSocket server listen url changes and WebChannel id change
        this.subscribeToURLandIDChange();
    }
    clean() {
        this.dataChannelBuilder.clean();
        this.pendingReqs.clean();
    }
    get onChannel() {
        return this.channelsSubject.asObservable();
    }
    async connectOverWebChannel(id) {
        let req = this.pendingReqs.get(this.wc.STREAM_ID, id);
        if (!req) {
            await this.ping(id);
            req = this.pendingReqs.add(this.wc.STREAM_ID, id, CONNECT_TIMEOUT);
            this.allStreams.sendOver(this.wc.STREAM_ID, this.pairEncoded, id);
        }
        return req.promise;
    }
    async connectOverSignaling() {
        let req = this.pendingReqs.get(this.wc.signaling.STREAM_ID, 1);
        if (!req) {
            await this.ping(1, this.wc.signaling.STREAM_ID);
            req = this.pendingReqs.add(this.wc.signaling.STREAM_ID, 1, CONNECT_TIMEOUT);
            this.allStreams.sendOver(this.wc.signaling.STREAM_ID, this.pairEncoded, 1);
        }
        return req.promise;
    }
    async ping(id, streamId = this.wc.STREAM_ID) {
        let req = this.pendingReqs.getPing(streamId, id);
        if (!req) {
            req = this.pendingReqs.addPing(streamId, id, this.pingTimeout);
            this.allStreams.sendOver(streamId, ChannelBuilder.pingEncoded, id);
        }
        try {
            await req.promise;
        }
        catch (err) {
            throw new Error('ping');
        }
    }
    handleMessage(streamId, senderId, msg) {
        switch (msg.type) {
            case 'ping':
                this.allStreams.sendOver(streamId, ChannelBuilder.pongEncoded, senderId);
                break;
            case 'pong':
                this.handlePong(streamId, senderId);
                break;
            case 'pair': {
                let { pair: { initiator, passive } /* tslint:disable-line:prefer-const */, } = msg;
                if (!passive) {
                    // This is the first message sent by the initiator
                    const req = this.pendingReqs.get(streamId, senderId);
                    if (!req) {
                        this.pendingReqs.add(streamId, senderId, CONNECT_TIMEOUT);
                    }
                    else if (senderId < this.wc.myId) {
                        return;
                    }
                    initiator.id = senderId;
                    passive = Object.assign({}, this.myInfo);
                    passive.id = streamId === this.wc.STREAM_ID ? this.wc.myId : 1;
                }
                this.proceedAlgo(streamId, initiator, passive, passive.id === senderId).catch((err) => {
                    const req = this.pendingReqs.get(streamId, senderId);
                    if (req) {
                        req.reject(err);
                    }
                    this.allStreams.sendOver(streamId, { pair: { initiator, passive } }, senderId);
                });
            }
        }
    }
    async proceedAlgo(streamId, initiator, passive, amIInitiator) {
        let me;
        let theOther;
        if (amIInitiator) {
            me = initiator;
            theOther = passive;
        }
        else {
            me = passive;
            theOther = initiator;
        }
        // Try to connect over WebSocket
        if (theOther.wss && !me.wsTried && this.tryWs(streamId, me, theOther, amIInitiator)) {
            return;
        }
        // Prompt the other peer to connect over WebSocket as I was not able
        if (me.wss && !theOther.wsTried) {
            log.channelBuilder(`Prompt the other to connect over WebSocket`);
            this.allStreams.sendOver(streamId, { pair: { initiator, passive } }, theOther.id);
            return;
        }
        // Try to connect over RTCDataChannel, because no luck with WebSocket
        if (me.dcSupported && theOther.dcSupported) {
            if (!me.dcTried && this.tryDc(streamId, me, theOther, amIInitiator)) {
                return;
            }
            // Prompt the other peer to connect over RTCDataChannel as I was not able
            if (!theOther.dcTried) {
                log.channelBuilder(`Prompt the other to connect over RTCDataChannel`);
                this.allStreams.sendOver(streamId, { pair: { initiator, passive } }, theOther.id);
                return;
            }
        }
        log.channelBuilder(`ChannelBuilder FAILED`);
        // All connection possibilities have been tried and none of them worked
        throw new Error(`Failed to establish a connection between ${me.id} and ${theOther.id}`);
    }
    async tryWs(streamId, me, theOther, amIInitiator) {
        try {
            if (streamId === this.wc.STREAM_ID) {
                await this.wc.webSocketBuilder.connectInternal(theOther.wss, theOther.id);
            }
            else if (amIInitiator) {
                await this.wc.webSocketBuilder.connectToJoin(theOther.wss, theOther.wcId);
            }
            else {
                await this.wc.webSocketBuilder.connectToInvite(theOther.wss);
            }
            log.channelBuilder(`New WebSocket connection with ${theOther.id}`);
            return true;
        }
        catch (err) {
            if (err.message !== 'clean') {
                log.channelBuilder(`WebSocket failed with ${theOther.id}`, err);
                me.wsTried = true;
                return false;
            }
            else {
                return true;
            }
        }
    }
    async tryDc(streamId, me, theOther, amIInitiator) {
        try {
            if (streamId === this.wc.STREAM_ID) {
                await this.dataChannelBuilder.connectInternal(theOther.id);
            }
            else if (amIInitiator) {
                await this.dataChannelBuilder.connectToJoin(theOther.id);
            }
            else {
                await this.dataChannelBuilder.connectToInvite(theOther.id);
            }
            log.channelBuilder(`New RTCDataChannel with ${theOther.id}`);
            return true;
        }
        catch (err) {
            if (err.message !== 'clean') {
                log.channelBuilder(`RTCDataChannel failed with ${theOther.id}`, err);
                me.dcTried = true;
                return false;
            }
            else {
                return true;
            }
        }
    }
    handlePong(streamId, id) {
        const req = this.pendingReqs.getPing(streamId, id);
        if (req) {
            req.resolve();
        }
        else {
            // Ping timeout has gone before receiving a pong, thus increase ping timeout value
            const created = this.pendingReqs.getCreatedDate(streamId, id);
            if (created) {
                log.channelBuilder('INCREASING Ping/Pong timeout up to: ' + this.pingTimeout);
                this.pingTimeout = Math.min(Date.now() - created + 500, PING_MAX_TIMEOUT);
            }
            else {
                log.channelBuilder('Could not find timeout request date. This message should never be shown: something is wrong.');
            }
        }
    }
    encodePingPong() {
        if (!ChannelBuilder.pingEncoded && !ChannelBuilder.pongEncoded) {
            ChannelBuilder.pingEncoded = super.encode({ ping: true });
            ChannelBuilder.pongEncoded = super.encode({ pong: true });
        }
    }
    subscribeToChannels() {
        merge(this.dataChannelBuilder.onChannel(), this.wc.webSocketBuilder.onChannel()).subscribe((channel) => {
            channel.init.then(() => {
                let pendingReq;
                if (channel.type === ChannelType.INTERNAL) {
                    pendingReq = this.pendingReqs.get(this.wc.STREAM_ID, channel.id);
                }
                else if (channel.type === ChannelType.INVITED) {
                    pendingReq = this.pendingReqs.get(this.wc.signaling.STREAM_ID, channel.id);
                }
                else if (channel.type === ChannelType.JOINING) {
                    pendingReq = this.pendingReqs.get(this.wc.signaling.STREAM_ID, 1);
                }
                if (pendingReq) {
                    pendingReq.resolve();
                }
                this.channelsSubject.next(channel);
            });
        });
    }
    subscribeToURLandIDChange() {
        WebSocketBuilder.listenUrl.subscribe((url) => {
            if (url) {
                this.myInfo.wss = url;
                this.pairEncoded = super.encode({ pair: { initiator: this.myInfo } });
            }
        });
        this.wc.onIdChange.subscribe((id) => {
            log.channelBuilder('Web CHANNEL ID CHANGED TO ', this.wc.id);
            this.myInfo.wcId = this.wc.id;
            this.pairEncoded = super.encode({ pair: { initiator: this.myInfo } });
        });
    }
}
ChannelBuilder.SERVICE_ID = 74;

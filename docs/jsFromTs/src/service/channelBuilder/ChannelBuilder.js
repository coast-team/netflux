import { merge, Subject } from 'rxjs';
import { Channel } from '../../Channel';
import { isWebRTCSupported, isWebSocketSupported, log } from '../../misc/util';
import { channelBuilder as proto } from '../../proto/index';
import { CONNECT_TIMEOUT as WEBSOCKET_TIMEOUT, WebSocketBuilder } from '../../WebSocketBuilder';
import { CONNECT_TIMEOUT as DATACHANNEL_TIMEOUT, DataChannelBuilder, } from '../dataChannelBuilder/DataChannelBuilder';
import { Service } from '../Service';
import { ConnectionError } from './ConnectionError';
import { ConnectionsInProgress } from './ConnectionsInProgress';
// Timeout constants
const CONNECT_TIMEOUT = Math.max(DATACHANNEL_TIMEOUT, WEBSOCKET_TIMEOUT) + 5000;
const RESPONSE_TIMEOUT = 2000;
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
        this.connectsInProgress = new ConnectionsInProgress();
        this.channelsSubject = new Subject();
        this.onConnectionRequest = () => true;
        this.dataChannelBuilder = new DataChannelBuilder(this.wc, this.wc.rtcConfiguration);
        this.myInfo = {
            wsTried: false,
            wsSupported: isWebSocketSupported(),
            dcTried: false,
            dcSupported: isWebRTCSupported(),
        };
        // Encode messages beforehand for optimization
        this.negotiationEncoded = super.encode({ negotiation: { initiator: this.myInfo } });
        if (!ChannelBuilder.connectResTrueEncoded && !ChannelBuilder.connectResFalseEncoded) {
            ChannelBuilder.connectResTrueEncoded = super.encode({ connectionResponse: true });
            ChannelBuilder.connectResFalseEncoded = super.encode({ connectionResponse: false });
        }
        // Subscribe to WebChannel and Signalings streams
        this.allStreams.message.subscribe(({ streamId, senderId, recipientId, msg }) => {
            this.handleMessage(streamId, senderId, recipientId, msg);
        });
        // Subscribe to channels from WebSocket and WebRTC builders
        this.subscribeToChannels();
        // Subscribe to WebSocket server listen url changes and WebChannel id change
        this.subscribeToURLandIDChange();
    }
    clean() {
        log.channelBuilder('CLEAN call');
        this.dataChannelBuilder.clean();
        this.connectsInProgress.clean();
    }
    get onChannel() {
        return this.channelsSubject.asObservable();
    }
    async connectOverWebChannel(id, cb = () => { }, data = new Uint8Array()) {
        return this.connectOver(this.wc.STREAM_ID, id, cb, data);
    }
    async connectOverSignaling(cb = () => { }, data = new Uint8Array()) {
        return this.connectOver(this.wc.signaling.STREAM_ID, 0, cb, data);
    }
    async connectOver(streamId, id, cb, data) {
        let connection = this.connectsInProgress.get(id);
        if (!connection) {
            this.allStreams.sendOver(streamId, { connectionRequest: data }, id, this.wc.myId);
            connection = this.connectsInProgress.create(id, CONNECT_TIMEOUT, RESPONSE_TIMEOUT, () => this.dataChannelBuilder.clean(id));
            await connection.promise;
            cb();
            return connection.promise;
        }
        else {
            throw new Error(ConnectionError.IN_PROGRESS);
        }
    }
    handleMessage(streamId, senderId, recipientId, msg) {
        switch (msg.type) {
            case 'connectionRequest': {
                log.channelBuilder('connection Request from ', senderId);
                let connection = this.connectsInProgress.get(senderId);
                if (connection) {
                    if (senderId < this.wc.myId) {
                        connection.reject(new Error(ConnectionError.IN_PROGRESS));
                    }
                    else {
                        return;
                    }
                }
                if (this.onConnectionRequest(streamId, msg.connectionRequest)) {
                    connection = this.connectsInProgress.create(senderId, CONNECT_TIMEOUT, RESPONSE_TIMEOUT, () => this.dataChannelBuilder.clean(senderId));
                    connection.resolve();
                    log.channelBuilder('connection Response POSITIVE to ', senderId);
                    this.allStreams.sendOver(streamId, ChannelBuilder.connectResTrueEncoded, senderId, recipientId);
                }
                else {
                    log.channelBuilder('connection Response NEGATIVE to ', senderId);
                    this.allStreams.sendOver(streamId, ChannelBuilder.connectResFalseEncoded, senderId, recipientId);
                }
                break;
            }
            case 'connectionResponse': {
                log.channelBuilder('connection Response from ', senderId);
                const connection = this.connectsInProgress.get(senderId);
                if (connection) {
                    if (msg.connectionResponse) {
                        connection.resolve();
                        log.channelBuilder('Send first negotiation message to ', senderId);
                        this.allStreams.sendOver(streamId, this.negotiationEncoded, senderId, recipientId);
                    }
                    else {
                        connection.reject(new Error(ConnectionError.DENIED));
                    }
                }
                break;
            }
            case 'negotiation': {
                if (this.connectsInProgress.has(streamId, senderId)) {
                    const neg = msg.negotiation;
                    const initiator = neg.initiator;
                    let passive = neg.passive;
                    if (!passive) {
                        // This is the first message sent by the initiator
                        initiator.id = senderId;
                        passive = Object.assign({}, this.myInfo);
                        passive.id = recipientId;
                    }
                    log.channelBuilder(`NEGOTIATION message to proceed from ${senderId}: `, JSON.stringify({
                        isIamInitiatore: passive.id === senderId,
                        passive,
                        initiator,
                        senderId,
                        recipientId,
                    }));
                    if (this.isNagotiable(initiator, passive)) {
                        this.proceedNegotiation(streamId, initiator, passive, passive.id === senderId).catch((err) => {
                            this.rejectConnection(streamId, senderId, err);
                            log.channelBuilder(`NEGOTIATION with ${senderId} FIALED: `, { passive, initiator });
                            this.allStreams.sendOver(streamId, { negotiation: { initiator, passive } }, senderId, recipientId);
                        });
                    }
                    else {
                        this.rejectConnection(streamId, senderId, new Error(ConnectionError.NEGOTIATION_ERROR));
                    }
                }
                break;
            }
        }
    }
    async proceedNegotiation(streamId, initiator, passive, amIInitiator) {
        const [me, theOther] = amIInitiator ? [initiator, passive] : [passive, initiator];
        // Try to connect over WebSocket
        if (theOther.wss && !me.wsTried && (await this.tryWs(streamId, me, theOther, amIInitiator))) {
            return;
        }
        // Prompt the other peer to connect over WebSocket as I was not able
        if (me.wss && !theOther.wsTried) {
            log.channelBuilder(`Prompt the other to connect over WebSocket`);
            this.allStreams.sendOver(streamId, { negotiation: { initiator, passive } }, theOther.id, me.id);
            return;
        }
        // Try to connect over RTCDataChannel, because no luck with WebSocket
        if (me.dcSupported && theOther.dcSupported) {
            if (!me.dcTried && (await this.tryDc(streamId, me, theOther, amIInitiator))) {
                return;
            }
            // Prompt the other peer to connect over RTCDataChannel as I was not able
            if (!theOther.dcTried) {
                log.channelBuilder(`Prompt the other to connect over RTCDataChannel`);
                this.allStreams.sendOver(streamId, { negotiation: { initiator, passive } }, theOther.id, me.id);
                return;
            }
        }
        // All connection possibilities have been tried and none of them worked
        throw new Error(ConnectionError.NEGOTIATION_ERROR);
    }
    async tryWs(streamId, me, theOther, amIInitiator) {
        try {
            const type = this.getType(streamId, amIInitiator);
            const wcId = type === Channel.WITH_MEMBER ? theOther.wcId : this.wc.myId;
            await this.wc.webSocketBuilder.connect(theOther.wss, type, theOther.id, me.id, wcId);
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
            const type = this.getType(streamId, amIInitiator);
            await this.dataChannelBuilder.connect(theOther.id, me.id, type);
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
    getType(streamId, amIInitiator) {
        if (streamId === this.wc.STREAM_ID) {
            return Channel.WITH_INTERNAL;
        }
        return amIInitiator ? Channel.WITH_MEMBER : Channel.WITH_JOINING;
    }
    isNagotiable(peerInfo1, peerInfo2) {
        return ((peerInfo1.wss && !peerInfo2.wsTried) ||
            (peerInfo2.wss && !peerInfo1.wsTried) ||
            (peerInfo1.dcSupported && peerInfo2.dcSupported && (!peerInfo1.dcTried || !peerInfo2.dcTried)));
    }
    subscribeToChannels() {
        merge(this.dataChannelBuilder.channels, this.wc.webSocketBuilder.channels).subscribe(({ id, channel }) => {
            channel.init.then(() => {
                log.channelBuilder('NEW Channel from ', JSON.stringify({ type: channel.type, id }));
                const connection = this.connectsInProgress.get(id);
                if (connection) {
                    log.channelBuilder('RESOLVE this NEW Channel');
                    connection.resolve();
                }
                else {
                    log.channelBuilder('this NEW Channel NOT FOUND');
                }
                this.channelsSubject.next(channel);
            });
        });
    }
    subscribeToURLandIDChange() {
        WebSocketBuilder.listenUrl.subscribe((url) => {
            if (url) {
                this.myInfo.wss = url;
                this.negotiationEncoded = super.encode({ negotiation: { initiator: this.myInfo } });
            }
        });
        this.wc.onIdChange.subscribe((id) => {
            this.myInfo.wcId = this.wc.id;
            this.negotiationEncoded = super.encode({ negotiation: { initiator: this.myInfo } });
        });
    }
    rejectConnection(streamId, senderId, err) {
        const connection = this.connectsInProgress.get(senderId);
        if (connection) {
            connection.reject(err);
        }
    }
}
ChannelBuilder.SERVICE_ID = 74;

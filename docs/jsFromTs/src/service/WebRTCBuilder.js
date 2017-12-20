import { Observable } from 'rxjs/Observable';
import { filter, map, pluck } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Channel } from '../Channel';
import { log } from '../misc/Util';
import { webRTCBuilder } from '../proto';
import { Service } from './Service';
/**
 * Service id.
 */
const ID = 300;
/**
 * Service class responsible to establish `RTCDataChannel` between two remotes via
 * signaling server or `WebChannel`.
 *
 */
export class WebRTCBuilder extends Service {
    /**
     * Indicates whether WebRTC is supported by the environment.
     */
    static get isSupported() {
        return global.RTCPeerConnection !== undefined;
    }
    constructor(wc, iceServers) {
        super(ID, webRTCBuilder.Message, wc.serviceMessageSubject);
        this.wc = wc;
        this.rtcConfiguration = {
            iceServers,
            iceCandidatePoolSize: 10,
            rtcpMuxPolicy: 'require',
        };
    }
    /**
     * Listen on `RTCDataChannel` from WebChannel (another peer is playing a signaling role).
     * Starts to listen on **SDP answer**.
     */
    onChannelFromWebChannel() {
        if (WebRTCBuilder.isSupported) {
            return this.onChannel(this.onServiceMessage.pipe(filter(({ msg }) => msg.isInitiator), map(({ msg, senderId }) => {
                msg.id = senderId;
                return msg;
            })), (msg, id) => this.wc.sendToProxy({ recipientId: id, content: super.encode(msg) }));
        }
        log.debug('WebRTC is not supported');
        throw new Error('WebRTC is not supported');
    }
    /**
     * Establish an `RTCDataChannel` with a peer identified by `id` trough `WebChannel`.
     * Starts by sending an **SDP offer**.
     *
     * @param id  Peer id
     */
    connectOverWebChannel(id) {
        if (WebRTCBuilder.isSupported) {
            return this.establishChannel(this.onServiceMessage.pipe(filter(({ msg, senderId }) => senderId === id && !msg.isInitiator), pluck('msg')), (msg) => {
                msg['isInitiator'] = true;
                this.wc.sendToProxy({ recipientId: id, content: super.encode(msg) });
            }, id);
        }
        throw new Error('WebRTC is not supported');
    }
    /**
     * Listen on `RTCDataChannel` from Signaling server.
     * Starts to listen on **SDP answer**.
     */
    onChannelFromSignaling(signalingConnection) {
        if (WebRTCBuilder.isSupported) {
            return this.onChannel(signalingConnection.onMessage.pipe(filter((msg) => msg.id !== 0), map((msg) => {
                if (msg.type === 'data') {
                    const data = super.decode(msg.data);
                    data.id = msg.id;
                    return data;
                }
                return msg;
            })), (msg, id) => {
                if (!('isError' in msg || 'isEnd' in msg)) {
                    msg.data = webRTCBuilder.Message.encode(webRTCBuilder.Message.create(msg)).finish();
                }
                msg.id = id;
                signalingConnection.send(msg);
            });
        }
        throw new Error('WebRTC is not supported');
    }
    /**
     * Establish an `RTCDataChannel` with a peer identified by `id` trough Signaling server.
     * Starts by sending an **SDP offer**.
     */
    connectOverSignaling(signalingConnection) {
        if (WebRTCBuilder.isSupported) {
            return this.establishChannel(signalingConnection.onMessage.pipe(filter((msg) => msg.id === 0), map((msg) => msg.type === 'data' ? super.decode(msg.data) : msg)), (msg) => {
                if (!('isError' in msg || 'isEnd' in msg)) {
                    signalingConnection.send({ data: webRTCBuilder.Message.encode(webRTCBuilder.Message.create(msg)).finish() });
                }
                else {
                    signalingConnection.send(msg);
                }
            });
        }
        throw new Error('WebRTC is not supported');
    }
    establishChannel(onMessage, send, id = 1) {
        let isOfferSent = false;
        const pc = new global.RTCPeerConnection(this.rtcConfiguration);
        pc.onicegatheringstatechange = () => {
            log.debug('ICE GATHERING STATE changed to', pc.iceGatheringState);
            if (pc.iceGatheringState === 'complete' && isOfferSent) {
                send({ isEnd: true });
                isOfferSent = false;
            }
        };
        pc.onsignalingstatechange = () => { log.debug('SIGNALING STATE changed to', pc.signalingState); };
        const remoteCandidateStream = new ReplaySubject();
        this.setupLocalCandidates(pc, (iceCandidate) => send({ iceCandidate }));
        return new Promise((resolve, reject) => {
            const onMessageSub = onMessage.subscribe(({ answer, iceCandidate, isError, isEnd }) => {
                pc.oniceconnectionstatechange = () => {
                    log.debug('ICE CONNECTION STATE changed to', pc.iceConnectionState);
                    if (pc.iceConnectionState === 'failed') {
                        remoteCandidateStream.complete();
                        pc.close();
                        send({ isError: true });
                        onMessageSub.unsubscribe();
                        reject(new Error('Failed to establish RTCDataChannel: Ice Connection failed'));
                    }
                };
                if (isError) {
                    remoteCandidateStream.complete();
                    onMessageSub.unsubscribe();
                    if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
                        log.debug('Failed to establish RTCDataChannel: remote peer error');
                        pc.close();
                        reject(new Error('Remote peer error'));
                    }
                    else {
                        log.debug('Remote peer error, but RTCDataChannel has still been established');
                    }
                }
                else if (answer) {
                    log.debug('REMOTE Answer is received', answer);
                    pc.setRemoteDescription({ type: 'answer', sdp: answer })
                        .then(() => {
                        remoteCandidateStream.subscribe((ic) => pc.addIceCandidate(ic)
                            .catch((err) => log.debug('${id}: Failed to add REMOTE Ice Candidate', err)));
                    })
                        .catch((err) => {
                        log.debug('Failed to establish RTCDataChannel: Set REMOTE Answer ERROR', err);
                        remoteCandidateStream.complete();
                        pc.close();
                        send({ isError: true });
                        onMessageSub.unsubscribe();
                        reject(new Error('Error during setting a remote answer'));
                    });
                }
                else if (iceCandidate) {
                    if (iceCandidate.candidate !== '') {
                        log.debug('REMOTE Ice Candidate is received', iceCandidate);
                        remoteCandidateStream.next(new global.RTCIceCandidate(iceCandidate));
                    }
                    else {
                        log.debug('REMOTE Ice Candidate gathering COMPLETED', iceCandidate.candidate);
                        remoteCandidateStream.complete();
                    }
                }
                else if (isEnd) {
                    log.debug('REMOTE Peer FINISHED send all data');
                    onMessageSub.unsubscribe();
                }
                else {
                    log.debug('Unknown message from a remote peer: stopping connection establishment');
                    remoteCandidateStream.complete();
                    pc.close();
                    send({ isError: true });
                    onMessageSub.unsubscribe();
                    reject(new Error('Unknown message from a remote peer'));
                }
            }, (err) => {
                log.debug('Intermidiary steram was interrupted', err);
                remoteCandidateStream.complete();
                if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
                    log.debug('Failed to establish RTCDataChannel: Intermidiary steram was interrupted');
                    pc.close();
                    reject(err);
                }
                else {
                    log.debug('Intermidiary steram was interrupted, but RTCDataChannel has still been established');
                }
            }, () => {
                remoteCandidateStream.complete();
                if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
                    const err = new Error('Intermidiary steram was closed');
                    log.debug('Failed to establish RTCDataChannel', err);
                    pc.close();
                    reject(err);
                }
                else {
                    log.debug('Connection with Signaling was closed, but RTCDataChannel has still been established');
                }
            });
            this.openChannel(pc, id)
                .then(resolve)
                .catch((err) => {
                remoteCandidateStream.complete();
                pc.close();
                send({ isError: true });
                onMessageSub.unsubscribe();
                reject(err);
            });
            pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(() => {
                log.debug('Send LOCAL Offer: ', pc.localDescription.sdp);
                send({ offer: pc.localDescription.sdp });
                isOfferSent = true;
                if (pc.iceGatheringState === 'complete') {
                    send({ isEnd: true });
                }
            })
                .catch((err) => {
                remoteCandidateStream.complete();
                pc.close();
                send({ isError: true });
                onMessageSub.unsubscribe();
                log.debug('Failed to establish RTCDataChannel: Error while setting LOCAL Offer', err);
                reject(err);
            });
        });
    }
    onChannel(onMessage, send) {
        const remotes = new Map();
        const failedRemotes = [];
        return Observable.create((observer) => {
            onMessage.pipe(filter(({ id }) => !failedRemotes.includes(id)))
                .subscribe((msg) => {
                const { offer, iceCandidate, id, isError, isEnd } = msg;
                if (isError) {
                    log.debug(`${id}: Failed to establish RTCDataChannel: remote peer error`);
                    if (remotes.has(id)) {
                        const [pc, remoteCandidateStream] = remotes.get(id);
                        remoteCandidateStream.complete();
                        pc.close();
                        remotes.delete(id);
                    }
                    failedRemotes[failedRemotes.length] = id;
                }
                else {
                    let pc;
                    let remoteCandidateStream;
                    let isAnswerSent;
                    if (remotes.has(id)) {
                        [pc, remoteCandidateStream, isAnswerSent] = remotes.get(id);
                    }
                    else {
                        isAnswerSent = false;
                        pc = new global.RTCPeerConnection(this.rtcConfiguration);
                        pc.oniceconnectionstatechange = () => {
                            log.debug(`${id}: ICE CONNECTION STATE changed to`, pc.iceConnectionState);
                            if (pc.iceConnectionState === 'failed') {
                                remoteCandidateStream.complete();
                                pc.close();
                                send({ isError: true }, id);
                                remotes.delete(id);
                                failedRemotes[failedRemotes.length] = id;
                            }
                        };
                        pc.onicegatheringstatechange = () => {
                            log.debug('ICE GATHERING STATE changed to', pc.iceGatheringState);
                            if (pc.iceGatheringState === 'complete' && isAnswerSent) {
                                send({ isEnd: true }, id);
                                isAnswerSent = false;
                            }
                        };
                        pc.onsignalingstatechange = () => { log.debug('SIGNALING STATE changed to', pc.signalingState); };
                        remoteCandidateStream = new ReplaySubject();
                        this.setupLocalCandidates(pc, (ic) => send({ iceCandidate: ic }, id));
                        this.openChannel(pc).then((ch) => observer.next(ch));
                        remotes.set(id, [pc, remoteCandidateStream, isAnswerSent]);
                    }
                    if (offer) {
                        log.debug(`${id}: REMOTE OFFER is received`, offer);
                        pc.setRemoteDescription({ type: 'offer', sdp: offer })
                            .then(() => remoteCandidateStream.subscribe((ic) => pc.addIceCandidate(ic).catch((err) => log.debug('${id}: Failed to addIceCandidate', err))))
                            .then(() => pc.createAnswer())
                            .then((answer) => pc.setLocalDescription(answer))
                            .then(() => {
                            log.debug(`${id}: Send LOCAL ANSWER`, pc.localDescription.sdp);
                            send({ answer: pc.localDescription.sdp }, id);
                            isAnswerSent = true;
                            if (pc.iceGatheringState === 'complete') {
                                send({ isEnd: true }, id);
                                isAnswerSent = false;
                            }
                        })
                            .catch((err) => {
                            log.debug(`${id}: Error during offer/answer setting`, err);
                            remoteCandidateStream.complete();
                            failedRemotes[failedRemotes.length] = id;
                            pc.close();
                            remotes.delete(id);
                            send({ isError: true }, id);
                        });
                    }
                    else if (iceCandidate) {
                        if (iceCandidate.candidate !== '') {
                            log.debug(`${id}: REMOTE Ice Candidate is received`, iceCandidate);
                            remoteCandidateStream.next(new global.RTCIceCandidate(iceCandidate));
                        }
                        else {
                            log.debug(`${id}: REMOTE Ice Candidate gathering COMPLETED`, iceCandidate.candidate);
                            remoteCandidateStream.complete();
                        }
                    }
                    else if (isEnd) {
                        log.debug('REMOTE Peer FINISHED send all data');
                        remotes.delete(id);
                    }
                    else {
                        log.debug('Unknown message from a remote peer: stopping connection establishment', msg);
                        remoteCandidateStream.complete();
                        remotes.delete(id);
                        failedRemotes[failedRemotes.length] = id;
                        pc.close();
                        send({ isError: true }, id);
                    }
                }
            }, (err) => {
                log.debug('Intermidiary steram was interrupted', err);
                for (const [id, [pc, remoteCandidateStream]] of remotes) {
                    remoteCandidateStream.complete();
                    if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
                        log.debug(`${id}: Failed to establish RTCDataChannel`);
                        pc.close();
                    }
                    else {
                        log.debug(`RTCDataChannel with ${id} has still been established`);
                    }
                }
                observer.error(err);
            }, () => {
                log.debug('Intermidiary stream has closed');
                for (const [id, [pc, remoteCandidateStream]] of remotes) {
                    remoteCandidateStream.complete();
                    if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
                        log.debug(`Failed to establish RTCDataChannel with ${id}: Intermidiary stream has closed`);
                        pc.close();
                    }
                    else {
                        log.debug(`RTCDataChannel with ${id} has still been established`);
                    }
                }
                observer.complete();
            });
        });
    }
    setupLocalCandidates(pc, cb) {
        pc.onicecandidate = (evt) => {
            if (evt.candidate !== null) {
                log.debug('LOCAL Ice Candidate gathered', evt.candidate);
                cb({
                    candidate: evt.candidate.candidate,
                    sdpMid: evt.candidate.sdpMid,
                    sdpMLineIndex: evt.candidate.sdpMLineIndex,
                });
            }
        };
    }
    openChannel(pc, id) {
        if (id) {
            try {
                const dc = pc.createDataChannel((this.wc.myId).toString());
                return new Promise((resolve) => {
                    dc.onopen = () => {
                        log.debug(`RTCDataChannel with ${id} has opened`, pc.sctp);
                        resolve(new Channel(this.wc, dc, { rtcPeerConnection: pc, id }));
                    };
                });
            }
            catch (err) {
                log.debug('Failed to create RTCDataChannel', err);
                return Promise.reject(err);
            }
        }
        else {
            return new Promise((resolve) => {
                pc.ondatachannel = (dcEvt) => {
                    const dc = dcEvt.channel;
                    const peerId = Number.parseInt(dc.label, 10);
                    dc.onopen = (evt) => {
                        log.debug(`RTCDataChannel with ${peerId} has opened`, pc.sctp);
                        resolve(new Channel(this.wc, dc, { rtcPeerConnection: pc, id: peerId }));
                    };
                };
            });
        }
    }
}

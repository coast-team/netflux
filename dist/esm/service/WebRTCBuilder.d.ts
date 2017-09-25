import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { Channel } from '../Channel';
import { signaling } from '../proto';
import { Service } from './Service';
import { WebChannel } from './WebChannel';
export interface ISignalingConnection {
    onMessage: Observable<any>;
    send: (msg: signaling.IContent) => void;
}
/**
 * Service class responsible to establish `RTCDataChannel` between two clients via
 * signaling server or `WebChannel`.
 *
 */
export declare class WebRTCBuilder extends Service {
    /**
     * Indicates whether WebRTC is supported by the environment.
     */
    static readonly isSupported: boolean;
    private wc;
    private rtcConfiguration;
    private clients;
    constructor(wc: WebChannel, iceServers: RTCIceServer[]);
    onChannelFromWebChannel(): Observable<Channel>;
    /**
     * Establish an `RTCDataChannel` with a peer identified by `id` trough `WebChannel`.
     * Starts by sending an **SDP offer**.
     *
     * @param id  Peer id
     */
    connectOverWebChannel(id: number): Promise<Channel>;
    /**
     * Listen on `RTCDataChannel` from Signaling server.
     * Starts to listen on **SDP answer**.
     */
    onChannelFromSignaling(signalingConnection: ISignalingConnection): Observable<Channel>;
    /**
     * Establish an `RTCDataChannel` with a peer identified by `id` trough Signaling server.
     * Starts by sending an **SDP offer**.
     */
    connectOverSignaling(signalingConnection: ISignalingConnection): Promise<Channel>;
    private establishChannel(onMessage, send, peerId?);
    private onChannel(onMessage, send);
    private localCandidates(pc);
    private openChannel(pc, peerId?);
}

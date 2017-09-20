import { WebChannel, StateEnum } from './service/WebChannel';
import { TopologyEnum } from './service/topology/Topology';
import { SignalingStateEnum } from './Signaling';
/**
 * @ignore
 */
export declare const wcs: WeakMap<WebGroup, WebChannel>;
export declare type DataType = string | Uint8Array;
/**
 * This class is an API starting point. It represents a peer to peer network,
 * simply called a group. Each group member can send/receive broadcast
 * as well as personal messages, invite other persons or bots (see {@link WebGroupBotServer}).
 * @example
 * // Create a WebGroup with full mesh topology, autorejoin feature and
 * // specified Signaling and ICE servers for WebRTC.
 *
 * const wg = new WebGroup({
 *   signalingURL: 'wss://mysignaling.com'
 *   iceServers: [
 *     {
 *       urls: 'stun.l.google.com:19302'
 *     },
 *     {
 *       urls: ['turn:myturn.com?transport=udp', 'turn:myturn?transport=tcp'],
 *       username: 'user',
 *       password: 'password'
 *     }
 *   ]
 * })
 *
 * wg.onMemberJoin = (id) => {
 *   // TODO...
 * }
 * wg.onMemberLeave = (id) => {
 *   // TODO...
 * }
 * wg.onMessage = (id, data, isBroadcast) => {
 *   // TODO...
 * }
 * wg.onStateChange = (state) => {
 *   // TODO...
 * }
 * wg.onSignalingStateChange = (state) => {
 *   // TODO...
 * }
 */
export declare class WebGroup {
    id: number;
    myId: number;
    key: string;
    members: number[];
    topology: TopologyEnum;
    state: StateEnum;
    signalingState: SignalingStateEnum;
    signalingURL: string;
    autoRejoin: boolean;
    /**
     * @param {WebGroupOptions} [options]
     * @param {TopologyEnum} [options.topology=TopologyEnum.FULL_MESH]
     * @param {string} [options.signalingURL='wss://www.coedit.re:20473']
     * @param {RTCIceServer[]} [options.iceServers=[{urls: 'stun:stun3.l.google.com:19302'}]]
     * @param {boolean} [options.autoRejoin=true]
     */
    constructor(options?: any);
    /**
     * This handler is called when a message has been received from the group.
     * @type {function(id: number, data: DataType, isBroadcast: boolean)}
     */
    onMessage: (id: number, data: DataType, isBroadcast: boolean) => void;
    /**
     * This handler is called when a new member has joined the group.
     * @type {function(id: number)}
     */
    onMemberJoin: (id: number) => void;
    /**
     * This handler is called when a member hes left the group.
     * @type {function(id: number)}
     */
    onMemberLeave: (id: number) => void;
    /**
     * This handler is called when the group state has changed.
     * @type {function(state: StateEnum)}
     */
    onStateChange: (state: StateEnum) => void;
    /**
     * This handler is called when the signaling state has changed.
     * @type {function(state: SignalingStateEnum)}
     */
    onSignalingStateChange: (state: SignalingStateEnum) => void;
    /**
     * Join the group identified by a key provided by one of the group member.
     * @param {string} key
     */
    join(key: string): void;
    /**
     * Invite a bot server to join this group.
     * @param {string} url - Bot server URL (See {@link WebGroupBotServerOptions})
     */
    invite(url: string): void;
    /**
     * Close the connection with Signaling server.
     */
    closeSignaling(): void;
    /**
     * Leave the group which means close channels with all members and connection
     * with Signaling server.
     */
    leave(): void;
    /**
     * Broadcast a message to the group.
     * @param {DataType} data
     */
    send(data: DataType): void;
    /**
     * Send a message to a particular group member.
     * @param {number}    id Member identifier
     * @param {DataType}  data Message
     */
    sendTo(id: number, data: DataType): void;
    /**
     * Get web group latency
     * @return {Promise<number>} Latency in milliseconds
     */
    ping(): Promise<number>;
}

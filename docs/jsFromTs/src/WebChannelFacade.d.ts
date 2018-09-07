import { TopologyEnum } from './service/topology/Topology';
import { SignalingState } from './Signaling';
import { IWebChannelOptions as WebGroupOptions, WebChannel } from './WebChannel';
/**
 * Is a helper type representing types that can be sent/received over a web group.
 * @typedef {string|Uint8Array} DataType
 */
/**
 * @ignore
 */
export declare const wcs: WeakMap<WebGroup, WebChannel>;
export { WebGroupOptions };
export declare type DataType = string | Uint8Array;
/**
 * This class is an API starting point. It represents a peer to peer network,
 * simply called a group. Each group member can send/receive broadcast
 * as well as personal messages, invite other persons or bots (see {@link Bot}).
 * @example
 * // Create a WebGroup with full mesh topology, autorejoin feature and
 * // specified Signaling and ICE servers for WebRTC.
 *
 * const wg = new WebGroup({
 *   signalingServer: 'wss://mysignaling.com',
 *   rtcConfiguration: {
 *     iceServers: [
 *       {
 *         urls: 'stun.l.google.com:19302'
 *       },
 *       {
 *         urls: ['turn:myturn.com?transport=udp', 'turn:myturn?transport=tcp'],
 *         username: 'user',
 *         password: 'password'
 *       }
 *     ]
 *   }
 * })
 *
 * wg.onMemberJoin = (id) => {
 *   // YOUR CODE...
 * }
 * wg.onMemberLeave = (id) => {
 *   // YOUR CODE...
 * }
 * wg.onMessage = (id, data) => {
 *   // YOUR CODE...
 * }
 * wg.onStateChange = (state) => {
 *   // YOUR CODE...
 * }
 * wg.onSignalingStateChange = (state) => {
 *   // YOUR CODE...
 * }
 */
export declare class WebGroup {
    id: number;
    myId: number;
    key: string;
    members: number[];
    neighbors: number[];
    topology: TopologyEnum;
    state: number;
    signalingState: SignalingState;
    signalingServer: string;
    autoRejoin: boolean;
    onMessage: ((id: number, data: DataType) => void) | undefined | null;
    onMyId: ((id: number) => void) | undefined | null;
    onMemberJoin: ((id: number) => void) | undefined | null;
    onMemberLeave: ((id: number) => void) | undefined | null;
    onStateChange: ((state: number) => void) | undefined | null;
    onSignalingStateChange: ((state: SignalingState) => void) | undefined | null;
    /**
     * @param {WebGroupOptions} [options]
     * @param {Topology} [options.topology=Topology.FULL_MESH]
     * @param {string} [options.signalingServer='wss://signaling.netflux.coedit.re']
     * @param {RTCConfiguration} [options.rtcConfiguration={iceServers: [{urls: 'stun:stun3.l.google.com:19302'}]}]
     * @param {boolean} [options.autoRejoin=true]
     */
    constructor(options?: WebGroupOptions);
    /**
     * Join the group identified by a key provided by one of the group member.
     * If the current {@link WebGroup#state} value is not {@link WebGroupState#LEFT} or
     * {@link WebGroup#signalingState} value is not {@link SignalingState.CLOSED},
     * then do nothing.
     * @param {string} [key] Will be generated if not provided
     */
    join(key?: string): void;
    /**
     * Invite a bot server to join this group.
     * @param {string} url - Bot server URL (See {@link BotOptions})
     */
    invite(url: string): void;
    /**
     * Leave the group which means close channels with all members and connection
     * with the Signaling server.
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
}

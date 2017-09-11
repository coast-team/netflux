import { WebChannel } from './service/WebChannel';
/**
 * @ignore
 */
export const wcs = new WeakMap();
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
 * wg.onPeerJoin = (id) => {
 *   // TODO...
 * }
 * wg.onPeerLeave = (id) => {
 *   // TODO...
 * }
 * wg.onMessage = (id, msg, isBroadcast) => {
 *   // TODO...
 * }
 * wg.onStateChanged = (state) => {
 *   // TODO...
 * }
 * wg.onSignalingStateChanged = (state) => {
 *   // TODO...
 * }
 */
export class WebGroup {
    /**
     * @param {WebGroupOptions} [options]
     * @param {Topology} [options.topology=Topology.FULL_MESH]
     * @param {string} [options.signalingURL='wss://www.coedit.re:20473']
     * @param {RTCIceServer[]} [options.iceServers=[{urls: 'stun:stun3.l.google.com:19302'}]]
     * @param {boolean} [options.autoRejoin=true]
     */
    constructor(options = {}) {
        wcs.set(this, new WebChannel(options));
    }
    /**
     * {@link WebGroup} identifier. The same value for all members.
     * @type {number}
     */
    get id() { return wcs.get(this).id; }
    /**
     * Your unique member identifier in the group.
     * @type {number}
     */
    get myId() { return wcs.get(this).myId; }
    /**
     * An array of member identifiers (except yours).
     * @type {number[]}
     */
    get members() { return wcs.get(this).members; }
    /**
     * Topology identifier.
     * @type {Topology}
     */
    get topology() { return wcs.get(this).topology; }
    /**
     * The state of the {@link WebGroup} connection.
     * @type {WebGroupState}
     */
    get state() { return wcs.get(this).state; }
    /**
     * The state of the signaling server.
     * @type {SignalingState}
     */
    get signalingState() { return wcs.get(this).signaling.state; }
    /**
     * The signaling server URL.
     * @type {string}
     */
    get signalingURL() { return wcs.get(this).signaling.url; }
    /**
     * If equals to true, auto rejoin feature is enabled.
     * @type {boolean}
     */
    get autoRejoin() { return wcs.get(this).autoRejoin; }
    /**
     * Enable/Desable the auto rejoin feature.
     * @type {boolean}
     */
    set autoRejoin(value) { wcs.get(this).autoRejoin = value; }
    /**
     * This handler is called when a message has been received from the group.
     * @type {function(id: number, msg: DataTypeView, isBroadcast: boolean)}
     */
    set onMessage(handler) { wcs.get(this).onMessage = handler; }
    /**
     * This handler is called when a new member has joined the group.
     * @type {function(id: number)}
     */
    set onPeerJoin(handler) { wcs.get(this).onPeerJoin = handler; }
    /**
     * This handler is called when a member hes left the group.
     * @type {function(id: number)}
     */
    set onPeerLeave(handler) { wcs.get(this).onPeerLeave = handler; }
    /**
     * This handler is called when the group state has changed.
     * @type {function(state: WebGroupState)}
     */
    set onStateChanged(handler) { wcs.get(this).onStateChanged = handler; }
    /**
     * This handler is called when the signaling state has changed.
     * @type {function(state: SignalingState)}
     */
    set onSignalingStateChanged(handler) { wcs.get(this).onSignalingStateChanged = handler; }
    /**
     * Join the group identified by a key provided by one of the group member.
     * @param {string} key
     */
    join(key) { return wcs.get(this).join(key); }
    /**
     * Invite a bot server to join this group.
     * @param {string} url - Bot server URL (See {@link WebGroupBotServerOptions})
     */
    invite(url) { return wcs.get(this).invite(url); }
    /**
     * Close the connection with Signaling server.
     */
    closeSignaling() { return wcs.get(this).closeSignaling(); }
    /**
     * Leave the group which means close channels with all members and connection
     * with Signaling server.
     */
    leave() { return wcs.get(this).leave(); }
    /**
     * Broadcast a message to the group.
     * @param {DataTypeView} data
     */
    send(data) { return wcs.get(this).send(data); }
    /**
     * Send a message to a particular group member.
     * @param {number}    id Member identifier
     * @param {DataTypeView}  data Message
     */
    sendTo(id, data) { return wcs.get(this).sendTo(id, data); }
    /**
     * Get web group latency
     * @return {Promise<number>} Latency in milliseconds
     */
    ping() { return wcs.get(this).ping(); }
}

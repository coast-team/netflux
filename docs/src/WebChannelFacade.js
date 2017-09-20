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
 * wg.onMemberJoin = (id) => {
 *   // TODO...
 * }
 * wg.onMemberLeave = (id) => {
 *   // TODO...
 * }
 * wg.onMessage = (id, msg, isBroadcast) => {
 *   // TODO...
 * }
 * wg.onStateChange = (state) => {
 *   // TODO...
 * }
 * wg.onSignalingStateChange = (state) => {
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
        const wc = new WebChannel(options);
        wcs.set(this, wc);
        /**
         * {@link WebGroup} identifier. The same value for all members.
         * @type {number}
         */
        this.id = undefined;
        Reflect.defineProperty(this, 'id', { enumerable: true, get: () => wc.id });
        /**
         * Your unique member identifier in the group.
         * @type {number}
         */
        this.myId = undefined;
        Reflect.defineProperty(this, 'myId', { enumerable: true, get: () => wc.myId });
        /**
         * Group session identifier. Equals to an empty string before calling {@link WebGroup#join}.
         * Different to {@link WebGroup#id}. This key is known and used by Signaling server
         * in order to join new members, on the other hand Signaling does not know {@link WebGroup#id}.
         * @type {string}
         */
        this.key = undefined;
        Reflect.defineProperty(this, 'key', { enumerable: true, get: () => wc.key });
        /**
         * An array of member identifiers (except yours).
         * @type {number[]}
         */
        this.members = undefined;
        Reflect.defineProperty(this, 'members', { enumerable: true, get: () => wc.members });
        /**
         * Topology identifier.
         * @type {Topology}
         */
        this.topology = undefined;
        Reflect.defineProperty(this, 'topology', { enumerable: true, get: () => wc.topology });
        /**
         * The state of the {@link WebGroup} connection.
         * @type {WebGroupState}
         */
        this.state = undefined;
        Reflect.defineProperty(this, 'state', { enumerable: true, get: () => wc.state });
        /**
         * The state of the signaling server.
         * @type {SignalingState}
         */
        this.signalingState = undefined;
        Reflect.defineProperty(this, 'signalingState', { enumerable: true, get: () => wc.signaling.state });
        /**
         * The signaling server URL.
         * @type {string}
         */
        this.signalingURL = undefined;
        Reflect.defineProperty(this, 'signalingURL', { enumerable: true, get: () => wc.signaling.url });
        /**
         * Enable/Desable the auto rejoin feature.
         * @type {boolean}
         */
        this.autoRejoin = undefined;
        Reflect.defineProperty(this, 'autoRejoin', {
            enumerable: true,
            get: () => wc.signaling.url,
            set: (value) => wc.autoRejoin = true
        });
    }
    /**
     * This handler is called when a message has been received from the group.
     * @type {function(id: number, msg: DataTypeView, isBroadcast: boolean)}
     */
    set onMessage(handler) { wcs.get(this).onMessage = handler; }
    /**
     * This handler is called when a new member has joined the group.
     * @type {function(id: number)}
     */
    set onMemberJoin(handler) { wcs.get(this).onMemberJoin = handler; }
    /**
     * This handler is called when a member hes left the group.
     * @type {function(id: number)}
     */
    set onMemberLeave(handler) { wcs.get(this).onMemberLeave = handler; }
    /**
     * This handler is called when the group state has changed.
     * @type {function(state: WebGroupState)}
     */
    set onStateChange(handler) { wcs.get(this).onStateChange = handler; }
    /**
     * This handler is called when the signaling state has changed.
     * @type {function(state: SignalingState)}
     */
    set onSignalingStateChange(handler) { wcs.get(this).onSignalingStateChange = handler; }
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

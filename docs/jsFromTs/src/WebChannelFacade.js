import { WebChannel } from './WebChannel';
/**
 * Is a helper type representing types that can be sent/received over a web group.
 * @typedef {string|Uint8Array} DataType
 */
/**
 * @ignore
 */
export const wcs = new WeakMap();
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
export class WebGroup {
    /**
     * @param {WebGroupOptions} [options]
     * @param {Topology} [options.topology=Topology.FULL_MESH]
     * @param {string} [options.signalingServer='wss://signaling.netflux.coedit.re']
     * @param {RTCConfiguration} [options.rtcConfiguration={iceServers: [{urls: 'stun:stun3.l.google.com:19302'}]}]
     * @param {boolean} [options.autoRejoin=true]
     */
    constructor(options = {}) {
        const wc = new WebChannel(options);
        wcs.set(this, wc);
        /**
         * The read-only {@link WebGroup} identifier. The same value for all members.
         * @type {number}
         */
        this.id = undefined;
        Reflect.defineProperty(this, 'id', { configurable: false, enumerable: true, get: () => wc.id });
        /**
         * The read-only your unique member identifier in the group.
         * @type {number}
         */
        this.myId = undefined;
        Reflect.defineProperty(this, 'myId', {
            configurable: false,
            enumerable: true,
            get: () => wc.myId,
        });
        /**
         * The read-only group session identifier. Equals to an empty string before calling {@link WebGroup#join}.
         * Different to {@link WebGroup#id}. This key is known and used by Signaling server
         * in order to join new members, on the other hand Signaling does not know {@link WebGroup#id}.
         * @type {string}
         */
        this.key = undefined;
        Reflect.defineProperty(this, 'key', {
            configurable: false,
            enumerable: true,
            get: () => wc.key,
        });
        /**
         * The read-only array of all members including yourself (i.e. {@link WebGroup#myId})
         * @type {number[]}
         */
        this.members = undefined;
        Reflect.defineProperty(this, 'members', {
            configurable: false,
            enumerable: true,
            get: () => wc.members,
        });
        /**
         * The read-only property which is an enum of type {@link Topology}
         * indicating the topology used for this {@link WebGroup} instance.
         * @type {Topology}
         */
        this.topology = undefined;
        Reflect.defineProperty(this, 'topology', {
            configurable: false,
            enumerable: true,
            get: () => wc.topologyEnum,
        });
        /**
         * The read-only state of the {@link WebGroup} connection.
         * @type {WebGroupState}
         */
        this.state = undefined;
        Reflect.defineProperty(this, 'state', {
            configurable: false,
            enumerable: true,
            get: () => wc.state,
        });
        /**
         * The read-only state of the signaling server.
         * @type {SignalingState}
         */
        this.signalingState = undefined;
        Reflect.defineProperty(this, 'signalingState', {
            configurable: false,
            enumerable: true,
            get: () => wc.signaling.state,
        });
        /**
         * The read-only signaling server URL.
         * @type {string}
         */
        this.signalingServer = undefined;
        Reflect.defineProperty(this, 'signalingServer', {
            configurable: false,
            enumerable: true,
            get: () => wc.signaling.url,
        });
        /**
         * Enable/Desable the auto rejoin feature.
         * @type {boolean}
         */
        this.autoRejoin = undefined;
        Reflect.defineProperty(this, 'autoRejoin', {
            configurable: false,
            enumerable: true,
            get: () => wc.autoRejoin,
            set: (value) => (wc.autoRejoin = value),
        });
        /**
         * This handler is called when a message has been received from the group.
         * `id` is an identifier of the member who sent this message.
         * and false if sent via {@link WebGroup#sendTo}.
         * @type {function(id: number, data: DataType)}
         */
        this.onMessage = undefined;
        Reflect.defineProperty(this, 'onMessage', {
            configurable: true,
            enumerable: true,
            get: () => (wc.onMessage.name === 'none' ? undefined : wc.onMessage),
            set: (handler) => {
                if (typeof handler !== 'function') {
                    wc.onMessage = function none() { };
                }
                else {
                    wc.onMessage = handler;
                }
            },
        });
        /**
         * This handler is called when a new member with `id` as identifier has joined the group.
         * @type {function(id: number)}
         */
        this.onMemberJoin = undefined;
        Reflect.defineProperty(this, 'onMemberJoin', {
            configurable: true,
            enumerable: true,
            get: () => (wc.onMemberJoin.name === 'none' ? undefined : wc.onMemberJoin),
            set: (handler) => {
                if (typeof handler !== 'function') {
                    wc.onMemberJoin = function none() { };
                }
                else {
                    wc.onMemberJoin = handler;
                }
            },
        });
        /**
         * This handler is called when a member with `id` as identifier hes left the group.
         * @type {function(id: number)}
         */
        this.onMemberLeave = undefined;
        Reflect.defineProperty(this, 'onMemberLeave', {
            configurable: true,
            enumerable: true,
            get: () => (wc.onMemberLeave.name === 'none' ? undefined : wc.onMemberLeave),
            set: (handler) => {
                if (typeof handler !== 'function') {
                    wc.onMemberLeave = function none() { };
                }
                else {
                    wc.onMemberLeave = handler;
                }
            },
        });
        /**
         * This handler is called when the group state has changed.
         * @type {function(state: WebGroupState)}
         */
        this.onStateChange = undefined;
        Reflect.defineProperty(this, 'onStateChange', {
            configurable: true,
            enumerable: true,
            get: () => (wc.onStateChange.name === 'none' ? undefined : wc.onStateChange),
            set: (handler) => {
                if (typeof handler !== 'function') {
                    wc.onStateChange = function none() { };
                }
                else {
                    wc.onStateChange = handler;
                }
            },
        });
        /**
         * This handler is called when the signaling state has changed.
         * @type {function(state: SignalingState)}
         */
        this.onSignalingStateChange = undefined;
        Reflect.defineProperty(this, 'onSignalingStateChange', {
            configurable: true,
            enumerable: true,
            get: () => wc.onSignalingStateChange.name === 'none' ? undefined : wc.onSignalingStateChange,
            set: (handler) => {
                if (typeof handler !== 'function') {
                    wc.onSignalingStateChange = function none() { };
                }
                else {
                    wc.onSignalingStateChange = handler;
                }
            },
        });
    }
    /**
     * Join the group identified by a key provided by one of the group member.
     * If the current {@link WebGroup#state} value is not {@link WebGroupState#LEFT} or
     * {@link WebGroup#signalingState} value is not {@link SignalingState.CLOSED},
     * then do nothing.
     * @param {string} [key] Will be generated if not provided
     */
    join(key) {
        const wc = wcs.get(this);
        if (wc) {
            return wc.join(key);
        }
        throw new Error('WebChannel is undefined');
    }
    /**
     * Invite a bot server to join this group.
     * @param {string} url - Bot server URL (See {@link BotOptions})
     */
    invite(url) {
        const wc = wcs.get(this);
        if (wc) {
            return wc.invite(url);
        }
        throw new Error('WebChannel is undefined');
    }
    /**
     * Leave the group which means close channels with all members and connection
     * with the Signaling server.
     */
    leave() {
        const wc = wcs.get(this);
        if (wc) {
            return wc.leave();
        }
        throw new Error('WebChannel is undefined');
    }
    /**
     * Broadcast a message to the group.
     * @param {DataType} data
     */
    send(data) {
        const wc = wcs.get(this);
        if (wc) {
            return wc.send(data);
        }
        throw new Error('WebChannel is undefined');
    }
    /**
     * Send a message to a particular group member.
     * @param {number}    id Member identifier
     * @param {DataType}  data Message
     */
    sendTo(id, data) {
        const wc = wcs.get(this);
        if (wc) {
            return wc.sendTo(id, data);
        }
        throw new Error('WebChannel is undefined');
    }
}

import { TopologyEnum } from './service/topology/Topology'
import { SignalingState } from './Signaling'
import { IWebChannelOptions as WebGroupOptions, WebChannel } from './WebChannel'
import { WebChannelState } from './WebChannelState'

/**
 * Is a helper type representing types that can be sent/received over a web group.
 * @typedef {string|Uint8Array} DataType
 */

/**
 * @ignore
 */
export const wcs: WeakMap<WebGroup, WebChannel> = new WeakMap()

export { WebGroupOptions }

export type DataType = string | Uint8Array

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
  public id: number
  public myId: number
  public key: string
  public members: number[]
  public neighbors: number[]
  public topology: TopologyEnum
  public state: number
  public signalingState: SignalingState
  public signalingServer: string
  public autoRejoin: boolean
  public onMessage: ((id: number, data: DataType) => void) | undefined | null
  public onMyId: ((id: number) => void) | undefined | null
  public onMemberJoin: ((id: number) => void) | undefined | null
  public onMemberLeave: ((id: number) => void) | undefined | null
  public onStateChange: ((state: number) => void) | undefined | null
  public onSignalingStateChange: ((state: SignalingState) => void) | undefined | null

  /**
   * @param {WebGroupOptions} [options]
   * @param {Topology} [options.topology=Topology.FULL_MESH]
   * @param {string} [options.signalingServer='wss://signaling.netflux.coedit.re']
   * @param {RTCConfiguration} [options.rtcConfiguration={iceServers: [{urls: 'stun:stun3.l.google.com:19302'}]}]
   * @param {boolean} [options.autoRejoin=true]
   */
  constructor(options: WebGroupOptions = {}) {
    const wc = new WebChannel(options)
    wcs.set(this, wc)

    /**
     * The read-only {@link WebGroup} identifier. The same value for all members.
     * @type {number}
     */
    this.id = undefined as any
    Reflect.defineProperty(this, 'id', { configurable: false, enumerable: true, get: () => wc.id })
    /**
     * The read-only your unique member identifier in the group.
     * @type {number}
     */
    this.myId = undefined as any
    Reflect.defineProperty(this, 'myId', {
      configurable: false,
      enumerable: true,
      get: () => wc.myId,
    })
    /**
     * The read-only group session identifier. Equals to an empty string before calling {@link WebGroup#join}.
     * Different to {@link WebGroup#id}. This key is known and used by Signaling server
     * in order to join new members, on the other hand Signaling does not know {@link WebGroup#id}.
     * @type {string}
     */
    this.key = undefined as any
    Reflect.defineProperty(this, 'key', {
      configurable: false,
      enumerable: true,
      get: () => wc.key,
    })
    /**
     * The read-only array of all members including yourself (i.e. {@link WebGroup#myId})
     * @type {number[]}
     */
    this.members = undefined as any
    Reflect.defineProperty(this, 'members', {
      configurable: false,
      enumerable: true,
      get: () => wc.members,
    })
    /**
     * The read-only array of neighbor members (i.e. members who are directly connected to you). Hence they are included in the {@link WebGroup#members} by definition.
     * @type {number[]}
     */
    this.neighbors = undefined as any
    Reflect.defineProperty(this, 'neighbors', {
      configurable: false,
      enumerable: true,
      get: () => wc.topology.neighbors.map((ch) => ch.id),
    })
    /**
     * The read-only property which is an enum of type {@link Topology}
     * indicating the topology used for this {@link WebGroup} instance.
     * @type {Topology}
     */
    this.topology = undefined as any
    Reflect.defineProperty(this, 'topology', {
      configurable: false,
      enumerable: true,
      get: () => wc.topologyEnum,
    })
    /**
     * The read-only state of the {@link WebGroup} connection.
     * @type {WebGroupState}
     */
    this.state = undefined as any
    Reflect.defineProperty(this, 'state', {
      configurable: false,
      enumerable: true,
      get: () => wc.state,
    })
    /**
     * The read-only state of the signaling server.
     * @type {SignalingState}
     */
    this.signalingState = undefined as any
    Reflect.defineProperty(this, 'signalingState', {
      configurable: false,
      enumerable: true,
      get: () => wc.signaling.state,
    })
    /**
     * The read-only signaling server URL.
     * @type {string}
     */
    this.signalingServer = undefined as any
    Reflect.defineProperty(this, 'signalingServer', {
      configurable: false,
      enumerable: true,
      get: () => wc.signaling.url,
    })
    /**
     * Enable/Desable the auto rejoin feature.
     * @type {boolean}
     */
    this.autoRejoin = undefined as any
    Reflect.defineProperty(this, 'autoRejoin', {
      configurable: false,
      enumerable: true,
      get: () => wc.autoRejoin,
      set: (value: boolean) => (wc.autoRejoin = value),
    })
    /**
     * This handler is called when a message has been received from the group.
     * `id` is an identifier of the member who sent this message.
     * @type {function(id: number, data: DataType)}
     */
    this.onMessage = undefined as any
    Reflect.defineProperty(this, 'onMessage', {
      configurable: true,
      enumerable: true,
      get: () => (wc.onMessage.name === 'none' ? undefined : wc.onMessage),
      set: (handler: (id: number, data: DataType) => void) => {
        wc.onMessage = typeof handler !== 'function' ? function none() {} : handler
      },
    })
    /**
     * This handler is called when `myId` is set.
     * @type {function(myId: number)}
     */
    this.onMyId = undefined as any
    Reflect.defineProperty(this, 'onMyId', {
      configurable: true,
      enumerable: true,
      get: () => (wc.onMyId.name === 'none' ? undefined : wc.onMyId),
      set: (handler: (myId: number) => void) => {
        wc.onMyId = typeof handler !== 'function' ? function none() {} : handler
      },
    })
    /**
     * This handler is called when a new member with `id` as identifier has joined the group.
     * @type {function(id: number)}
     */
    this.onMemberJoin = undefined as any
    Reflect.defineProperty(this, 'onMemberJoin', {
      configurable: true,
      enumerable: true,
      get: () => (wc.onMemberJoin.name === 'none' ? undefined : wc.onMemberJoin),
      set: (handler: (id: number) => void) => {
        wc.onMemberJoin = typeof handler !== 'function' ? function none() {} : handler
      },
    })
    /**
     * This handler is called when a member with `id` as identifier hes left the group.
     * @type {function(id: number)}
     */
    this.onMemberLeave = undefined as any
    Reflect.defineProperty(this, 'onMemberLeave', {
      configurable: true,
      enumerable: true,
      get: () => (wc.onMemberLeave.name === 'none' ? undefined : wc.onMemberLeave),
      set: (handler: (id: number) => void) => {
        wc.onMemberLeave = typeof handler !== 'function' ? function none() {} : handler
      },
    })
    /**
     * This handler is called when the group state has changed.
     * @type {function(state: WebGroupState)}
     */
    this.onStateChange = undefined as any
    Reflect.defineProperty(this, 'onStateChange', {
      configurable: true,
      enumerable: true,
      get: () => (wc.onStateChange.name === 'none' ? undefined : wc.onStateChange),
      set: (handler: (state: WebChannelState) => void) => {
        wc.onStateChange = typeof handler !== 'function' ? function none() {} : handler
      },
    })
    /**
     * This handler is called when the signaling state has changed.
     * @type {function(state: SignalingState)}
     */
    this.onSignalingStateChange = undefined as any
    Reflect.defineProperty(this, 'onSignalingStateChange', {
      configurable: true,
      enumerable: true,
      get: () =>
        wc.onSignalingStateChange.name === 'none' ? undefined : wc.onSignalingStateChange,
      set: (handler: (state: SignalingState) => void) => {
        wc.onSignalingStateChange = typeof handler !== 'function' ? function none() {} : handler
      },
    })
  }

  /**
   * Join the group identified by a key provided by one of the group member.
   * If the current {@link WebGroup#state} value is not {@link WebGroupState#LEFT} or
   * {@link WebGroup#signalingState} value is not {@link SignalingState.CLOSED},
   * then do nothing.
   * @param {string} [key] Will be generated if not provided
   */
  join(key?: string): void {
    const wc = wcs.get(this)
    if (wc) {
      return wc.join(key)
    }
    throw new Error('WebChannel is undefined')
  }

  /**
   * Invite a bot server to join this group.
   * @param {string} url - Bot server URL (See {@link BotOptions})
   */
  invite(url: string): void {
    const wc = wcs.get(this)
    if (wc) {
      return wc.invite(url)
    }
    throw new Error('WebChannel is undefined')
  }

  /**
   * Leave the group which means close channels with all members and connection
   * with the Signaling server.
   */
  leave() {
    const wc = wcs.get(this)
    if (wc) {
      return wc.leave()
    }
    throw new Error('WebChannel is undefined')
  }

  /**
   * Broadcast a message to the group.
   * @param {DataType} data
   */
  send(data: DataType): void {
    const wc = wcs.get(this)
    if (wc) {
      return wc.send(data)
    }
    throw new Error('WebChannel is undefined')
  }

  /**
   * Send a message to a particular group member.
   * @param {number}    id Member identifier
   * @param {DataType}  data Message
   */
  sendTo(id: number, data: DataType): void {
    const wc = wcs.get(this)
    if (wc) {
      return wc.sendTo(id, data)
    }
    throw new Error('WebChannel is undefined')
  }
}

import { WebChannel, Options as WebGroupOptions, StateEnum, defaultOptions } from './service/WebChannel'
import { TopologyEnum } from './service/topology/Topology'
import { SignalingStateEnum } from './Signaling'

/**
 * @ignore
 */
export const wcs: WeakMap<WebGroup, WebChannel> = new WeakMap()

export type DataType = string|Uint8Array

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
export class WebGroup {

  public id: number
  public myId: number
  public key: string
  public members: number[]
  public topology: TopologyEnum
  public state: StateEnum
  public signalingState: SignalingStateEnum
  public signalingURL: string
  public autoRejoin: boolean

  /**
   * @param {WebGroupOptions} [options]
   * @param {TopologyEnum} [options.topology=TopologyEnum.FULL_MESH]
   * @param {string} [options.signalingURL='wss://www.coedit.re:20473']
   * @param {RTCIceServer[]} [options.iceServers=[{urls: 'stun:stun3.l.google.com:19302'}]]
   * @param {boolean} [options.autoRejoin=true]
   */
  constructor (options: any = {}) {
    const wc = new WebChannel(options)
    wcs.set(this, wc)

    /**
     * {@link WebGroup} identifier. The same value for all members.
     * @type {number}
     */
    this.id = undefined
    Reflect.defineProperty(this, 'id', { configurable: false, enumerable: true, get: () => wc.id })
    /**
     * Your unique member identifier in the group.
     * @type {number}
     */
    this.myId = undefined
    Reflect.defineProperty(this, 'myId', { configurable: false, enumerable: true, get: () => wc.myId })
    /**
     * Group session identifier. Equals to an empty string before calling {@link WebGroup#join}.
     * Different to {@link WebGroup#id}. This key is known and used by Signaling server
     * in order to join new members, on the other hand Signaling does not know {@link WebGroup#id}.
     * @type {string}
     */
    this.key = undefined
    Reflect.defineProperty(this, 'key', { configurable: false, enumerable: true, get: () => wc.key })
    /**
     * An array of member identifiers (except yours).
     * @type {number[]}
     */
    this.members = undefined
    Reflect.defineProperty(this, 'members', { configurable: false, enumerable: true, get: () => wc.members })
    /**
     * The read-only property which is an enum of type {@link TopologyEnum}
     * indicating the topology used for this {@link WebGroup} instance.
     * @type {TopologyEnum}
     */
    this.topology = undefined
    Reflect.defineProperty(this, 'topology', { configurable: false, enumerable: true, get: () => wc.topology })
    /**
     * The state of the {@link WebGroup} connection.
     * @type {StateEnum}
     */
    this.state = undefined
    Reflect.defineProperty(this, 'state', { configurable: false, enumerable: true, get: () => wc.state })
    /**
     * The state of the signaling server.
     * @type {SignalingStateEnum}
     */
    this.signalingState = undefined
    Reflect.defineProperty(this, 'signalingState', { configurable: false, enumerable: true, get: () => wc.signaling.state })
    /**
     * The signaling server URL.
     * @type {string}
     */
    this.signalingURL = undefined
    Reflect.defineProperty(this, 'signalingURL', { configurable: false, enumerable: true, get: () => wc.signaling.url })
    /**
     * Enable/Desable the auto rejoin feature.
     * @type {boolean}
     */
    this.autoRejoin = undefined
    Reflect.defineProperty(this, 'autoRejoin', {
      configurable: false,
      enumerable: true,
      get: () => wc.signaling.url,
      set: (value: boolean) => wc.autoRejoin = true
    })
  }

  /**
   * This handler is called when a message has been received from the group.
   * @type {function(id: number, data: DataType, isBroadcast: boolean)}
   */
  set onMessage (handler: (id: number, data: DataType, isBroadcast: boolean) => void) { wcs.get(this).onMessage = handler }

  /**
   * This handler is called when a new member has joined the group.
   * @type {function(id: number)}
   */
  set onMemberJoin (handler: (id: number) => void) { wcs.get(this).onMemberJoin = handler }

  /**
   * This handler is called when a member hes left the group.
   * @type {function(id: number)}
   */
  set onMemberLeave (handler: (id: number) => void) { wcs.get(this).onMemberLeave = handler }

  /**
   * This handler is called when the group state has changed.
   * @type {function(state: StateEnum)}
   */
  set onStateChange (handler: (state: StateEnum) => void) { wcs.get(this).onStateChange = handler }

  /**
   * This handler is called when the signaling state has changed.
   * @type {function(state: SignalingStateEnum)}
   */
  set onSignalingStateChange (handler: (state: SignalingStateEnum) => void) { wcs.get(this).onSignalingStateChange = handler }

  /**
   * Join the group identified by a key provided by one of the group member.
   * @param {string} key
   */
  join (key: string): void { return wcs.get(this).join(key) }

  /**
   * Invite a bot server to join this group.
   * @param {string} url - Bot server URL (See {@link WebGroupBotServerOptions})
   */
  invite (url: string): void { return wcs.get(this).invite(url) }

  /**
   * Close the connection with Signaling server.
   */
  closeSignaling (): void { return wcs.get(this).closeSignaling() }

  /**
   * Leave the group which means close channels with all members and connection
   * with Signaling server.
   */
  leave () { return wcs.get(this).leave() }

  /**
   * Broadcast a message to the group.
   * @param {DataType} data
   */
  send (data: DataType): void { return wcs.get(this).send(data) }

  /**
   * Send a message to a particular group member.
   * @param {number}    id Member identifier
   * @param {DataType}  data Message
   */
  sendTo (id: number, data: DataType): void { return wcs.get(this).sendTo(id, data) }

  /**
   * Get web group latency
   * @return {Promise<number>} Latency in milliseconds
   */
  ping (): Promise<number> { return wcs.get(this).ping() }
}

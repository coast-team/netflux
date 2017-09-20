import './misc/polyfills'
import { SignalingState as SigState } from './Signaling'
import { TopologyEnum } from './service/topology/Topology'

export { WebGroup, WebGroupOptions, WebGroupState, DataType } from './WebChannelFacade'

// #if NODE
export { WebGroupBotServer, WebGroupBotServerOptions } from './BotServerFacade'
// #endif

/**
 * The state enum of the signaling server for WebRTC.
 */
export class SignalingState {
  /**
   * The connection is not yet open.
   * @type {number}
   */
  static get CONNECTING (): number { return SigState.CONNECTING }

  /**
   * Equals to `'CONNECTING'`.
   * @type {string}
   */
  static get [SignalingState.CONNECTING] (): string { return SigState[SigState.CONNECTING] }

  /**
   * The connection is open and ready to communicate.
   * @type {number}
   */
  static get OPEN (): number { return SigState.OPEN }

  /**
   * Equals to `'OPEN'`.
   * @type {string}
   */
  static get [SignalingState.OPEN] (): string { return SigState[SigState.OPEN] }

  /**
   * `RTCDataChannel` has been established with one of the group member.
   * From now the signaling is no longer needed, because the joining process
   * will continue with a help of this member.
   * @type {number}
   */
  static get FIRST_CONNECTED (): number { return SigState.FIRST_CONNECTED }

  /**
   * Equals to `'FIRST_CONNECTED'`.
   * @type {string}
   */
  static get [SignalingState.FIRST_CONNECTED] (): string { return SigState[SigState.FIRST_CONNECTED] }

  /**
   * You has successfully been joined a web group and ready to help join others.
   * @type {number}
   */
  static get READY_TO_JOIN_OTHERS (): number { return SigState.READY_TO_JOIN_OTHERS }

  /**
   * Equals to `'READY_TO_JOIN_OTHERS'`.
   * @type {string}
   */
  static get [SignalingState.READY_TO_JOIN_OTHERS] (): string { return SigState[SigState.READY_TO_JOIN_OTHERS] }

  /**
   * The connection is closed.
   * @type {number}
   */
  static get CLOSED (): number { return SigState.CLOSED }

  /**
   * Equals to `'CLOSED'`.
   * @type {string}
   */
  static get [SignalingState.CLOSED] (): string { return SigState[SigState.CLOSED] }
}


/**
 * The topology enum.
 */
export class Topology {
  /**
   * Full mesh topology identifier.
   * @type {number}
   */
  static get FULL_MESH (): number { return TopologyEnum.FULL_MESH }

  /**
   * Equals to `'FULL_MESH'`.
   * @type {string}
   */
  static get [Topology.FULL_MESH] (): string { return TopologyEnum[TopologyEnum.FULL_MESH] }
}

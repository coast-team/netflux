import './misc/polyfills.browser'
import { SignalingState as SigState } from './Signaling'
import { TopologyEnum } from './service/topology/Topology'

export { WebGroup, WebGroupOptions, WebGroupState, DataType } from './WebChannelFacade'

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

/**
 * The options to be passed into {@link WebGroup} constructor.
 * @typedef {Object} WebGroupOptions
 * @property {Topology} [topology] Topology identifier
 * (Full mesh is the only one supported by Netflux for now).
 * @property {string} [signalingURL] Signaling URL for WebRTC.
 * @property {RTCIceServer[]} [iceServers] Array of Ice servers for WebRTC.
 * @property {boolean} [autoRejoin] Whether to automatically rejoin the web group
 * on disconnect or not. Its value may be modified after {@link WebGroup}
 * instantiation at any time.
 */

/**
 * The options to be passed into {@link WebGroupBotServer} constructor.
 * @typedef {Object} WebGroupBotServerOptions
 * @property {Topology} [topology] See WebGroupOptions.topology
 * @property {string} [signalingURL] See WebGroupOptions.signalingURL
 * @property {RTCIceServer[]} [iceServers] See WebGroupOptions.iceServers
 * @property {boolean} [autoRejoin] See WebGroupOptions.autoRejoin
 * @property {Object} bot Server related options of the bot.
 * @property {NodeJSHttpServer|NodeJSHttpsServer} bot.server NodeJS http(s) server.
 * @property {string} [bot.url] Bot server URL.
 * @property {boolean} [bot.perMessageDeflate] Enable/disable permessage-deflate.
 */

 /**
  * @external {RTCIceServer} https://developer.mozilla.org/en/docs/Web/API/RTCIceServer
  */

 /**
  * @external {Uint8Array} https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
  */

 /**
  * @external {NodeJSHttpServer} https://nodejs.org/api/http.html#http_class_http_server
  */

 /**
  * @external {NodeJSHttpsServer} https://nodejs.org/api/https.html#https_class_https_server
  */

import { TopologyEnum } from './service/topology/Topology'
import { SignalingState as SigState } from './Signaling'

export { WebGroup, WebGroupOptions, WebGroupState, DataType } from './WebChannelFacade'
import { enableLog as debug } from './misc/Util'

/**
 * Enable/Disable console logs. By default the logs are disabled. If enabled
 * 'info' level shows WebGroup and signaling states, connection establishment, disconnection etc.
 * 'debug' level shows all that 'info' level shows plus much more other information for debugging.
 * @param {boolean} value
 * @param {string} [level='info'] Console log level: 'debug' or 'info'
 */
export function enableLog (value: boolean, level?: string) { debug(value, level) }

/**
 * The state enum of the signaling server for WebRTC.
 */
export class SignalingState {
  /**
   * Equals to `0`, the connection is not yet open. Value
   * @type {number}
   */
  static get CONNECTING (): number { return SigState.CONNECTING }

  /**
   * Equals to `'CONNECTING'`.
   * @type {string}
   */
  static get [SignalingState.CONNECTING] (): string { return SigState[SigState.CONNECTING] }

  /**
   * Equals to `1`, `RTCDataChannel` has been established with one of the group member.
   * From now the signaling is no longer needed, because the joining process
   * will continue with a help of this member.
   * @type {number}
   */
  static get CONNECTED (): number { return SigState.CONNECTED }

  /**
   * Equals to `'CONNECTED'`.
   * @type {string}
   */
  static get [SignalingState.CONNECTED] (): string {
    return SigState[SigState.CONNECTED]
  }

  /**
   * Equals to `2`, you has successfully joined a web group and ready to help join others.
   * @type {number}
   */
  static get STABLE (): number { return SigState.STABLE }

  /**
   * Equals to `'STABLE'`.
   * @type {string}
   */
  static get [SignalingState.STABLE] (): string { return SigState[SigState.STABLE] }

  /**
   * Equals to `3`, the connection is closed.
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
 * @property {string} [signalingServer] Signaling URL for WebRTC.
 * @property {RTCConfiguration} [rtcConfiguration] Configuration for WebRTC.
 * @property {boolean} [autoRejoin] Whether to automatically rejoin the web group
 * on disconnect or not. Its value may be modified after {@link WebGroup}
 * instantiation at any time.
 */

/**
 * The options to be passed into {@link WebGroupBotServer} constructor.
 * @typedef {Object} WebGroupBotServerOptions
 * @property {Topology} [topology] See WebGroupOptions.topology
 * @property {string} [signalingServer] See WebGroupOptions.signalingServer
 * @property {RTCConfiguration} [rtcConfiguration] See WebGroupOptions.rtcConfiguration
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

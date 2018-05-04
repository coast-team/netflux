import { LogLevel as Logs, setLogLevel as setLogs } from './misc/util'
import { TopologyEnum } from './service/topology/Topology'
import { SignalingState as SigState } from './Signaling'
import { WebChannelState } from './WebChannelState'

export { WebGroup, WebGroupOptions, DataType } from './WebChannelFacade'

/**
 * Set log level for debugging utility. By default all logs are disabled.
 * @param {...LogLevel} levels
 */
export function setLogLevel(...levels: Logs[]) {
  setLogs(levels)
}

/**
 * The state enum of the signaling server.
 */
export class SignalingState {
  /**
   * `0`: the connection is not yet open (equivalent to `WebSocket.CONNECTING`).
   * @type {number}
   */
  static get CONNECTING(): number {
    return SigState.CONNECTING
  }

  /**
   * `1`: the connection is open and ready to communicate (equivalent to `WebSocket.OPEN`).
   * @type {number}
   */
  static get OPEN(): number {
    return SigState.OPEN
  }

  /**
   * `2`: the connection is in the process of closing (equivalent to `WebSocket.CLOSING`).
   * @type {number}
   */
  static get CLOSING(): number {
    return SigState.CLOSING
  }

  /**
   * `3`: the connection is closed or couldn't be opened (equivalent to `WebSocket.CLOSED`).
   * @type {number}
   */
  static get CLOSED(): number {
    return SigState.CLOSED
  }

  /**
   * `4`: signaling server is checking wether you are still connected to the group. If it is not the case, then
   * subscribs you to one of the group member in order to create a connection with him.
   * @type {number}
   */
  static get CHECKING(): number {
    return SigState.CHECKING
  }

  /**
   * `5`: a connection has been established with one of the group member or you are the only member of the group.
   * From now the signaling is no longer needed, because the joining process will continue with a help of this member.
   * @type {number}
   */
  static get CHECKED(): number {
    return SigState.CHECKED
  }
}

/**
 * The state enum of {@link WebGroup}.
 */
export class WebGroupState {
  /**
   * `0`: you haven't joined the group yet.
   * @type {number}
   */
  static get JOINING(): number {
    return WebChannelState.JOINING
  }

  /**
   * `1`: you have sussessfully joined the group and ready to communicate.
   * @type {number}
   */
  static get JOINED(): number {
    return WebChannelState.JOINED
  }

  /**
   * `2`: you are about to leave the group.
   * @type {number}
   */
  static get LEAVING(): number {
    return WebChannelState.LEAVING
  }

  /**
   * `3`: you have sussessfully left the group.
   * @type {number}
   */
  static get LEFT(): number {
    return WebChannelState.LEFT
  }
}

/**
 * The topology enum. More topologies will be added in the future
 */
export class Topology {
  /**
   * Full mesh topology identifier.
   * @type {number}
   */
  static get FULL_MESH(): number {
    return TopologyEnum.FULL_MESH
  }
}

/**
 * The log level enum for debugging purposes.
 */
export class LogLevel {
  /**
   * Equals to `1`, allows logs for debug.
   * @type {number}
   */
  static get DEBUG(): number {
    return Logs.DEBUG
  }

  /**
   * Equals to `2`, logs for WebGroup module.
   * @type {number}
   */
  static get WEB_GROUP(): number {
    return Logs.WEB_GROUP
  }

  /**
   * Equals to `3`, logs for DataChannelBuilder module.
   * @type {number}
   */
  static get WEBRTC(): number {
    return Logs.WEBRTC
  }

  /**
   * Equals to `4`, logs for Channel module.
   * @type {number}
   */
  static get CHANNEL(): number {
    return Logs.CHANNEL
  }

  /**
   * Equals to `5`, logs for Topology module.
   * @type {number}
   */
  static get TOPOLOGY(): number {
    return Logs.TOPOLOGY
  }

  /**
   * Equals to `6`, logs for Signaling module.
   * @type {number}
   */
  static get SIGNALING(): number {
    return Logs.SIGNALING
  }

  /**
   * Equals to `7`, logs for ChannelBuilder module.
   * @type {number}
   */
  static get CHANNEL_BUILDER(): number {
    return Logs.CHANNEL_BUILDER
  }
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
 * @external {RTCConfiguration} https://developer.mozilla.org/en/docs/Web/API/RTCConfiguration
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

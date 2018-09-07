import { LogLevel as Logs } from './misc/util';
export { WebGroup, WebGroupOptions, DataType } from './WebChannelFacade';
/**
 * Set log level for debugging utility. By default all logs are disabled.
 * @param {...LogLevel} levels
 */
export declare function setLogLevel(...levels: Logs[]): void;
/**
 * The state enum of the signaling server.
 */
export declare class SignalingState {
    /**
     * `0`: the connection is not yet open (equivalent to `WebSocket.CONNECTING`).
     * @type {number}
     */
    static readonly CONNECTING: number;
    /**
     * `1`: the connection is open and ready to communicate (equivalent to `WebSocket.OPEN`).
     * @type {number}
     */
    static readonly OPEN: number;
    /**
     * `3`: the connection is closed or couldn't be opened (equivalent to `WebSocket.CLOSED`).
     * @type {number}
     */
    static readonly CLOSED: number;
    /**
     * `2`: signaling server is checking wether you are still connected to the group. If it is not the case, then
     * subscribs you to one of the group member in order to create a connection with him.
     * @type {number}
     */
    static readonly CHECKING: number;
    /**
     * `4`: a connection has been established with one of the group member or you are the only member of the group.
     * From now the signaling is no longer needed, because the joining process will continue with a help of this member.
     * @type {number}
     */
    static readonly CHECKED: number;
}
/**
 * The state enum of {@link WebGroup}.
 */
export declare class WebGroupState {
    /**
     * `0`: you haven't joined the group yet.
     * @type {number}
     */
    static readonly JOINING: number;
    /**
     * `1`: you have sussessfully joined the group and ready to communicate.
     * @type {number}
     */
    static readonly JOINED: number;
    /**
     * `3`: you have sussessfully left the group.
     * @type {number}
     */
    static readonly LEFT: number;
}
/**
 * The topology enum. More topologies will be added in the future
 */
export declare class Topology {
    /**
     * Full mesh topology identifier.
     * @type {number}
     */
    static readonly FULL_MESH: number;
}
/**
 * The log level enum for debugging purposes.
 */
export declare class LogLevel {
    /**
     * Equals to `1`, allows logs for debug.
     * @type {number}
     */
    static readonly DEBUG: number;
    /**
     * Equals to `2`, logs for WebGroup module.
     * @type {number}
     */
    static readonly WEB_GROUP: number;
    /**
     * Equals to `3`, logs for DataChannelBuilder module.
     * @type {number}
     */
    static readonly WEBRTC: number;
    /**
     * Equals to `4`, logs for Channel module.
     * @type {number}
     */
    static readonly CHANNEL: number;
    /**
     * Equals to `5`, logs for Topology module.
     * @type {number}
     */
    static readonly TOPOLOGY: number;
    /**
     * Equals to `6`, logs for Signaling module.
     * @type {number}
     */
    static readonly SIGNALING: number;
    /**
     * Equals to `7`, logs for ChannelBuilder module.
     * @type {number}
     */
    static readonly CHANNEL_BUILDER: number;
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
 * The options to be passed into {@link Bot} constructor.
 * @typedef {Object} BotOptions
 * @property {Topology} [topology] See WebGroupOptions.topology
 * @property {string} [signalingServer] See WebGroupOptions.signalingServer
 * @property {RTCConfiguration} [rtcConfiguration] See WebGroupOptions.rtcConfiguration
 * @property {boolean} [autoRejoin] See WebGroupOptions.autoRejoin
 * @property {Object} bot Server related options of the bot.
 * @property {HttpServer|HttpsServer} bot.server NodeJS http(s) server.
 * @property {string} [bot.url] Bot server URL.
 * @property {boolean} [bot.perMessageDeflate] Enable/disable permessage-deflate.
 * @property {boolean} [bot.leaveOnceAlone] If true, bot will live (disconnect from the signaling server) if no other peers left in the group.
 */
/**
 * @external {RTCConfiguration} https://developer.mozilla.org/en/docs/Web/API/RTCConfiguration
 */
/**
 * @external {Uint8Array} https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
 */
/**
 * @external {HttpServer} https://nodejs.org/api/http.html#http_class_http_server
 */
/**
 * @external {HttpsServer} https://nodejs.org/api/https.html#https_class_https_server
 */

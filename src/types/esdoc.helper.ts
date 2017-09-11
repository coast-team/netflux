/**
 * Is a helper type representing types that can be sent/received over a web group.
 * @typedef {string|Uint8Array} DataTypeView
 */

/**
 * Topology enum.
 * @typedef {Object} Topology
 * @property {number} [FULL_MESH=0] Full mesh topology.
 */

/**
 * The state fo the signaling server for WebRTC.
 * @typedef {Object} SignalingState
 * @property {number} [CONNECTING=0] The connection is not yet open.
 * @property {number} [OPEN=1] The connection is open and ready to communicate.
 * @property {number} [FIRST_CONNECTED=2] `RTCDataChannel` has been established
 * with one of the web group member. From now the signaling is no longer needed,
 * because the next of the joining process will pass through this member.
 * @property {number} [READY_TO_JOIN_OTHERS=3] You are successfully joined a
 * web group and ready to join others.
 * @property {number} [CLOSED=4] The connection is closed.
 */

/**
 * {@link WebGroup} state enum.
 * @typedef {Object} WebGroupState
 * @property {number} [JOINING=0] You are joining the web group.
 * @property {number} [JOINED=1] You have successfully joined the web group
 * and ready to broadcast messages via `send` method.
 * @property {number} [LEFT=2] You have left the web group. If the connection
 * to the web group has lost and `autoRejoin=true`, then the state would be `LEFT`,
 * (usually during a relatively short period) before the rejoining process start.
 */

/**
 * The options to be passed into {@link WebGroup} constructor.
 * @typedef {Object} WebGroupOptions
 * @property {Topology} topology Topology identifier
 * (Full mesh is the only one supported by Netflux for now).
 * @property {string} signalingURL Signaling URL for WebRTC.
 * @property {RTCIceServer[]} iceServers Array of Ice servers for WebRTC.
 * @property {boolean} autoRejoin Whether to automatically rejoin the web group
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
 * @property {NodeJS.http.Server|NodeJS.https.Server} bot.server NodeJS http(s) server.
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
 * @external {NodeJS.http.Server} https://nodejs.org/api/http.html#http_class_http_server
 */

/**
 * @external {NodeJS.https.Server} https://nodejs.org/api/https.html#https_class_https_server
 */

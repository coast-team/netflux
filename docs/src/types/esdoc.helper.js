/**
 * Is a helper type representing types that can be sent/received over a web group.
 * @typedef {string|Uint8Array} DataType
 */
/**
 * Signaling state event is fired when the {@link WebGroup} signaling state has changed.
 * @typedef {Object} SignalingStateEvent
 * @property {SignalingState} state One of the enum value.
 */
/**
 * {@link WebGroup} state event is fired when the {@link WebGroup} state has changed.
 * @typedef {Object} WebGroupStateEvent
 * @property {WebChannelState} state One of the enum value.
 */
/**
 * {@link WebGroup} message event is fired when a message has been received from a group.
 * @typedef {Object} MessageEvent
 * @property {number} id The identifier of the member who sent this message.
 * @property {DataType} data The data.
 * @property {boolean} isBroadcast Equals to true if the data is sent
 * via {@link WebGroup#send} and false if sent via {@link WebGroup#sendTo}.
 */
/**
 * {@link WebGroup} member event is fired when a group member has joined or left.
 * @typedef {Object} MemberEvent
 * @property {number} id The identifier of the member.
 */
/**
 * The options to be passed into {@link WebGroup} constructor.
 * @typedef {Object} WebGroupOptions
 * @property {TopologyEnum} topology Topology identifier
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
 * @property {TopologyEnum} [topology] See WebGroupOptions.topology
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

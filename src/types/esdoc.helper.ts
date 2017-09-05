
/**
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
  * The state of the web group.
  * @typedef {Object} WebGroupState
  * @property {number} [JOINING=0] You are joining the web group.
  * @property {number} [JOINED=1] You have successfully joined the web group
  * and ready to broadcast messages via `send` method.
  * @property {number} [LEFT=2] You have left the web group. If the connection
  * to the web group has lost and `autoRejoin=true`, then the state would be `LEFT`,
  * (usually during a relatively short period) before the rejoining process start.
  */

 /**
  * @external {RTCIceServer} https://developer.mozilla.org/en/docs/Web/API/RTCIceServer
  */

 /**
  * @typedef {Object} WebGroupOptions
  * @property {Topology} [topology=Topology.FULL_MESH] Topology identifier
  * (Full mesh is the only one supported by Netflux for now).
  * @property {string} [signalingURL="wss://www.coedit.re:20473"] Signaling URL for WebRTC.
  * @property {RTCIceServer[]} [iceServers=[{urls: 'stun:stun3.l.google.com:19302'}]]
  * Array of Ice servers for WebRTC.
  * @property {boolean} [autoRejoin=true] Whether to automatically rejoin
  * the web group on disconnect or not. Its value may be modified after
  * `WebGroup` instantiation at any time.
  */

  /**
   * @typedef {Object} WebGroupBotServerOptions
   * @property {Topology} [topology=WebGroupOptions.topology] Topology identifier
   * (Full mesh is the only one supported by Netflux for now).
   * @property {string} [signalingURL=WebGroupOptions.signalingURL] Signaling URL for WebRTC.
   * @property {RTCIceServer[]} [iceServers=WebGroupOptions.iceServers]
   * Array of Ice servers for WebRTC.
   * @property {boolean} [autoRejoin=WebGroupOptions.autoRejoin] Whether to automatically rejoin
   * the web group on disconnect or not. Its value may be modified after
   * `WebGroup` instantiation at any time.
   * @property {Object} [bot] Server related options of the bot.
   * @property {string} [bot.url=''] Bot server URL open to outside.
   * @property {Object} [bot.server=undefined] [µWebSockets](https://github.com/uNetworking/uWebSockets) `Server` object.
   * @property {boolean} [bot.perMessageDeflate=false] Enable/disable permessage-deflate.
   */

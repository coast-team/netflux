/**
* Header of the metadata of the messages sent/received over the `WebChannel`.
* @typedef {Object} MessageHeader
* @property {number} code Message type code
* @property {number} senderId Id of the sender peer
* @property {number} recipientId Id of the recipient peer
*/

/**
 * @typedef {string|ArrayBuffer|TypedArray} UserMessage
 */

/**
 * WebChannel settings
 * @typedef {Object} WebChannelSettings
 * @property {WEB_RTC|WEB_SOCKET} connector Which connector is preferable during connection establishment
 * @property {FULLY_CONNECTED} topology Fully connected topology is the only one available for now
 * @property {string} signalingURL Signaling server url
 * @property {RTCIceServer} iceServers Set of ice servers for WebRTC
 * @property {string} listenOn Server url when the peer is listen on web socket
 */

/**
 * Necessary data to join the `WebChannel`.
 * @typedef {Object} OpenData
 * @property {string} url Signaling server url
 * @property {string} key The unique key to join the `WebChannel`
 */

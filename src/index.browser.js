import { WebChannel } from 'WebChannel'
import { defaults } from 'defaults'

/**
 * Create `WebChannel`.
 *
 * @param {WebChannelSettings} options
 * @param {FULLY_CONNECTED} [options.topology=FULLY_CONNECTED] Fully connected topology is the only one available for now
 * @param {string} [options.signalingURL='wss://www.coedit.re:10473'] Signaling server url
 * @param {RTCIceServer} [options.iceServers=[{urls:'stun3.l.google.com:19302'}]] Set of ice servers for WebRTC
 * @param {string} [options.listenOn=''] Server url when the peer is listen on web socket
 *
 * @returns {WebChannel}
 */
function create (options) {
  const mySettings = Object.assign({}, defaults, options)
  return new WebChannel(mySettings)
}

export { create }

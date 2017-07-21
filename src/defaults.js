import { FULL_MESH } from './service/topology/FullMesh'

/**
 * @type {Object}
 * @property {FULL_MESH} defaults.topology Fully connected topology is the only one available for now
 * @property {string} defaults.signalingURL Signaling server url
 * @property {RTCIceServer} defaults.iceServers Set of ice servers for WebRTC
 */
export const defaults = {
  topology: FULL_MESH,
  signalingURL: 'wss://www.coedit.re:10473',
  iceServers: [
    {urls: 'stun:stun3.l.google.com:19302'}
  ]
}

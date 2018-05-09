try {
  const wrtc = require('wrtc')
  global.RTCPeerConnection = wrtc.RTCPeerConnection
  global.RTCDataChannel = wrtc.RTCDataChannel
  global.RTCIceCandidate = wrtc.RTCIceCandidate
} catch (err) {
  console.warn(err.message)
}
global.WebSocket = require('uws')
const textEncoding = require('text-encoding')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder
global.cryptoNode = require('crypto')

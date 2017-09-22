try {
  const wrtc = require('wrtc')
  global.RTCPeerConnection = wrtc.RTCPeerConnection
  global.RTCDataChannel = wrtc.RTCDataChannel
  global.RTCIceCandidate = wrtc.RTCIceCandidate
} catch (err) {
  console.warn(err.message)
}
try {
  global.WebSocket = require('uws')
} catch (err) {
  console.warn(err.message)
}
try {
  const textEncoding = require('text-encoding')
  global.TextEncoder = textEncoding.TextEncoder
  global.TextDecoder = textEncoding.TextDecoder
  const WebCrypto = require('node-webcrypto-ossl') // tslint:disable-line
  global.crypto = new WebCrypto()
  global.Event = class Event {
    constructor (public name: string) {}
  } as any
} catch (err) {
  console.error(err)
}

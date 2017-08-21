/* tslint:disable:variable-name */
// #if BROWSER
import 'webrtc-adapter/out/adapter_no_edge_no_global'
// #endif

// #if NODE
try {
  const wrtc = require('wrtc')
  global.RTCPeerConnection = wrtc.RTCPeerConnection
  global.RTCDataChannel = wrtc.RTCDataChannel
  global.RTCIceCandidate = wrtc.RTCIceCandidate
} catch (err) {
  console.warn(err.message)
  global.RTCPeerConnection = undefined
  global.RTCDataChannel = undefined
  global.RTCIceCandidate = undefined
}
const textEncoding = require('text-encoding')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder
global.WebSocket = require('uws')
const WebCrypto = require('node-webcrypto-ossl')
global.crypto = new WebCrypto()
global.CloseEvent = class CloseEvent {
  name: string
  wasClean: boolean
  code: number
  reason: string
  constructor (name: string, options?: CloseEventInit) {
    this.name = name
    this.wasClean = false
    this.code = options.code || 0
    this.reason = options.reason || ''
  }
}
// #endif

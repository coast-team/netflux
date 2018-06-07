import { env } from './env'

declare const require: any

try {
  const wrtc = require('wrtc')
  env.RTCPeerConnection = wrtc.RTCPeerConnection
  env.RTCIceCandidate = wrtc.RTCIceCandidate
} catch (err) {
  console.warn(err.message)
}
env.WebSocket = require('uws')
const textEncoding = require('text-encoding')
env.TextEncoder = textEncoding.TextEncoder
env.TextDecoder = textEncoding.TextDecoder
env.cryptoNode = require('crypto')

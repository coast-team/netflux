import * as crypto from 'crypto'
import { TextDecoder, TextEncoder } from 'text-encoding'
import * as WebSocket from 'ws'

import { env } from './env'

// TODO: add wrtc for WebRTC/RTCDataChannel support in NodeJS
// try {
//   const wrtc = require('wrtc')
//   env.RTCPeerConnection = wrtc.RTCPeerConnection
//   env.RTCIceCandidate = wrtc.RTCIceCandidate
// } catch (err) {
//   console.warn(err.message)
// }
env.WebSocket = WebSocket as any
env.TextEncoder = TextEncoder
env.TextDecoder = TextDecoder
env.cryptoNode = crypto

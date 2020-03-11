import * as crypto from 'crypto'
import * as WebSocket from 'ws'
const util = require('util')

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
env.TextEncoder = util.TextEncoder
env.TextDecoder = util.TextDecoder
env.cryptoNode = crypto

import '../node_modules/webrtc-adapter/out/adapter_no_edge_no_global'
import { isBrowser } from './Util'

/* tslint:disable:variable-name */

let _RTCPeerConnection
let _RTCDataChannel
let _RTCIceCandidate
let _WebSocket
let _TextEncoder: TextEncoder
let _TextDecoder: TextDecoder
let _CloseEvent

if (isBrowser()) {
  _RTCPeerConnection = RTCPeerConnection
  _RTCDataChannel = RTCDataChannel
  _RTCIceCandidate = RTCIceCandidate
  _WebSocket = WebSocket
  _TextEncoder = TextEncoder
  _TextDecoder = TextDecoder
  _CloseEvent = CloseEvent
} else {

  // #if NODE
  const textEncoding = require('text-encoding')
  try {
    const wrtc = require('wrtc')
    _RTCPeerConnection = wrtc.RTCPeerConnection
    _RTCDataChannel = wrtc.RTCDataChannel
    _RTCIceCandidate = wrtc.RTCIceCandidate
  } catch (err) {
    console.warn(err.message)
    _RTCPeerConnection = undefined
    _RTCDataChannel = undefined
    _RTCIceCandidate = undefined
  }
  _WebSocket = require('uws')
  _TextEncoder = textEncoding.TextEncoder
  _TextDecoder = textEncoding.TextDecoder
  _CloseEvent = class CloseEvent {
    name: string
    wasClean: boolean
    code: number
    reason: string
    constructor (name, options: {code?: number, wasClean?: boolean, reason?: string} = {}) {
      this.name = name
      this.wasClean = options.wasClean || false
      this.code = options.code || 0
      this.reason = options.reason || ''
    }
  }
  // #endif
}
export {
  _RTCPeerConnection as RTCPeerConnection,
  _RTCDataChannel as RTCDataChannel,
  _RTCIceCandidate as RTCIceCandidate,
  _WebSocket as WebSocket,
  _TextEncoder as TextEncoder,
  _TextDecoder as TextDecoder,
  _CloseEvent as CloseEvent
}

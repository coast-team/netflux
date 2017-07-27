import '../node_modules/webrtc-adapter/out/adapter_no_edge_no_global'
import { Util } from './Util'

let WebRTC
let WebSocket
let TextEncoder
let TextDecoder
let CloseEvent

if (Util.isBrowser()) {
  WebRTC = window
  WebSocket = window.WebSocket
  TextEncoder = window.TextEncoder
  TextDecoder = window.TextDecoder
  CloseEvent = window.CloseEvent
} else {
  // #if NODE

  try {
    WebRTC = require('wrtc')
  } catch (err) {
    console.warn(err.message)
    WebRTC = undefined
  }
  WebSocket = require('uws')
  const textEncoding = require('text-encoding')
  TextEncoder = textEncoding.TextEncoder
  TextDecoder = textEncoding.TextDecoder
  CloseEvent = class CloseEvent {
    constructor (name, options = {}) {
      this.name = name
      this.wasClean = options.wasClean || false
      this.code = options.code || 0
      this.reason = options.reason || ''
    }
  }
  // #endif
}
export { WebRTC, WebSocket, TextEncoder, TextDecoder, CloseEvent }

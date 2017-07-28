import '../node_modules/webrtc-adapter/out/adapter_no_edge_no_global'
import { Util } from './Util'

/* tslint:disable:variable-name */

let WebRTC
let _WebSocket
let _TextEncoder
let _TextDecoder
let _CloseEvent

if (Util.isBrowser()) {
  WebRTC = window
  _WebSocket = WebSocket
  _TextEncoder = TextEncoder
  _TextDecoder = TextDecoder
  _CloseEvent = CloseEvent
} else {
  // #if NODE

  try {
    WebRTC = require('wrtc')
  } catch (err) {
    console.warn(err.message)
    WebRTC = undefined
  }
  _WebSocket = require('uws')
  const textEncoding = require('text-encoding')
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
export { WebRTC, _WebSocket as WebSocket, _TextEncoder as TextEncoder, _TextDecoder as TextDecoder, _CloseEvent as CloseEvent }

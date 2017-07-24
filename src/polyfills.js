import '../node_modules/webrtc-adapter/out/adapter_no_edge_no_global'

import { Util } from './Util'

const NodeCloseEvent = class CloseEvent {
  constructor (name, options = {}) {
    this.name = name
    this.wasClean = options.wasClean || false
    this.code = options.code || 0
    this.reason = options.reason || ''
  }
}

export const WebRTC = Util.isBrowser() ? window : require('wrtc')
export const WebSocket = Util.isBrowser() ? window.WebSocket : require('uws')
export const TextEncoder = Util.isBrowser() ? window.TextEncoder : require('text-encoding').TextEncoder
export const TextDecoder = Util.isBrowser() ? window.TextDecoder : require('text-encoding').TextDecoder
export const CloseEvent = Util.isBrowser() ? window.CloseEvent : NodeCloseEvent

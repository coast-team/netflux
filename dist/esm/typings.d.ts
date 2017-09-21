/// <reference types="text-encoding" />

/**
 * Extends "global" variable
 */
declare module NodeJS {
  interface Global {
    RTCPeerConnection: typeof RTCPeerConnection
    RTCDataChannel: RTCDataChannel
    RTCIceCandidate: typeof RTCIceCandidate
    TextEncoder: typeof TextEncoding.TextEncoder
    TextDecoder: typeof TextEncoding.TextDecoder
    WebSocket: typeof WebSocket
    crypto: Crypto
    Event: typeof Event
  }
}

/**
 * Extends lib.d.ts with WebRTC missing declarations.
 */

interface RTCPeerConnection {
  iceCandidateState: RTCIceConnectionState
  ondatachannel: (event: RTCDataChannelEvent) => void
  createDataChannel (label: string): RTCDataChannel
}

interface RTCDataChannelEvent {
  readonly channel: RTCDataChannel
}

interface RTCDataChannel extends EventTarget {
  label: string
  reliable: boolean
  readyState: string
  bufferedAmount: number
  binaryType: string
  onopen: (event: Event) => void
  onerror: (event: Event) => void
  onclose: (event: Event) => void
  onmessage: (event: Event) => void
  close (): void
  send (data: string)
  send (data: ArrayBuffer)
  send (data: Blob)
}

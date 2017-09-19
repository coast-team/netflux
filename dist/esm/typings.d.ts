/// <reference types="text-encoding" />

/**
 * Polyfills globals for NodeJS
 */
declare module NodeJS  {
    interface Global {
      RTCPeerConnection: RTCPeerConnection,
      RTCDataChannel: RTCDataChannel,
      RTCIceCandidate: RTCIceCandidate,
      TextEncoder: TextEncoding.TextEncoder
      TextDecoder: TextEncoding.TextDecoder,
      WebSocket: WebSocket,
      crypto: Crypto,
      Event: { name: string }
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

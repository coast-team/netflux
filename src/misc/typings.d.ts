/* tslint:disable */

declare var global: Window & {
  RTCPeerConnection: typeof RTCPeerConnection
  RTCDataChannel: RTCDataChannel
  RTCIceCandidate: typeof RTCIceCandidate
  TextEncoder: typeof TextEncoder
  TextDecoder: typeof TextDecoder
  WebSocket: typeof WebSocket
  crypto: Crypto
  cryptoNode: any
  fullmesh: any // for debuging
}

declare var require: (id: string) => any
declare type NodeJSHttpServer = any // NodeJS http.Server
declare type NodeJSHttpsServer = any // NodeJS https.Server

// Extends lib.d.ts with WebRTC missing declarations.
interface RTCPeerConnection {
  iceCandidateState: RTCIceConnectionState
  ondatachannel: (event: RTCDataChannelEvent) => void
  createDataChannel(label: string): RTCDataChannel
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
  close(): void
  send(data: string | ArrayBuffer | Blob): void
}

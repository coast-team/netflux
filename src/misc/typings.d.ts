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

// The following Text Encoding declaration are added because they exist only started from TypeScript v2.8.x

interface TextDecodeOptions {
  stream?: boolean
}

interface TextDecoderOptions {
  fatal?: boolean
  ignoreBOM?: boolean
}

interface TextDecoder {
  readonly encoding: string
  readonly fatal: boolean
  readonly ignoreBOM: boolean
  decode(
    input?:
      | Int8Array
      | Int16Array
      | Int32Array
      | Uint8Array
      | Uint16Array
      | Uint32Array
      | Uint8ClampedArray
      | Float32Array
      | Float64Array
      | DataView
      | ArrayBuffer
      | null,
    options?: TextDecodeOptions
  ): string
}

declare var TextDecoder: {
  prototype: TextDecoder
  new (label?: string, options?: TextDecoderOptions): TextDecoder
}

interface TextEncoder {
  readonly encoding: string
  encode(input?: string): Uint8Array
}

declare var TextEncoder: {
  prototype: TextEncoder
  new (): TextEncoder
}

// Types for NodeJS environment
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

/* tslint:disable:interface-name */

// The following Text Encoding declarations are added because they exist only since TypeScript v2.8.x
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

interface TextEncoder {
  readonly encoding: string
  encode(input?: string): Uint8Array
}

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

// Types for NodeJS environment, just for visual understanding
declare type NodeJSHttpServer = any // NodeJS http.Server
declare type NodeJSHttpsServer = any // NodeJS https.Server

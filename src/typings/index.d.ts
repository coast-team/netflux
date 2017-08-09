declare enum RTCDataChannelState {
  connecting,
  open,
  closing,
  closed
}

interface RTCDataChannelEvent {
  readonly channel: RTCDataChannel
}

interface RTCDataChannel extends EventTarget {
  label: string
  reliable: boolean
  readyState: RTCDataChannelState
  bufferedAmount: number
  onopen: (event: Event) => void
  onerror: (event: Event) => void
  onclose: (event: Event) => void
  onmessage: (event: Event) => void
  binaryType: string
  close (): void
  send (data: string)
  send (data: ArrayBuffer)
  send (data: Blob)
}

declare var RTCDataChannel: {
  prototype: RTCDataChannel
  new (): RTCDataChannel
}

interface RTCPeerConnection {
  iceCandidateState: RTCIceConnectionState
  ondatachannel: (event: RTCDataChannelEvent) => void
  createDataChannel (label: string): RTCDataChannel
}

declare function require (module: string): any

interface TextDecoderOptions {
  fatal?: boolean
  ignoreBOM?: boolean
}

interface TextDecodeOptions {
  stream?: boolean
}

interface TextEncoderOptions {
  NONSTANDARD_allowLegacyEncoding?: boolean
}

interface TextDecoder {
  encoding: string
  fatal: boolean
  ignoreBOM: boolean
  (label?: string, options?: TextDecoderOptions): TextDecoder
  new (label?: string, options?: TextDecoderOptions): TextDecoder
  decode (input?: ArrayBuffer | ArrayBufferView, options?: TextDecodeOptions): string
}

interface TextEncoder {
  encoding: string
  (utfLabel?: string, options?: TextEncoderOptions): TextEncoder
  new (utfLabel?: string, options?: TextEncoderOptions): TextEncoder
  encode (input?: string, options?: TextEncodeOptions): Uint8Array
}

interface TextEncodeOptions {
  stream?: boolean
}
declare var TextDecoder: TextDecoder

declare var TextEncoder: TextEncoder

/* tslint:disable:interface-name */
import * as CryptoNode from 'crypto'

export interface RTCDataChannelEvent {
  readonly channel: RTCDataChannel
}

export interface RTCDataChannel extends EventTarget {
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

export interface IEnvironment {
  RTCPeerConnection: typeof RTCPeerConnection
  RTCIceCandidate: typeof RTCIceCandidate
  TextEncoder: typeof TextEncoder
  TextDecoder: typeof TextDecoder
  WebSocket: typeof WebSocket
  crypto: Crypto
  cryptoNode: typeof CryptoNode
}

export const env: IEnvironment = {} as IEnvironment

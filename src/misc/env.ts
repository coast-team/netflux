/* tslint:disable:interface-name */

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

// Types for NodeJS environment, just for visual understanding
export type NodeJSHttpServer = any // NodeJS http.Server
export type NodeJSHttpsServer = any // NodeJS https.Server

export interface IEnvironment {
  RTCPeerConnection: any
  RTCIceCandidate: any
  TextEncoder: any
  TextDecoder: any
  WebSocket: typeof WebSocket
  crypto: Crypto
  cryptoNode: any
}

export const env: IEnvironment = {} as IEnvironment

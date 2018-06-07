export interface IEnvironment {
  RTCPeerConnection: typeof RTCPeerConnection
  RTCIceCandidate: typeof RTCIceCandidate
  TextEncoder: typeof TextEncoder
  TextDecoder: typeof TextDecoder
  WebSocket: typeof WebSocket
  crypto: Crypto
  cryptoNode: any
}

export const env: IEnvironment = {} as IEnvironment

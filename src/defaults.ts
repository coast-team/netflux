import { FULL_MESH } from './service/topology/FullMesh'

enum Topologies {
  FULL_MESH
}

export interface WebChannelOptions {
  topology: Topologies,
  signalingURL: string,
  iceServers: RTCIceServer[],
  autoRejoin: boolean
}

export interface BotOptions {
  url: string,
  server: any,
  perMessageDeflate: boolean
}

export const defaults: WebChannelOptions = {
  topology: FULL_MESH,
  signalingURL: 'wss://www.coedit.re:10473',
  iceServers: [
    {urls: 'stun:stun3.l.google.com:19302'}
  ],
  autoRejoin: true
}

import { FULL_MESH } from './service/topology/FullMesh'
import { SPRAY } from './service/topology/spray/SprayService'

enum Topologies {
  FULL_MESH,
  SPRAY
}

export interface WebChannelOptions {
  topology: Topologies,
  signalingURL: string,
  iceServers: RTCIceServer[]
}

export interface BotOptions {
  url: string,
  server: any,
  perMessageDeflate: boolean
}

export const defaults: WebChannelOptions = {
  topology: SPRAY,
  signalingURL: 'wss://www.coedit.re:10473',
  iceServers: [
    {urls: 'stun:stun3.l.google.com:19302'}
  ]
}

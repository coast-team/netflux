import 'webrtc-adapter/out/adapter_no_edge_no_global.js'
import { env } from './env'

env.RTCPeerConnection = (window as any).RTCPeerConnection
env.RTCIceCandidate = (window as any).RTCIceCandidate
env.WebSocket = (window as any).WebSocket
env.TextEncoder = (window as any).TextEncoder
env.TextDecoder = (window as any).TextDecoder
env.crypto = (window as any).crypto

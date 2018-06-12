import 'webrtc-adapter/out/adapter_no_edge_no_global.js';
import { env } from './env';
env.RTCPeerConnection = window.RTCPeerConnection;
env.RTCIceCandidate = window.RTCIceCandidate;
env.WebSocket = window.WebSocket;
env.TextEncoder = window.TextEncoder;
env.TextDecoder = window.TextDecoder;
env.crypto = window.crypto;

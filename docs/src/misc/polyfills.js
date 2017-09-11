/* tslint:disable:variable-name */
// #if WEBRTC_ADAPTER
import 'webrtc-adapter/out/adapter_no_edge_no_global';
// #endif
// #if NODE
try {
    const wrtc = require('wrtc');
    global.RTCPeerConnection = wrtc.RTCPeerConnection;
    global.RTCDataChannel = wrtc.RTCDataChannel;
    global.RTCIceCandidate = wrtc.RTCIceCandidate;
}
catch (err) {
    console.warn(err.message);
    global.RTCPeerConnection = undefined;
    global.RTCDataChannel = undefined;
    global.RTCIceCandidate = undefined;
}
const textEncoding = require('text-encoding');
global.TextEncoder = textEncoding.TextEncoder;
global.TextDecoder = textEncoding.TextDecoder;
global.WebSocket = require('uws');
const WebCrypto = require('node-webcrypto-ossl');
global.crypto = new WebCrypto();
global.Event = class Event {
    constructor(name) {
        this.name = name;
    }
};
// #endif

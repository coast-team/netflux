/* tslint:disable:variable-name */
// #if WEBRTC_ADAPTER
// import 'webrtc-adapter/out/adapter_no_edge_no_global'
// #endif
/**
 * ECMAScript Proposal, specs, and reference implementation for `global`
 * http://tc39.github.io/proposal-global/
 * Code copied from: https://github.com/tc39/proposal-global
 */
(function (global) {
    if (!global.global) {
        if (Object.defineProperty) {
            Object.defineProperty(global, 'global', {
                configurable: true,
                enumerable: false,
                value: global,
                writable: true
            });
        }
        else {
            global.global = global;
        }
    }
})(typeof this === 'object' ? this : Function('return this')()); // tslint:disable-line
// #if NODE
try {
    const wrtc = require('wrtc');
    global.RTCPeerConnection = wrtc.RTCPeerConnection;
    global.RTCDataChannel = wrtc.RTCDataChannel;
    global.RTCIceCandidate = wrtc.RTCIceCandidate;
}
catch (err) {
    console.warn(err.message);
}
try {
    global.WebSocket = require('uws');
}
catch (err) {
    console.warn(err.message);
}
try {
    const textEncoding = require('text-encoding');
    global.TextEncoder = textEncoding.TextEncoder;
    global.TextDecoder = textEncoding.TextDecoder;
    const WebCrypto = require('node-webcrypto-ossl');
    global.crypto = new WebCrypto();
    global.Event = class Event {
        constructor(name) {
            this.name = name;
        }
    };
}
catch (err) {
    console.error(err);
}
// #endif

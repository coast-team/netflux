"use strict";
try {
    const wrtc = require('wrtc');
    global.RTCPeerConnection = wrtc.RTCPeerConnection;
    global.RTCDataChannel = wrtc.RTCDataChannel;
    global.RTCIceCandidate = wrtc.RTCIceCandidate;
}
catch (err) {
    console.warn(err.message);
}
global.WebSocket = require('uws');
const textEncoding = require('text-encoding');
global.TextEncoder = textEncoding.TextEncoder;
global.TextDecoder = textEncoding.TextDecoder;
global.crypto = require('crypto');
global.Event = class Event {
    constructor(name) {
        this.name = name;
    }
};

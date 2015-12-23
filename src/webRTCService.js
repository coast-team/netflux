import { Peer } from './peer';

class WebRTCService {
  constructor() {
    this.RTCPeerConnection =
      window.RTCPeerConnection ||
      window.mozRTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.msRTCPeerConnection;

    this.RTCIceCandidate =
      window.RTCIceCandidate ||
      window.mozRTCIceCandidate ||
      window.RTCIceCandidate ||
      window.msRTCIceCandidate;

    this.RTCSessionDescription =
      window.RTCSessionDescription ||
      window.mozRTCSessionDescription ||
      window.webkitRTCSessionDescription ||
      window.msRTCSessionDescription;

    this.default = {
      iceServers: [{
        urls: 'stun:23.21.150.121',
      }, {
        urls: 'stun:stun.l.google.com:19302',
      }, {
        urls: 'turn:numb.viagenie.ca',
        credential: 'webrtcdemo',
        username: 'louis%40mozilla.com',
      }],
    };
  }

  connect(signalingServerURL) {
    let peer = new Peer();
    let me = new this.RTCPeerConnection(this.default);
    let dataChannel = me.createDataChannel(this._randomString());
    let promise = new Promise((resolve, reject) => {

    });
  }

  disconnect(connectorObj) {

  }

  initiateConnection() {

  }

  finalizeConnection(anotherPeerSDPData) {

  }

  send(connectorObj, msg) {

  }

  onMessage() {

  }

  _randomString() {
    const MIN_LENGTH = 10;
    const DELTA_LENGTH = 10;
    const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH);

    for (let i = 0; i < length; i++) {
      result += MASK[Math.round(Math.random() * (MASK.length - 1))];
    }
    return result;
  }
}

export { WebRTCService };

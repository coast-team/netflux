class WebRTCService {

  constructor (options = {}) {
    this.defaults = {
      signalling: '',
      webRTCOptions: {
        iceServers: [{
          urls: ['stun:23.21.150.121', 'stun:stun.l.google.com:19302']
        }, {
          urls: 'turn:numb.viagenie.ca',
          credential: 'webrtcdemo',
          username: 'louis%40mozilla.com'
        }]
      }
    }
    this.settings = Object.assign({}, this.defaults, options)
    this.socket = null
    this.me = null

    // Declare WebRTC related global(window) constructors
    this.RTCPeerConnection =
      window.RTCPeerConnection ||
      window.mozRTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.msRTCPeerConnection

    this.RTCIceCandidate =
      window.RTCIceCandidate ||
      window.mozRTCIceCandidate ||
      window.RTCIceCandidate ||
      window.msRTCIceCandidate

    this.RTCSessionDescription =
      window.RTCSessionDescription ||
      window.mozRTCSessionDescription ||
      window.webkitRTCSessionDescription ||
      window.msRTCSessionDescription
  }

  open (onchannel, options) {
    let settings = Object.assign({}, this.settings, {key: this._randomKey()}, options)
    return new Promise((resolve, reject) => {
      try {
        this.socket = new window.WebSocket(settings.signalling)
        this.socket.onerror = (e) => { reject(e) }
        this.socket.onopen = () => {
          this.socket.send(JSON.stringify({key: settings.key}))
          this.me = new this.RTCPeerConnection(settings.webRTCOptions)
          this._setupIceGathering(this.me, this.socket, false)
          this.me.ondatachannel = (e) => {
            e.channel.onopen = () => {
              onchannel(e.channel)
            }
          }
          resolve({url: this.settings.signalling, key: settings.key})
        }
        this.socket.onmessage = (e) => {
          let msg = JSON.parse(e.data)
          if (msg.offer.hasOwnProperty('candidate')) {
            let candidate = new this.RTCIceCandidate(msg.offer.candidate)
            this.me.addIceCandidate(candidate, () => {}, (e) => {
              reject(e)
            })
          } else {
            let sd = Object.assign(new this.RTCSessionDescription(), msg.offer)
            this.me.setRemoteDescription(sd, () => {
              this.me.createAnswer((answer) => {
                this.me.setLocalDescription(answer, () => {
                  this.socket.send(JSON.stringify({answer: this.me.localDescription.toJSON()}))
                }, (e) => { reject(e) })
              }, (e) => {
                reject(e)
              })
            }, (e) => {
              reject(e)
            })
          }
        }
      } catch (e) { reject(e) }
    })
  }

  join (joinkey, options) {
    let settings = Object.assign({}, this.settings, options)
    return new Promise((resolve, reject) => {
      try {
        let socket = new window.WebSocket(settings.signalling)
        socket.onerror = (e) => { reject(e) }
        socket.onopen = () => {
          socket.send(JSON.stringify({joinkey}))
          this.me = new this.RTCPeerConnection(settings.webRTCOptions)
          this._setupIceGathering(this.me, socket, true)
          let dc = this.me.createDataChannel(joinkey)
          dc.onopen = () => { resolve(dc) }
        }
        socket.onmessage = (e) => {
          let msg = JSON.parse(e.data)
          if (msg.hasOwnProperty('reachable')) {
            this.me.createOffer((offer) => {
              this.me.setLocalDescription(offer, () => {
                socket.send(JSON.stringify({offer: this.me.localDescription.toJSON()}))
              }, (e) => { reject(e) })
            }, (e) => { reject(e) })
          } else if (msg.answer.hasOwnProperty('candidate')) {
            let candidate = new this.RTCIceCandidate(msg.answer.candidate)
            this.me.addIceCandidate(candidate, () => {}, (e) => {
              reject(e)
            })
          } else {
            let sd = Object.assign(new this.RTCSessionDescription(), msg.answer)
            this.me.setRemoteDescription(sd, () => {}, (e) => {
              reject(e)
            })
          }
        }
      } catch (e) { reject(e) }
    })
  }

  disableToConnect (anotherPeerSDPData) {

  }

  send (connectorObj, msg) {

  }

  onMessage () {

  }

  _setupIceGathering (rtcpc, socket, isOffer) {
    rtcpc.onicecandidate = (e) => {
      if (e.candidate !== null) {
        let candidate = {
          candidate: e.candidate.candidate,
          sdpMLineIndex: e.candidate.sdpMLineIndex
        }
        if (isOffer) {
          socket.send(JSON.stringify({offer: {candidate}}))
        } else {
          socket.send(JSON.stringify({answer: {candidate}}))
        }
      }
    }
  }

  _randomKey () {
    const MIN_LENGTH = 10
    const DELTA_LENGTH = 10
    const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH)

    for (let i = 0; i < length; i++) {
      result += MASK[Math.round(Math.random() * (MASK.length - 1))]
    }
    return result
  }
}

export { WebRTCService }

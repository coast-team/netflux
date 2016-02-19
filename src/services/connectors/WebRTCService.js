import * as cs from '../../constants'
import ServiceProvider from '../../ServiceProvider'

const WEBRTC_DATA = 0
const CONNECT_WITH = 1
const CONNECT_WITH_SUCCEED = 2

export default class WebRTCService {

  constructor (options = {}) {
    this.NAME = this.constructor.name
    this.protocol = ServiceProvider.get(cs.EXCHANGEPROTOCOL_SERVICE)
    this.defaults = {
      signaling: 'ws://localhost:8000',
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

  connect (newPeerID, webChannel, peerID) {
    webChannel.topologyService.sendTo(peerID, webChannel, this._msg(
      CONNECT_WITH,
      {key: newPeerID, intermediaryID: webChannel.myID}
    ))
  }

  open (onchannel, options = {}) {
    let defaults = {
      key: this._randomKey()
    }
    let settings = Object.assign({}, this.settings, defaults, options)

    return new Promise((resolve, reject) => {
      let connections = []
      let socket = new window.WebSocket(settings.signaling)
      socket.onopen = () => {
        socket.send(JSON.stringify({key: settings.key}))
        resolve({url: this.settings.signaling, key: settings.key})
      }
      socket.onmessage = (e) => {
        let msg = JSON.parse(e.data)
        if (Reflect.has(msg, 'id') && Reflect.has(msg, 'data')) {
          if (Reflect.has(msg.data, 'offer')) {
            let connection = new this.RTCPeerConnection(settings.webRTCOptions)
            connections.push(connection)
            connection.ondatachannel = (e) => {
              e.channel.onopen = () => {
                onchannel(e.channel)
              }
            }
            connection.onicecandidate = (e) => {
              if (e.candidate !== null) {
                let candidate = {
                  candidate: e.candidate.candidate,
                  sdpMLineIndex: e.candidate.sdpMLineIndex
                }
                socket.send(JSON.stringify({id: msg.id, data: {candidate}}))
              }
            }
            let sd = Object.assign(new this.RTCSessionDescription(), msg.data.offer)
            connection.setRemoteDescription(sd, () => {
              connection.createAnswer((answer) => {
                connection.setLocalDescription(answer, () => {
                  socket.send(JSON.stringify({
                    id: msg.id,
                    data: {answer: connection.localDescription.toJSON()}})
                  )
                }, () => {})
              }, () => {})
            }, () => {})
          } else if (Reflect.has(msg.data, 'candidate')) {
            let candidate = new this.RTCIceCandidate(msg.data.candidate)
            connections[msg.id].addIceCandidate(candidate)
          }
        }
      }
      socket.onerror = reject
    })
  }

  join (key, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    return new Promise((resolve, reject) => {
      let connection
      let socket = new window.WebSocket(settings.signaling)
      socket.onopen = () => {
        connection = new this.RTCPeerConnection(settings.webRTCOptions)
        connection.onicecandidate = (e) => {
          if (e.candidate !== null) {
            let candidate = {
              candidate: e.candidate.candidate,
              sdpMLineIndex: e.candidate.sdpMLineIndex
            }
            socket.send(JSON.stringify({data: {candidate}}))
          }
        }
        let dc = connection.createDataChannel(key)
        dc.onopen = () => { resolve(dc) }
        connection.createOffer((offer) => {
          connection.setLocalDescription(offer, () => {
            socket.send(JSON.stringify({join: key, data: {offer: connection.localDescription.toJSON()}}))
          }, reject)
        }, reject)
      }
      socket.onmessage = (e) => {
        let msg = JSON.parse(e.data)
        if (Reflect.has(msg, 'data')) {
          if (Reflect.has(msg.data, 'answer')) {
            let sd = Object.assign(new this.RTCSessionDescription(), msg.data.answer)
            connection.setRemoteDescription(sd, () => {}, reject)
          } else if (Reflect.has(msg.data, 'candidate')) {
            let candidate = new this.RTCIceCandidate(msg.data.candidate)
            connection.addIceCandidate(candidate)
          } else { reject() }
        } else { reject() }
      }
      socket.onerror = reject
    })
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

  _msg (code, data) {
    let msg = {service: this.constructor.name}
    msg.data = {}
    msg.data.code = code
    Object.assign(msg.data, data)
    return this.protocol.message(cs.SERVICE_DATA, msg)
  }

  onmessage (channel, msg) {
    let webChannel = channel.webChannel
    if (!Reflect.has(webChannel, 'connections')) {
      webChannel.connections = new Map()
    }
    switch (msg.code) {
      case WEBRTC_DATA:
        if (webChannel.myID === msg.recipientPeerID) {
          if (Reflect.has(msg, 'sdp')) {
            if (msg.sdp.type === 'offer') {
              let connection = new this.RTCPeerConnection(this.settings.webRTCOptions)
              webChannel.connections.set(msg.senderPeerID, connection)
              connection.ondatachannel = (e) => {
                e.channel.onopen = () => {
                  e.channel.peerID = msg.senderPeerID
                  e.channel.webChannel = webChannel
                  e.channel.onmessage = this.protocol.onmessage
                  webChannel.channels.add(e.channel)
                }
              }
              connection.onicecandidate = (e) => {
                if (e.candidate !== null) {
                  let candidate = {
                    candidate: e.candidate.candidate,
                    sdpMLineIndex: e.candidate.sdpMLineIndex
                  }
                  channel.send(
                    this._msg(WEBRTC_DATA, {
                      senderPeerID: webChannel.myID,
                      recipientPeerID: msg.senderPeerID,
                      candidate
                    })
                  )
                }
              }
              let sd = Object.assign(new this.RTCSessionDescription(), msg.sdp)
              connection.setRemoteDescription(sd, () => {
                connection.createAnswer((answer) => {
                  connection.setLocalDescription(answer, () => {
                    channel.send(
                      this._msg(WEBRTC_DATA, {
                        senderPeerID: webChannel.myID,
                        recipientPeerID: msg.senderPeerID,
                        sdp: connection.localDescription.toJSON()
                      })
                    )
                  }, () => {})
                }, () => {})
              }, () => {})
            } else if (msg.sdp.type === 'answer') {
              let sd = Object.assign(new this.RTCSessionDescription(), msg.sdp)
              webChannel.connections
                .get(msg.senderPeerID)
                .setRemoteDescription(sd, () => {}, () => {})
            }
          } else if (Reflect.has(msg, 'candidate')) {
            webChannel.connections
              .get(msg.senderPeerID)
              .addIceCandidate(new this.RTCIceCandidate(msg.candidate))
          }
        } else {
          let data = this._msg(WEBRTC_DATA, msg)
          if (webChannel.aboutToJoin.has(msg.recipientPeerID)) {
            webChannel.aboutToJoin.get(msg.recipientPeerID).send(data)
          } else {
            webChannel.topologyService.sendTo(msg.recipientPeerID, webChannel, data)
          }
        }
        break
      case CONNECT_WITH:
        let connection = new this.RTCPeerConnection(this.settings.webRTCOptions)
        connection.onicecandidate = (e) => {
          if (e.candidate !== null) {
            let candidate = {
              candidate: e.candidate.candidate,
              sdpMLineIndex: e.candidate.sdpMLineIndex
            }
            webChannel.topologyService.sendTo(
              msg.intermediaryID,
              webChannel,
              this._msg(WEBRTC_DATA, {
                senderPeerID: webChannel.myID,
                recipientPeerID: msg.key,
                candidate
              })
            )
          }
        }
        let dc = connection.createDataChannel(msg.key)
        dc.onopen = () => {
          if (!Reflect.has(webChannel, 'aboutToJoin')) {
            webChannel.aboutToJoin = new Map()
          }
          webChannel.aboutToJoin.set(dc.label, dc)
          dc.onmessage = this.protocol.onmessage
          dc.peerID = dc.label
          dc.webChannel = webChannel
          webChannel.topologyService.sendTo(
            msg.intermediaryID,
            webChannel,
            this._msg(CONNECT_WITH_SUCCEED, {
              senderPeerID: webChannel.myID,
              recipientPeerID: dc.label
            })
          )
        }
        connection.createOffer((offer) => {
          connection.setLocalDescription(offer, () => {
            webChannel.topologyService.sendTo(
              msg.intermediaryID,
              webChannel,
              this._msg(WEBRTC_DATA, {
                senderPeerID: webChannel.myID,
                recipientPeerID: msg.key,
                sdp: connection.localDescription.toJSON()
              })
            )
            webChannel.connections.set(msg.key, connection)
          }, () => {})
        }, () => {})
        break
      case CONNECT_WITH_SUCCEED:
        webChannel.connectionSucceed(msg.senderPeerID, msg.recipientPeerID)
        break
    }
  }
}

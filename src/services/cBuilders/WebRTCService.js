import * as cBuilder from './channelBuilder'

const CONNECTION_CREATION_TIMEOUT = 2000

/**
 * Service class responsible to establish connections between peers via `RTCDataChannel`.
 * @extends {@link channelBuilder#Interface}
 */
class WebRTCService extends cBuilder.Interface {

  constructor (options = {}) {
    super()
    this.defaults = {
      signaling: 'ws://sigver-coastteam.rhcloud.com:8000',
      iceServers: [
        {urls: 'stun:23.21.150.121'},
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}
      ]
    }
    this.settings = Object.assign({}, this.defaults, options)

    // Declare WebRTCService related global(window) constructors
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

  open (webChannel, onChannel, options = {}) {
    let key = webChannel.id
    let settings = Object.assign({}, this.settings, options)
    // Connection array, because several connections may be establishing
    // at the same time
    let connections = []

    // Connect to the signaling server
    let socket = new window.WebSocket(settings.signaling)

    // Send a message to signaling server: ready to receive offer
    socket.onopen = () => {
      webChannel.webRTCOpen = socket
      socket.send(this.toStr({key}))
    }
    socket.onmessage = (e) => {
      let msg = JSON.parse(e.data)
      if (!Reflect.has(msg, 'id') || !Reflect.has(msg, 'data')) {
        throw new Error('Incorrect message format from the signaling server.')
      }

      // On SDP offer: add connection to the array, prepare answer and send it back
      if (Reflect.has(msg.data, 'offer')) {
        connections[connections.length] = this.createConnectionAndAnswer(
            candidate => socket.send(this.toStr({id: msg.id, data: {candidate}})),
            answer => socket.send(this.toStr({id: msg.id, data: {answer}})),
            onChannel,
            msg.data.offer
          )
      // On Ice Candidate
      } else if (Reflect.has(msg.data, 'candidate')) {
        connections[msg.id].addIceCandidate(this.createCandidate(msg.data.candidate))
      }
    }
    socket.onerror = (e) => {
      throw new Error(`Connection to the signaling server ${settings.signaling} failed: ${e.message}.`)
    }
    socket.onclose = () => { delete webChannel.webRTCOpen }
    return {key, signaling: settings.signaling}
  }

  join (key, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    return new Promise((resolve, reject) => {
      let connection

      // Connect to the signaling server
      let socket = new window.WebSocket(settings.signaling)
      socket.onopen = () => {
        // Prepare and send offer
        connection = this.createConnectionAndOffer(
          candidate => socket.send(this.toStr({data: {candidate}})),
          offer => socket.send(this.toStr({join: key, data: {offer}})),
          channel => resolve(channel),
          key
        )
      }
      socket.onmessage = (e) => {
        let msg = JSON.parse(e.data)

        // Check message format
        if (!Reflect.has(msg, 'data')) { reject() }

        // If received an answer to the previously sent offer
        if (Reflect.has(msg.data, 'answer')) {
          let sd = this.createSDP(msg.data.answer)
          connection.setRemoteDescription(sd, () => {}, reject)
        // If received an Ice candidate
        } else if (Reflect.has(msg.data, 'candidate')) {
          connection.addIceCandidate(this.createCandidate(msg.data.candidate))
        } else { reject() }
      }
      socket.onerror = reject
    })
  }

  connectMeToMany (webChannel, ids) {
    let promises = []
    for (let id of ids) {
      promises.push(this.connectMeToOne(webChannel, id))
    }
    return Promise.all(promises)
  }

  connectMeToOne (webChannel, id) {
    return new Promise((resolve, reject) => {
      let sender = webChannel.myId
      let connection = this.createConnectionAndOffer(
        candidate => webChannel.sendSrvMsg(this.name, id, {sender, candidate}),
        offer => {
          webChannel.connections.set(id, connection)
          webChannel.sendSrvMsg(this.name, id, {sender, offer})
        },
        channel => {
          channel.peerId = id
          resolve(channel)
        },
        id
      )
      setTimeout(reject, CONNECTION_CREATION_TIMEOUT, 'Timeout')
    })
  }

  onMessage (webChannel, msg) {
    let connections = webChannel.connections
    if (Reflect.has(msg, 'offer')) {
      // TODO: add try/catch. On exception remove connection from webChannel.connections
      connections.set(msg.sender,
        this.createConnectionAndAnswer(
          candidate => webChannel.sendSrvMsg(this.name, msg.sender,
            {sender: webChannel.myId, candidate}),
          answer => webChannel.sendSrvMsg(this.name, msg.sender,
            {sender: webChannel.myId, answer}),
          channel => {
            webChannel.initChannel(channel, msg.sender)
            webChannel.connections.delete(channel.peerId)
          },
          msg.offer
        )
      )
      console.log(msg.sender + ' create a NEW CONNECTION')
    } else if (connections.has(msg.sender)) {
      let connection = connections.get(msg.sender)
      if (Reflect.has(msg, 'answer')) {
        let sd = this.createSDP(msg.answer)
        connection.setRemoteDescription(sd, () => {}, () => {})
      } else if (Reflect.has(msg, 'candidate') && connection) {
        connection.addIceCandidate(this.createCandidate(msg.candidate))
      }
    }
  }

  createConnectionAndOffer (candidateCB, sdpCB, channelCB, key) {
    let connection = this.initConnection(candidateCB)
    let dc = connection.createDataChannel(key)
    dc.onopen = () => channelCB(dc)
    connection.createOffer(offer => {
      connection.setLocalDescription(offer, () => {
        sdpCB(connection.localDescription.toJSON())
      }, (err) => { throw new Error(`Could not set local description: ${err}`) })
    }, (err) => { throw new Error(`Could not create offer: ${err}`) })
    return connection
  }

  createConnectionAndAnswer (candidateCB, sdpCB, channelCB, offer) {
    let connection = this.initConnection(candidateCB)
    connection.ondatachannel = e => {
      e.channel.onopen = () => channelCB(e.channel)
    }
    connection.setRemoteDescription(this.createSDP(offer), () => {
      connection.createAnswer(answer => {
        connection.setLocalDescription(answer, () => {
          sdpCB(connection.localDescription.toJSON())
        }, (err) => { throw new Error(`Could not set local description: ${err}`) })
      }, (err) => { throw new Error(`Could not create answer: ${err}`) })
    }, (err) => { throw new Error(`Could not set remote description: ${err}`) })
    return connection
  }

  initConnection (candidateCB) {
    let connection = new this.RTCPeerConnection({iceServers: this.settings.iceServers})
    connection.onicecandidate = (e) => {
      if (e.candidate !== null) {
        let candidate = {
          candidate: e.candidate.candidate,
          sdpMLineIndex: e.candidate.sdpMLineIndex
        }
        candidateCB(candidate)
      }
    }
    return connection
  }

  createCandidate (candidate) {
    return new this.RTCIceCandidate(candidate)
  }

  createSDP (sdp) {
    return Object.assign(new this.RTCSessionDescription(), sdp)
  }

  randomKey () {
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

  toStr (msg) { return JSON.stringify(msg) }
}

export default WebRTCService

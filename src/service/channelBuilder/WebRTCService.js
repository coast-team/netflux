/**
 * @external RTCPeerConnection
 * @see {@link https://developer.mozilla.org/en/docs/Web/API/RTCPeerConnection}
 */
/**
 * @external RTCSessionDescription
 * @see {@link https://developer.mozilla.org/en/docs/Web/API/RTCSessionDescription}
 */
/**
 * @external RTCDataChannel
 * @see {@link https://developer.mozilla.org/en/docs/Web/API/RTCDataChannel}
 */
/**
 * @external RTCIceCandidate
 * @see {@link https://developer.mozilla.org/en/docs/Web/API/RTCIceCandidate}
 */
/**
 * @external RTCPeerConnectionIceEvent
 * @see {@link https://developer.mozilla.org/en/docs/Web/API/RTCPeerConnectionIceEvent}
 */

import * as channelBuilder from './channelBuilder'

/**
 * Ice candidate event handler.
 *
 * @callback WebRTCService~onCandidate
 * @param {external:RTCPeerConnectionIceEvent} evt - Event.
 */

const CONNECTION_CREATION_TIMEOUT = 2000

/**
 * Error which might occur during interaction with signaling server.
 *
 * @extends external:Error
 */
class SignalingError extends Error {
  constructor (msg, evt = null) {
    super(msg)
    this.name = 'SignalingError'
    this.evt = evt
  }
}

/**
 * Service class responsible to establish connections between peers via
 * `RTCDataChannel`.
 *
 * @see {@link external:RTCPeerConnection}
 * @extends module:channelBuilder~Interface
 */
class WebRTCService extends channelBuilder.Interface {

  /**
   * WebRTCService constructor.
   *
   * @param  {Object} [options] - This service options.
   * @param  {Object} [options.signaling='wws://sigver-coastteam.rhcloud.com:8000'] -
   * Signaling server URL.
   * @param  {Object[]} [options.iceServers=[{urls: 'stun:23.21.150.121'},{urls: 'stun:stun.l.google.com:19302'},{urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}]] - WebRTC options to setup which STUN
   * and TURN servers to be used.
   */
  constructor (options = {}) {
    super()
    this.defaults = {
      signaling: 'wws://sigver-coastteam.rhcloud.com:8000',
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
      window.webkitRTCPeerConnection

    this.RTCIceCandidate =
      window.RTCIceCandidate ||
      window.mozRTCIceCandidate ||
      window.RTCIceCandidate

    this.RTCSessionDescription =
      window.RTCSessionDescription ||
      window.mozRTCSessionDescription ||
      window.webkitRTCSessionDescription
  }

  open (webChannel, key, onChannel, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    // Connection array, because several connections may be establishing
    // at the same time
    let connections = []

    try {
      // Connect to the signaling server
      let socket = new window.WebSocket(settings.signaling)

      // Send a message to signaling server: ready to receive offer
      socket.onopen = () => {
        socket.send(JSON.stringify({key}))
      }
      socket.onmessage = (evt) => {
        let msg = JSON.parse(evt.data)
        if (!Reflect.has(msg, 'id') || !Reflect.has(msg, 'data')) {
          // throw new SignalingError(err.name + ': ' + err.message)
          throw new Error('Incorrect message format from the signaling server.')
        }

        // On SDP offer: add connection to the array, prepare answer and send it back
        if (Reflect.has(msg.data, 'offer')) {
          connections[connections.length] = this.createConnectionAndAnswer(
            (candidate) => socket.send(JSON.stringify({id: msg.id, data: {candidate}})),
            (answer) => socket.send(JSON.stringify({id: msg.id, data: {answer}})),
            onChannel,
            msg.data.offer,
            webChannel
          )
        // On Ice Candidate
        } else if (Reflect.has(msg.data, 'candidate')) {
          connections[msg.id].addIceCandidate(this.createCandidate(msg.data.candidate), () => {
          }, (e) => {
            console.error('NETFLUX adding candidate failed: ', e)
          })
        }
      }
      socket.onerror = (evt) => {
        throw new SignalingError(`error occured on the socket with signaling server ${settings.signaling}`)
      }
      socket.onclose = (closeEvt) => {
        // 1000 corresponds to CLOSE_NORMAL: Normal closure; the connection
        // successfully completed whatever purpose for which it was created.
        if (closeEvt.code !== 1000) {
          throw new SignalingError(`connection with signaling server
            ${settings.signaling} has been closed abnormally.
            CloseEvent code: ${closeEvt.code}. Reason: ${closeEvt.reason}`)
        }
      }
      return {key, socket, signaling: settings.signaling}
    } catch (err) {
      throw new SignalingError(err.name + ': ' + err.message)
    }
  }

  join (webChannel, key, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    return new Promise((resolve, reject) => {
      let connection

      // Connect to the signaling server
      let socket = new window.WebSocket(settings.signaling)
      socket.onopen = () => {
        // Prepare and send offer
        connection = this.createConnectionAndOffer(
          (candidate) => socket.send(JSON.stringify({data: {candidate}})),
          (offer) => socket.send(JSON.stringify({join: key, data: {offer}})),
          (channel) => {
            resolve(channel)
          },
          key,
          webChannel
        )
      }
      socket.onmessage = (e) => {
        let msg = JSON.parse(e.data)

        // Check message format
        if (!Reflect.has(msg, 'data')) { reject() }

        // If received an answer to the previously sent offer
        if (Reflect.has(msg.data, 'answer')) {
          let sd = this.createSessionDescription(msg.data.answer)
          connection.setRemoteDescription(sd, () => {
          }, (e) => {
            console.error('NETFLUX adding answer failed: ', e)
            reject()
          })
        // If received an Ice candidate
        } else if (Reflect.has(msg.data, 'candidate')) {
          connection.addIceCandidate(this.createCandidate(msg.data.candidate), () => {
          }, (e) => {
            console.error('NETFLUX adding candidate failed: ', e)
          })
        } else { reject() }
      }
      socket.onerror = (e) => {
        reject(`Signaling server socket error: ${e.message}`)
      }
      socket.onclose = (e) => {
        if (e.code !== 1000) { reject(e.reason) }
      }
    })
  }

  connectMeToMany (webChannel, ids) {
    return new Promise((resolve, reject) => {
      let counter = 0
      let result = {channels: [], failed: []}
      if (ids.length === 0) {
        resolve(result)
      } else {
        for (let id of ids) {
          this.connectMeToOne(webChannel, id)
            .then((channel) => {
              counter++
              result.channels.push(channel)
              if (counter === ids.length) {
                resolve(result)
              }
            })
            .catch((err) => {
              counter++
              result.failed.push({id, err})
              if (counter === ids.length) {
                resolve(result)
              }
            })
        }
      }
    })
  }

  connectMeToOne (webChannel, id) {
    return new Promise((resolve, reject) => {
      let sender = webChannel.myId
      let connection = this.createConnectionAndOffer(
        (candidate) => webChannel.sendSrvMsg(this.name, id, {sender, candidate}),
        (offer) => {
          webChannel.connections.set(id, connection)
          webChannel.sendSrvMsg(this.name, id, {sender, offer})
        },
        (channel) => resolve(channel),
        id,
        webChannel,
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
          (candidate) => webChannel.sendSrvMsg(this.name, msg.sender,
            {sender: webChannel.myId, candidate}),
          (answer) => webChannel.sendSrvMsg(this.name, msg.sender,
            {sender: webChannel.myId, answer}),
          (channel) => {
            webChannel.connections.delete(channel.peerId)
          },
          msg.offer,
          webChannel,
          msg.sender
        )
      )
    } else if (connections.has(msg.sender)) {
      let connection = connections.get(msg.sender)
      if (Reflect.has(msg, 'answer')) {
        let sd = this.createSessionDescription(msg.answer)
        connection.setRemoteDescription(sd, () => {
        }, () => {
        })
      } else if (Reflect.has(msg, 'candidate') && connection) {
        connection.addIceCandidate(this.createCandidate(msg.candidate))
      }
    }
  }

  createConnectionAndOffer (onCandidate, onSDP, onChannel, key, webChannel, id = '') {
    let connection = this.createConnection(onCandidate)
    let dc = connection.createDataChannel(key)
    dc.onopen = () => {
      webChannel.initChannel(dc, id)
      dc.send('ping')
    }
    window.dc = dc
    dc.onmessage = (msgEvt) => {
      if (msgEvt.data === 'pong') {
        dc.connection = connection
        onChannel(dc)
      }
    }
    dc.onerror = (evt) => {
    }
    connection.createOffer((offer) => {
      connection.setLocalDescription(offer, () => {
        onSDP(connection.localDescription.toJSON())
      }, (err) => {
        throw new Error(`Could not set local description: ${err}`)
      })
    }, (err) => {
      throw new Error(`Could not create offer: ${err}`)
    })
    return connection
  }

  createConnectionAndAnswer (onCandidate, onSDP, onChannel, offer, webChannel, id = '') {
    let connection = this.createConnection(onCandidate)
    connection.ondatachannel = (e) => {
      e.channel.onmessage = (msgEvt) => {
        if (msgEvt.data === 'ping') {
          e.channel.connection = connection
          webChannel.initChannel(e.channel, id)
          e.channel.send('pong')
          onChannel(e.channel)
        }
      }
      e.channel.onopen = () => {
      }
    }
    connection.setRemoteDescription(this.createSessionDescription(offer), () => {
      connection.createAnswer((answer) => {
        connection.setLocalDescription(answer, () => {
          onSDP(connection.localDescription.toJSON())
        }, (err) => {
          console.error('NETFLUX: error: ', err)
          throw new Error(`Could not set local description: ${err}`)
        })
      }, (err) => {
        console.error('NETFLUX: error: ', err)
        throw new Error(`Could not create answer: ${err}`)
      })
    }, (err) => {
      console.error('NETFLUX: error: ', err)
      throw new Error(`Could not set remote description: ${err}`)
    })
    return connection
  }

  /**
   * Creates an instance of `RTCPeerConnection` and sets `onicecandidate` event
   * handler.
   *
   * @private
   * @param  {WebRTCService~onCandidate} onCandidate - Ice
   * candidate event handler.
   * @return {external:RTCPeerConnection} - Peer connection.
   */
  createConnection (onCandidate) {
    let connection = new this.RTCPeerConnection({iceServers: this.settings.iceServers})

    connection.onicecandidate = (evt) => {
      if (evt.candidate !== null) {
        let candidate = {
          candidate: evt.candidate.candidate,
          sdpMLineIndex: evt.candidate.sdpMLineIndex
        }
        onCandidate(candidate)
      }
    }
    return connection
  }

  /**
   * Creates an instance of `RTCIceCandidate`.
   *
   * @private
   * @param  {Object} candidate - Candidate object created in
   * {@link WebRTCService#createConnection}.
   * @param {} candidate.candidate
   * @param {} candidate.sdpMLineIndex
   * @return {external:RTCIceCandidate} - Ice candidate.
   */
  createCandidate (candidate) {
    return new this.RTCIceCandidate(candidate)
  }

  /**
   * Creates an instance of `RTCSessionDescription`.
   *
   * @private
   * @param  {Object} sd - An offer or an answer created by WebRTC API.
   * @param  {} sd.type
   * @param  {} sd.sdp
   * @return {external:RTCSessionDescription} - Session description.
   */
  createSessionDescription (sd) {
    return Object.assign(new this.RTCSessionDescription(), sd)
  }
}

export default WebRTCService

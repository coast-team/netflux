import {ChannelBuilderInterface} from './channelBuilder'

/**
 * Ice candidate event handler.
 *
 * @callback WebRTCService~onCandidate
 * @param {external:RTCPeerConnectionIceEvent} evt - Event.
 */

/**
 * Session description event handler.
 *
 * @callback WebRTCService~onSDP
 * @param {external:RTCPeerConnectionIceEvent} evt - Event.
 */

/**
 * Data channel event handler.
 *
 * @callback WebRTCService~onChannel
 * @param {external:RTCPeerConnectionIceEvent} evt - Event.
 */

/**
 * The goal of this class is to prevent the error when adding an ice candidate
 * before the remote description has been set.
 */
class RTCPendingConnections {
  constructor () {
    this.connections = new Map()
  }

  /**
   * Prepares pending connection for the specified peer only if it has not been added already.
   *
   * @param  {string} id - Peer id
   */
  add (id) {
    if (!this.connections.has(id)) {
      let pc = null
      let obj = {promise: null}
      obj.promise = new Promise((resolve, reject) => {
        Object.defineProperty(obj, 'pc', {
          get: () => pc,
          set: (value) => {
            pc = value
            resolve()
          }
        })
        setTimeout(reject, CONNECT_TIMEOUT, 'timeout')
      })
      this.connections.set(id, obj)
    }
  }

  /**
   * Remove a pending connection from the Map. Usually when the connection has already
   * been established and there is now interest to hold this reference.
   *
   * @param  {string} id - Peer id.
   */
  remove (id) {
    this.connections.delete(id)
  }

  /**
   * Returns RTCPeerConnection object for the provided peer id.
   *
   * @param  {string} id - Peer id.
   * @return {external:RTCPeerConnection} - Peer connection.
   */
  getPC (id) {
    return this.connections.get(id).pc
  }

  /**
   * Updates RTCPeerConnection reference for the provided peer id.
   *
   * @param  {string} id - Peer id.
   * @param  {external:RTCPeerConnection} pc - Peer connection.
   */
  setPC (id, pc) {
    this.connections.get(id).pc = pc
  }

  /**
   * When the remote description is set, it will add the ice candidate to the
   * peer connection of specified peer.
   *
   * @param  {string} id - Peer id.
   * @param  {external:RTCIceCandidate} candidate - Ice candidate.
   * @return {Promise} - Resolved once the ice candidate has been succesfully added.
   */
  addIceCandidate (id, candidate) {
    let obj = this.connections.get(id)
    return obj.promise.then(() => {
      return obj.pc.addIceCandidate(candidate)
    })
  }
}

const CONNECT_TIMEOUT = 2000
const connectionsByWC = new Map()

/**
 * Service class responsible to establish connections between peers via
 * `RTCDataChannel`.
 *
 * @see {@link external:RTCPeerConnection}
 * @extends module:channelBuilder~ChannelBuilderInterface
 */
class WebRTCService extends ChannelBuilderInterface {

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
      signaling: 'ws://sigver-coastteam.rhcloud.com:8000',
      iceServers: [
        {urls: 'stun:turn01.uswest.xirsys.com'},
        {urls: 'turn:turn01.uswest.xirsys.com:443?transport=udp', credential: 'ffd2ac3a-280e-11e6-a490-82fbe4816256', username: 'ffd2abae-280e-11e6-b8e6-4969dd337df0'}
      ]
    }
    this.settings = Object.assign({}, this.defaults, options)
  }

  open (key, onChannel, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    return new Promise((resolve, reject) => {
      let connections = new RTCPendingConnections()
      let socket
      try {
        socket = new window.WebSocket(settings.signaling)
      } catch (err) {
        reject(err.message)
      }
      // Send a message to signaling server: ready to receive offer
      socket.onopen = () => {
        try {
          socket.send(JSON.stringify({key}))
        } catch (err) {
          reject(err.message)
        }
        // TODO: find a better solution than setTimeout. This is for the case when the key already exists and thus the server will close the socket, but it will close it after this function resolves the Promise.
        setTimeout(resolve, 100, {key, url: settings.signaling, socket})
      }
      socket.onmessage = (evt) => {
        let msg = JSON.parse(evt.data)
        if (!('id' in msg) || !('data' in msg)) {
          console.log('Unknown message from the signaling server: ' + evt.data)
          socket.close()
          return
        }
        connections.add(msg.id)
        if ('offer' in msg.data) {
          this.createPeerConnectionAndAnswer(
              (candidate) => socket.send(JSON.stringify({id: msg.id, data: {candidate}})),
              (answer) => socket.send(JSON.stringify({id: msg.id, data: {answer}})),
              onChannel,
              msg.data.offer
            ).then((pc) => connections.setPC(msg.id, pc))
            .catch((reason) => {
              console.error(`Answer generation failed: ${reason}`)
            })
        } else if ('candidate' in msg.data) {
          connections.addIceCandidate(
              msg.id,
              this.createIceCandidate(msg.data.candidate)
            ).catch((reason) => {
              console.error(`Adding ice candidate failed: ${reason}`)
            })
        }
      }
      socket.onclose = (closeEvt) => {
        if (closeEvt.code !== 1000) {
          console.error(`Socket with signaling server ${settings.signaling} has been closed with code ${closeEvt.code}: ${closeEvt.reason}`)
          reject(closeEvt.reason)
        }
      }
    })
  }

  join (key, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    return new Promise((resolve, reject) => {
      let pc
      // Connect to the signaling server
      let socket = new WebSocket(settings.signaling)
      socket.onopen = () => {
        // Prepare and send offer
        this.createPeerConnectionAndOffer(
            (candidate) => socket.send(JSON.stringify({data: {candidate}})),
            (offer) => socket.send(JSON.stringify({join: key, data: {offer}})),
            resolve
          )
          .then((peerConnection) => { pc = peerConnection })
          .catch(reject)
      }
      socket.onmessage = (evt) => {
        try {
          let msg = JSON.parse(evt.data)
          console.log('Message from SIGNALING server: ', msg)
          // Check message format
          if (!('data' in msg)) {
            reject(`Unknown message from the signaling server: ${evt.data}`)
          }

          if ('answer' in msg.data) {
            pc.setRemoteDescription(this.createSessionDescription(msg.data.answer))
              .then(() => {
                console.log('Answer has been set: ', msg.data.answer)
              })
              .catch(reject)
          } else if ('candidate' in msg.data) {
            pc.addIceCandidate(this.createIceCandidate(msg.data.candidate))
              .then(() => {
                console.log('Candidate has been added: ', msg.data.candidate)
              })
              .catch((evt) => {
                // This exception does not reject the current Promise, because
                // still the connection may be established even without one or
                // several candidates
                console.error('Adding candidate failed: ', evt)
              })
          } else {
            reject(`Unknown message from the signaling server: ${evt.data}`)
          }
        } catch (err) {
          reject(err.message)
        }
      }
      socket.onerror = (evt) => {
        reject('WebSocket with signaling server error: ' + evt.message)
      }
      socket.onclose = (closeEvt) => {
        if (closeEvt.code !== 1000) {
          reject(`Socket with signaling server ${settings.signaling} has been closed with code ${closeEvt.code}: ${closeEvt.reason}`)
        }
      }
    })
  }

  connectMeTo (wc, id) {
    return new Promise((resolve, reject) => {
      let sender = wc.myId
      let connections = this.getPendingConnections(wc)
      connections.add(id)
      this.createPeerConnectionAndOffer(
        (candidate) => wc.sendSrvMsg(this.name, id, {sender, candidate}),
        (offer) => wc.sendSrvMsg(this.name, id, {sender, offer}),
        (channel) => {
          connections.remove(id)
          resolve(channel)
        }
      ).then((pc) => connections.setPC(id, pc))
      setTimeout(reject, CONNECT_TIMEOUT, 'Timeout')
    })
  }

  onMessage (wc, channel, msg) {
    let connections = this.getPendingConnections(wc)
    connections.add(msg.sender)
    if ('offer' in msg) {
      this.createPeerConnectionAndAnswer(
        (candidate) => wc.sendSrvMsg(this.name, msg.sender,
          {sender: wc.myId, candidate}),
        (answer) => wc.sendSrvMsg(this.name, msg.sender,
          {sender: wc.myId, answer}),
        (channel) => {
          wc.initChannel(channel, false, msg.sender)
          connections.remove(channel.peerId)
        },
        msg.offer
      ).then((pc) => {
        connections.setPC(msg.sender, pc)
      })
    } if ('answer' in msg) {
      connections.getPC(msg.sender)
        .setRemoteDescription(this.createSessionDescription(msg.answer))
        .catch((reason) => { console.error('Setting answer error: ' + reason) })
    } else if ('candidate' in msg) {
      connections.addIceCandidate(msg.sender, this.createIceCandidate(msg.candidate))
        .catch((reason) => { console.error('Setting candidate error: ', reason) })
    }
  }

  /**
   * Creates a peer connection and generates an SDP offer.
   *
   * @param  {WebRTCService~onCandidate} onCandidate - Ice candidate event handler.
   * @param  {WebRTCService~onSDP} sendOffer - Session description event handler.
   * @param  {WebRTCService~onChannel} onChannel - Handler event when the data channel is ready.
   * @return {Promise} - Resolved when the offer has been succesfully created,
   * set as local description and sent to the peer.
   */
  createPeerConnectionAndOffer (onCandidate, sendOffer, onChannel) {
    let pc = this.createPeerConnection(onCandidate)
    let dc = pc.createDataChannel(null)
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected') {
        dc.onclose()
      }
    }
    dc.onopen = (evt) => {
      console.log('Data channel has been opened: ', evt)
      onChannel(dc)
    }
    return pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        sendOffer(pc.localDescription.toJSON())
        return pc
      })
  }

  /**
   * Creates a peer connection and generates an SDP answer.
   *
   * @param  {WebRTCService~onCandidate} onCandidate - Ice candidate event handler.
   * @param  {WebRTCService~onSDP} sendOffer - Session description event handler.
   * @param  {WebRTCService~onChannel} onChannel - Handler event when the data channel is ready.
   * @param  {Object} offer - Offer received from a peer.
   * @return {Promise} - Resolved when the offer has been succesfully created,
   * set as local description and sent to the peer.
   */
  createPeerConnectionAndAnswer (onCandidate, sendAnswer, onChannel, offer) {
    let pc = this.createPeerConnection(onCandidate)
    pc.ondatachannel = (dcEvt) => {
      console.log('ondatachannel: ', dcEvt)
      let dc = dcEvt.channel
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected') {
          dc.onclose()
        }
      }
      dc.onopen = (evt) => {
        console.log('Data channel has been opened: ', evt)
        onChannel(dc)
      }
    }
    return pc.setRemoteDescription(this.createSessionDescription(offer))
      .then(() => {
        console.log('Offer has been set: ', offer)
        return pc.createAnswer()
      })
      .then((answer) => {
        console.log('Local description has been set: ', answer)
        pc.setLocalDescription(answer)
      })
      .then(() => {
        console.log('answer has been sent: ', pc.localDescription.toJSON())
        sendAnswer(pc.localDescription.toJSON())
        return pc
      })
      .catch((reason) => {
        console.error('Set offer, generate answer error: ', reason)
      })
  }

  /**
   * Creates an instance of `RTCPeerConnection` and sets `onicecandidate` event handler.
   *
   * @private
   * @param  {WebRTCService~onCandidate} onCandidate - Ice
   * candidate event handler.
   * @return {external:RTCPeerConnection} - Peer connection.
   */
  createPeerConnection (onCandidate) {
    let pc = new RTCPeerConnection({iceServers: this.settings.iceServers})
    pc.onicecandidate = (evt) => {
      if (evt.candidate !== null) {
        let candidate = {
          candidate: evt.candidate.candidate,
          sdpMLineIndex: evt.candidate.sdpMLineIndex
        }
        onCandidate(candidate)
      }
    }
    return pc
  }

  /**
   * Creates an instance of `RTCIceCandidate`.
   *
   * @private
   * @param  {Object} candidate - Candidate object created in
   * {@link WebRTCService#createPeerConnection}.
   * @param {} candidate.candidate
   * @param {} candidate.sdpMLineIndex
   * @return {external:RTCIceCandidate} - Ice candidate.
   */
  createIceCandidate (candidate) {
    return new RTCIceCandidate(candidate)
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
    return Object.assign(new RTCSessionDescription(), sd)
  }

  getPendingConnections (wc) {
    if (connectionsByWC.has(wc.id)) {
      return connectionsByWC.get(wc.id)
    } else {
      let connections = new RTCPendingConnections()
      connectionsByWC.set(wc.id, connections)
      return connections
    }
  }
}

export default WebRTCService

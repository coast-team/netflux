import {ChannelBuilderInterface} from './channelBuilder'
import {CHANNEL_BUILDER, provide} from './../../serviceProvider'

let WebRTC = {}

let RTCPeerConnection
let RTCIceCandidate
if (typeof window !== 'undefined') {
  RTCPeerConnection = window.RTCPeerConnection
  RTCIceCandidate = window.RTCIceCandidate
} else {
  WebRTC = require('wrtc')
  RTCPeerConnection = WebRTC.RTCPeerConnection
  RTCIceCandidate = WebRTC.RTCIceCandidate
}

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
   * peer connection of the specified peer.
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
   * @param  {Object} [options.signaling='ws://sigver-coastteam.rhcloud.com:8000'] -
   * Signaling server URL.
   * @param  {Object[]} [options.iceServers=[{urls: 'stun:23.21.150.121'},{urls: 'stun:stun.l.google.com:19302'},{urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}]] - WebRTC options to setup which STUN
   * and TURN servers to be used.
   */
  constructor (options = {}) {
    super()
    this.defaults = {
      signaling: 'ws://sigver-coastteam.rhcloud.com:8000',
      iceServers: [
        {urls: 'stun:turn01.uswest.xirsys.com'}
      ]
    }
    this.settings = Object.assign({}, this.defaults, options)
  }

  onMessage (wc, ch, msg) {
    let connections = this.getPendingConnections(wc)
    connections.add(msg.sender)
    if ('offer' in msg) {
      this.createPeerConnectionAndAnswer(
        (candidate) => wc.sendSrvMsg(this.name, msg.sender,
          {sender: wc.myId, candidate}),
        (answer) => wc.sendSrvMsg(this.name, msg.sender,
          {sender: wc.myId, answer}),
        (channel) => {
          let channelBuilderService = provide(CHANNEL_BUILDER)
          channelBuilderService.onChannel(wc, channel, true, msg.sender)
          connections.remove(channel.peerId)
        },
        msg.offer
      ).then((pc) => {
        connections.setPC(msg.sender, pc)
      })
    } if ('answer' in msg) {
      connections.getPC(msg.sender)
        .setRemoteDescription(msg.answer)
        .catch((err) => console.error(`Set answer: ${err.message}`))
    } else if ('candidate' in msg) {
      connections.addIceCandidate(msg.sender, new RTCIceCandidate(msg.candidate))
        .catch((err) => { console.error(`Add ICE candidate: ${err.message}`) })
    }
  }

  // Equivalent connectMeTo(wc, id)
  connectOverWebChannel (wc, id) {
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
      setTimeout(reject, CONNECT_TIMEOUT, 'connectMeTo timeout')
    })
  }

  // Equivalent à open
  listenFromSignaling (ws, onChannel) {
    let connections = new RTCPendingConnections()

    ws.onmessage = (evt) => {
      let msg = JSON.parse(evt.data)
      if (!('id' in msg) || !('data' in msg)) {
        console.error('Unknown message from the signaling server: ', evt.data)
        ws.close()
        return
      }
      connections.add(msg.id)
      if ('offer' in msg.data) {
        this.createPeerConnectionAndAnswer(
            (candidate) => ws.send(JSON.stringify({id: msg.id, data: {candidate}})),
            (answer) => ws.send(JSON.stringify({id: msg.id, data: {answer}})),
            onChannel,
            msg.data.offer
          ).then((pc) => connections.setPC(msg.id, pc))
          .catch((err) => {
            console.error(`Answer generation failed: ${err.message}`)
          })
      } else if ('candidate' in msg.data) {
        connections.addIceCandidate(msg.id, new RTCIceCandidate(msg.data.candidate))
          .catch((err) => {
            console.error(`Adding ice candidate failed: ${err.message}`)
          })
      }
    }
  }

  connectOverSignaling (ws, key, options = {}) {
    return new Promise((resolve, reject) => {
      let pc

      ws.onmessage = (evt) => {
        try {
          let msg = JSON.parse(evt.data)
          // Check message format
          if (!('data' in msg)) {
            reject(`Unknown message from the signaling server: ${evt.data}`)
          }

          if ('answer' in msg.data) {
            pc.setRemoteDescription(msg.data.answer)
              .catch((err) => {
                console.error(`Set answer: ${err.message}`)
                reject(err)
              })
          } else if ('candidate' in msg.data) {
            pc.addIceCandidate(new RTCIceCandidate(msg.data.candidate))
              .catch((evt) => {
                // This exception does not reject the current Promise, because
                // still the connection may be established even without one or
                // several candidates
                console.error(`Add ICE candidate: ${evt.message}`)
              })
          } else {
            reject(`Unknown message from the signaling server: ${evt.data}`)
          }
        } catch (err) {
          reject(err.message)
        }
      }
      this.createPeerConnectionAndOffer(
          (candidate) => ws.send(JSON.stringify({data: {candidate}})),
          (offer) => ws.send(JSON.stringify({join: key, data: {offer}})),
          resolve
        )
        .then((peerConnection) => { pc = peerConnection })
        .catch(reject)
    })
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
        if (typeof window !== 'undefined') {
          dc.onclose(new CloseEvent(pc.iceConnectionState))
        }
      }
    }
    dc.onopen = (evt) => onChannel(dc)
    return pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        let description = JSON.parse(JSON.stringify(pc.localDescription))
        // sendOffer(pc.localDescription.toJSON())
        sendOffer(description)
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
      let dc = dcEvt.channel
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected') {
          if (typeof window !== 'undefined') {
            dc.onclose(new CloseEvent(pc.iceConnectionState))
          }
        }
      }
      dc.onopen = (evt) => onChannel(dc)
    }
    return pc.setRemoteDescription(offer)
      .then(() => pc.createAnswer())
      .then((answer) => pc.setLocalDescription(answer))
      .then(() => {
        // sendAnswer(pc.localDescription.toJSON())
        let description = JSON.parse(JSON.stringify(pc.localDescription))
        sendAnswer(description)
        return pc
      })
      .catch((err) => {
        console.error(`Set offer & generate answer: ${err.message}`)
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
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex
        }
        onCandidate(candidate)
      }
    }
    return pc
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

import 'webrtc-adapter'
import {isBrowser, createCloseEvent} from 'helper'
import ServiceInterface from 'service/ServiceInterface'
import {CHANNEL_BUILDER, provide} from 'serviceProvider'

const CONNECT_TIMEOUT = 30000
const REMOVE_ITEM_TIMEOUT = 5000
let src
let webRTCAvailable = true
if (isBrowser()) {
  src = window
} else {
  try {
    src = require('wrtc')
  } catch (err) {
    src = {}
    webRTCAvailable = false
  }
}
const RTCPeerConnection = src.RTCPeerConnection
const RTCIceCandidate = src.RTCIceCandidate

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
 * Service class responsible to establish connections between peers via
 * `RTCDataChannel`.
 *
 * @see {@link external:RTCPeerConnection}
 * @extends module:channelBuilder~ChannelBuilderInterface
 */
class WebRTCService extends ServiceInterface {

  /**
   * WebRTCService constructor.
   *
   * @param  {Object} [options] - This service options.
   * @param  {Object} [options.signaling='ws://sigver-coastteam.rhcloud.com:8000'] -
   * Signaling server URL.
   * @param  {Object[]} [options.iceServers=[{urls: 'stun:23.21.150.121'},{urls: 'stun:stun.l.google.com:19302'},{urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}]] - WebRTC options to setup which STUN
   * and TURN servers to be used.
   */
  constructor (id, iceServers) {
    super(id)
    this.iceServers = iceServers
  }

  onMessage (channel, senderId, recepientId, msg) {
    let wc = channel.webChannel
    let item = super.getItem(wc, senderId)
    if (!item) {
      item = new CandidatesBuffer()
      super.setItem(wc, senderId, item)
    }
    if ('offer' in msg) {
      item.pc = this.createPeerConnection(candidate => {
        wc.sendInnerTo(senderId, this.id, {candidate})
      })
      this.listenOnDataChannel(item.pc, dataCh => {
        setTimeout(() => super.removeItem(wc, senderId), REMOVE_ITEM_TIMEOUT)
        provide(CHANNEL_BUILDER).onChannel(wc, dataCh, senderId)
      })
      this.createAnswer(item.pc, msg.offer, item.candidates)
        .then(answer => wc.sendInnerTo(senderId, this.id, {answer}))
        .catch(err => console.error(`During Establishing dataChannel connection over webChannel: ${err.message}`))
    } if ('answer' in msg) {
      item.pc.setRemoteDescription(msg.answer)
        .then(() => item.pc.addReceivedCandidates(item.candidates))
        .catch(err => console.error(`Set answer (webChannel): ${err.message}`))
    } else if ('candidate' in msg) {
      this.addIceCandidate(item, msg.candidate)
    }
  }

  connectOverWebChannel (wc, id) {
    let item = new CandidatesBuffer(this.createPeerConnection(candidate => {
      wc.sendInnerTo(id, this.id, {candidate})
    }))
    super.setItem(wc, id, item)
    return new Promise((resolve, reject) => {
      setTimeout(reject, CONNECT_TIMEOUT, 'WebRTC connect timeout')
      this.createDataChannel(item.pc, dataCh => {
        setTimeout(() => super.removeItem(wc, id), REMOVE_ITEM_TIMEOUT)
        resolve(dataCh)
      })
      this.createOffer(item.pc)
        .then(offer => wc.sendInnerTo(id, this.id, {offer}))
        .catch(reject)
    })
  }

  listenFromSignaling (ws, onChannel) {
    ws.onmessage = evt => {
      let msg = JSON.parse(evt.data)
      if ('id' in msg && 'data' in msg) {
        let item = super.getItem(ws, msg.id)
        if (!item) {
          item = new CandidatesBuffer(this.createPeerConnection(candidate => {
            if (ws.readyState === 1) ws.send(JSON.stringify({id: msg.id, data: {candidate}}))
          }))
          super.setItem(ws, msg.id, item)
        }
        if ('offer' in msg.data) {
          this.listenOnDataChannel(item.pc, dataCh => {
            setTimeout(() => super.removeItem(ws, msg.id), REMOVE_ITEM_TIMEOUT)
            onChannel(dataCh)
          })
          this.createAnswer(item.pc, msg.data.offer, item.candidates)
            .then(answer => {
              ws.send(JSON.stringify({id: msg.id, data: {answer}}))
            })
            .catch(err => {
              console.error(`During establishing data channel connection through signaling: ${err.message}`)
            })
        } else if ('candidate' in msg.data) {
          this.addIceCandidate(item, msg.data.candidate)
        }
      }
    }
  }

  connectOverSignaling (ws, key) {
    let item = new CandidatesBuffer(this.createPeerConnection(candidate => {
      if (ws.readyState === 1) ws.send(JSON.stringify({data: {candidate}}))
    }))
    super.setItem(ws, key, item)
    return new Promise((resolve, reject) => {
      ws.onclose = closeEvt => reject(closeEvt.reason)
      ws.onmessage = evt => {
        try {
          let msg = JSON.parse(evt.data)
          if ('data' in msg) {
            if ('answer' in msg.data) {
              item.pc.setRemoteDescription(msg.data.answer)
                .then(() => item.pc.addReceivedCandidates(item.candidates))
                .catch(err => reject(`Set answer (signaling): ${err.message}`))
            } else if ('candidate' in msg.data) {
              this.addIceCandidate(super.getItem(ws, key), msg.data.candidate)
            }
          }
        } catch (err) {
          reject(`Unknown message from the server ${ws.url}: ${evt.data}`)
        }
      }

      this.createDataChannel(item.pc, dataCh => {
        setTimeout(() => super.removeItem(ws, key), REMOVE_ITEM_TIMEOUT)
        resolve(dataCh)
      })
      this.createOffer(item.pc)
        .then(offer => ws.send(JSON.stringify({data: {offer}})))
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
  createOffer (pc) {
    return pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => JSON.parse(JSON.stringify(pc.localDescription)))
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
  createAnswer (pc, offer, candidates) {
    return pc.setRemoteDescription(offer)
      .then(() => {
        pc.addReceivedCandidates(candidates)
        return pc.createAnswer()
      })
      .then(answer => pc.setLocalDescription(answer))
      .then(() => JSON.parse(JSON.stringify(pc.localDescription)))
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
    let pc = new RTCPeerConnection({iceServers: this.iceServers})
    pc.isRemoteDescriptionSet = false
    pc.addReceivedCandidates = candidates => {
      pc.isRemoteDescriptionSet = true
      for (let c of candidates) this.addIceCandidate({pc}, c)
    }
    pc.onicecandidate = evt => {
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

  createDataChannel (pc, onOpen) {
    let dc = pc.createDataChannel(null)
    dc.onopen = evt => onOpen(dc)
    this.setUpOnDisconnect(pc, dc)
  }

  listenOnDataChannel (pc, onOpen) {
    pc.ondatachannel = dcEvt => {
      this.setUpOnDisconnect(pc, dcEvt.channel)
      dcEvt.channel.onopen = evt => onOpen(dcEvt.channel)
    }
  }

  setUpOnDisconnect (pc, dataCh) {
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected') {
        if (dataCh.onclose) dataCh.onclose(createCloseEvent(4201, 'disconnected', false))
      }
    }
  }

  addIceCandidate (obj, candidate) {
    if (obj !== null && obj.pc && obj.pc.isRemoteDescriptionSet) {
      obj.pc.addIceCandidate(new RTCIceCandidate(candidate))
        .catch(evt => console.error(`Add ICE candidate: ${evt.message}`))
    } else obj.candidates[obj.candidates.length] = candidate
  }
}

class CandidatesBuffer {
  constructor (pc = null, candidates = []) {
    this.pc = pc
    this.candidates = candidates
  }
}

export {WebRTCService as default, webRTCAvailable}

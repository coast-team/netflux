import {isBrowser} from 'helper'
import ServiceInterface from 'service/ServiceInterface'
import {CHANNEL_BUILDER, provide} from 'serviceProvider'
import NodeCloseEvent from 'CloseEvent'

const CONNECT_TIMEOUT = 4000
let src
let webRTCAvailable = true
if (isBrowser()) src = window
else {
  try {
    src = require('wrtc')
    src.CloseEvent = NodeCloseEvent
  } catch (err) {
    webRTCAvailable = false
  }
}
const RTCPeerConnection = src.RTCPeerConnection
const RTCIceCandidate = src.RTCIceCandidate
const CloseEvent = src.CloseEvent

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
    if ('offer' in msg) {
      let pc = this.createPeerConnection((candidate) => {
        wc.sendSrvMsg(this.name, msg.sender, {sender: wc.myId, candidate})
      })
      this.addTemp(wc, msg.sender, pc)
      Promise.all([
        this.createDataChannel(pc, false)
          .then((channel) => {
            let channelBuilderService = provide(CHANNEL_BUILDER)
            channelBuilderService.onChannel(wc, channel, true, msg.sender)
            this.deleteTemp(wc, msg.sender)
          }),
        this.createAnswer(pc, msg.offer)
          .then((answer) => wc.sendSrvMsg(this.name, msg.sender, {sender: wc.myId, answer}))
      ]).catch((err) => console.error(`Establish data channel (webChannel): ${err.message}`))
    } if ('answer' in msg) {
      let pc = this.getTemp(wc, msg.sender)
      pc.setRemoteDescription(msg.answer)
        .then(() => pc.addReceivedCandidates())
        .catch((err) => console.error(`Set answer (webChannel): ${err.message}`))
    } else if ('candidate' in msg) {
      this.addIceCandidate(this.getTemp(wc, msg.sender), msg.candidate)
    }
  }

  // Equivalent connectMeTo(wc, id)
  connectOverWebChannel (wc, id) {
    return new Promise((resolve, reject) => {
      setTimeout(reject, CONNECT_TIMEOUT, 'connectMeTo timeout')
      let sender = wc.myId
      let pc = this.createPeerConnection((candidate) => {
        wc.sendSrvMsg(this.name, id, {sender, candidate})
      })
      this.addTemp(wc, id, pc)
      this.createDataChannel(pc, true)
        .then((channel) => {
          this.deleteTemp(wc, id)
          resolve(channel)
        })
        .catch(reject)
      this.createOffer(pc)
        .then((offer) => wc.sendSrvMsg(this.name, id, {sender, offer}))
        .catch(reject)
    })
  }

  // Equivalent à open
  listenFromSignaling (ws, onChannel) {
    let connections = new Map()

    ws.onmessage = (evt) => {
      let msg = JSON.parse(evt.data)

      if ('id' in msg && 'data' in msg) {
        let pc
        if (connections.has(msg.id)) pc = connections.get(msg.id)
        else {
          pc = this.createPeerConnection((candidate) => {
            if (ws.readyState === 1) ws.send(JSON.stringify({id: msg.id, data: {candidate}}))
          })
          connections.set(msg.id, pc)
        }
        if ('offer' in msg.data) {
          Promise.all([
            this.createDataChannel(pc, false).then((channel) => {
              connections.delete(msg.id)
              onChannel(channel)
            }),
            this.createAnswer(pc, msg.data.offer)
              .then((answer) => ws.send(JSON.stringify({id: msg.id, data: {answer}})))
          ]).catch((err) => {
            console.error(`Establish data channel through signaling: ${err.message}`)
          })
        } else if ('candidate' in msg.data) {
          this.addIceCandidate(pc, msg.data.candidate)
        }
      }
    }
  }

  connectOverSignaling (ws, key, options = {}) {
    let pc = this.createPeerConnection((candidate) => {
      if (ws.readyState === 1) ws.send(JSON.stringify({data: {candidate}}))
    })
    return Promise.race([
      new Promise((resolve, reject) => {
        ws.onclose = (closeEvt) => reject(closeEvt.reason)
        ws.onmessage = (evt) => {
          let msg
          try {
            msg = JSON.parse(evt.data)
          } catch (err) {
            console.error(`Unsupported message type from the signaling server: ${evt.data}`)
          }

          if ('data' in msg) {
            if ('answer' in msg.data) {
              pc.setRemoteDescription(msg.data.answer)
                .then(() => pc.addReceivedCandidates())
                .catch((err) => {
                  console.error(`Set answer (signaling): ${err.message}`)
                  reject(err)
                })
            } else if ('candidate' in msg.data) {
              this.addIceCandidate(pc, msg.data.candidate)
            }
          } else if ('isKeyOk' in msg) {
            if (msg.isKeyOk) {
              this.createOffer(pc)
                .then(offer => ws.send(JSON.stringify({data: {offer}})))
                .catch(reject)
            } else reject('Provided key is not available')
          } else reject(`Unknown message from the signaling server: ${evt.data}`)
        }
        ws.send(JSON.stringify({join: key}))
      }),
      this.createDataChannel(pc, true)
    ])
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
      .then((offer) => pc.setLocalDescription(offer))
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
  createAnswer (pc, offer) {
    return pc.setRemoteDescription(offer)
      .then(() => {
        pc.addReceivedCandidates()
        return pc.createAnswer()
      })
      .then((answer) => pc.setLocalDescription(answer))
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
    let pc = new RTCPeerConnection({iceServers: this.settings.iceServers})
    pc.isRemoteDescriptionSet = false
    pc.candidates = []
    pc.addReceivedCandidates = () => {
      pc.isRemoteDescriptionSet = true
      for (let c of pc.candidates) this.addIceCandidate(pc, c)
    }
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

  createDataChannel (pc, isInitiator) {
    return new Promise((resolve, reject) => {
      let dc
      if (isInitiator) {
        dc = pc.createDataChannel(null)
        dc.onopen = (evt) => resolve(dc)
      } else {
        pc.ondatachannel = (dcEvt) => {
          dc = dcEvt.channel
          dcEvt.channel.onopen = (evt) => resolve(dc)
        }
      }
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected') {
          if (dc.onclose) dc.onclose(new CloseEvent(pc.iceConnectionState))
        }
      }
    })
  }

  addIceCandidate (pc, candidate) {
    if (pc.isRemoteDescriptionSet) {
      pc.addIceCandidate(new RTCIceCandidate(candidate))
        .catch((evt) => console.error(`Add ICE candidate: ${evt.message}`))
    } else pc.candidates.push(candidate)
  }
}

export {WebRTCService as default, webRTCAvailable}

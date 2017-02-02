import 'webrtc-adapter'
import Util from 'Util'
import Service from 'service/Service'
import ServiceFactory, {CHANNEL_BUILDER} from 'ServiceFactory'
const wrtc = Util.requireLib(Util.WEB_RTC_LIB)
const CloseEvent = Util.requireLib(Util.CLOSE_EVENT)

const CONNECT_TIMEOUT = 30000
const REMOVE_ITEM_TIMEOUT = 5000

/**
 * Service class responsible to establish connections between peers via
 * `RTCDataChannel`.
 *
 */
class WebRTCService extends Service {

  /**
   * @param  {number} id Service identifier
   * @param  {RTCIceServer} iceServers WebRTC configuration object
   */
  constructor (id, iceServers) {
    super(id)
    /**
     * @private
     * @type {RTCIceServer}
     */
    this.iceServers = iceServers
  }

  /**
   * @param {Channel} channel
   * @param {number} senderId
   * @param {number} recepientId
   * @param {Object} msg
   */
  onMessage (channel, senderId, recepientId, msg) {
    const wc = channel.webChannel
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
        ServiceFactory.get(CHANNEL_BUILDER).onChannel(wc, dataCh, senderId)
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

  /**
   * Establishes an `RTCDataChannel` with a peer identified by `id` trough `WebChannel`.
   *
   * @param {WebChannel} wc
   * @param {number} id
   *
   * @returns {Promise<RTCDataChannel, string>}
   */
  connectOverWebChannel (wc, id) {
    const item = new CandidatesBuffer(this.createPeerConnection(candidate => {
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

  /**
   *
   * @param {WebSocket} ws
   * @param {function(channel: RTCDataChannel)} onChannel
   *
   */
  listenFromSignaling (ws, onChannel) {
    ws.onmessage = evt => {
      const msg = JSON.parse(evt.data)
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

  /**
   *
   * @param {type} ws
   * @param {type} key Description
   *
   * @returns {type} Description
   */
  connectOverSignaling (ws, key) {
    const item = new CandidatesBuffer(this.createPeerConnection(candidate => {
      if (ws.readyState === 1) ws.send(JSON.stringify({data: {candidate}}))
    }))
    super.setItem(ws, key, item)
    return new Promise((resolve, reject) => {
      ws.onclose = closeEvt => reject(closeEvt.reason)
      ws.onmessage = evt => {
        try {
          const msg = JSON.parse(evt.data)
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
   * Creates an SDP offer.
   *
   * @private
   * @param  {RTCPeerConnection} pc
   * @return {Promise<RTCSessionDescription, string>} - Resolved when the offer has been succesfully created,
   * set as local description and sent to the peer.
   */
  createOffer (pc) {
    return pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        return {
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp
        }
      })
  }

  /**
   * Creates an SDP answer.
   *
   * @private
   * @param {RTCPeerConnection} pc
   * @param {string} offer
   * @param {string[]} candidates
   * @return {Promise<RTCSessionDescription, string>} - Resolved when the offer
   *  has been succesfully created, set as local description and sent to the peer.
   */
  createAnswer (pc, offer, candidates) {
    return pc.setRemoteDescription(offer)
      .then(() => {
        pc.addReceivedCandidates(candidates)
        return pc.createAnswer()
      })
      .then(answer => pc.setLocalDescription(answer))
      .then(() => {
        return {
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp
        }
      })
  }

  /**
   * Creates an instance of `RTCPeerConnection` and sets `onicecandidate` event handler.
   *
   * @private
   * @param  {function(candidate: Object)} onCandidate
   * candidate event handler.
   * @return {RTCPeerConnection}
   */
  createPeerConnection (onCandidate) {
    const pc = new wrtc.RTCPeerConnection({iceServers: this.iceServers})
    pc.isRemoteDescriptionSet = false
    pc.addReceivedCandidates = candidates => {
      pc.isRemoteDescriptionSet = true
      for (let c of candidates) this.addIceCandidate({pc}, c)
    }
    pc.onicecandidate = evt => {
      if (evt.candidate !== null) {
        const candidate = {
          candidate: evt.candidate.candidate,
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex
        }
        onCandidate(candidate)
      }
    }
    return pc
  }

  /**
   *
   * @private
   * @param {RTCPeerConnection} pc
   * @param {function(dc: RTCDataChannel)} onOpen
   *
   */
  createDataChannel (pc, onOpen) {
    const dc = pc.createDataChannel(null)
    dc.onopen = evt => onOpen(dc)
    this.setUpOnDisconnect(pc, dc)
  }

  /**
   *
   * @private
   * @param {RTCPeerConnection} pc
   * @param {function(dc: RTCDataChannel)} onOpen
   *
   */
  listenOnDataChannel (pc, onOpen) {
    pc.ondatachannel = dcEvt => {
      this.setUpOnDisconnect(pc, dcEvt.channel)
      dcEvt.channel.onopen = evt => onOpen(dcEvt.channel)
    }
  }

  /**
   * @private
   * @param {RTCPeerConnection} pc
   * @param {RTCDataChannel} dataCh
   */
  setUpOnDisconnect (pc, dataCh) {
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected') {
        if (dataCh.onclose) {
          dataCh.onclose(new CloseEvent('disconnect', {
            code: 4201,
            reason: 'disconnected'
          }))
        }
      }
    }
  }

  /**
   * @private
   * @param {CandidatesBuffer|null} obj
   * @param {string} candidate
   */
  addIceCandidate (obj, candidate) {
    if (obj !== null && obj.pc && obj.pc.isRemoteDescriptionSet) {
      obj.pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate))
        .catch(evt => console.error(`Add ICE candidate: ${evt.message}`))
    } else obj.candidates[obj.candidates.length] = candidate
  }
}

/**
 * @private
 */
class CandidatesBuffer {
  constructor (pc = null, candidates = []) {
    this.pc = pc
    this.candidates = candidates
  }
}

export default WebRTCService

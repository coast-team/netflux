import '../../webrtc-adapter'
import Util from 'Util'
import Service from 'service/Service'
import { ReplaySubject } from 'node_modules/rxjs/BehaviorSubject'
import { Observable } from 'node_modules/rxjs/Observable'
import { serviceMessageStream } from 'Symbols'
const wrtc = Util.require(Util.WEB_RTC)
const CloseEvent = Util.require(Util.CLOSE_EVENT)

const CONNECTION_TIMEOUT = 5000

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
    // This method is replaced by onChannelFromWebChannel. Remove this method later
  }

  onChannelFromWebChannel (wc) {
    return this.listenOnDataChannel(
      wc[serviceMessageStream]
        .filter(msg => msg.service === this.id)
        .map(msg => ({msg: msg.msg, id: msg.sender})),
      (msg, id) => wc.sendInnerTo(id, this.id, msg)
    )
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
    return this.establishDataChannel(
      wc[serviceMessageStream]
        .filter(msg => msg.service === this.id && msg.sender === id)
        .map(msg => msg.msg),
      msg => wc.sendInnerTo(id, this.id, msg),
      wc.myId
    )
  }

  /**
   *
   * @param {WebSocket} ws
   * @param {function(channel: RTCDataChannel)} onChannel
   *
   */
  onChannelFromSignaling (stream) {
    return this.listenOnDataChannel(
      stream
        .filter(msg => 'id' in msg && 'data' in msg)
        .map(msg => ({msg: msg.data, id: msg.id})),
      (msg, id) => stream.send(JSON.stringify({id, data: msg}))
    )
  }

  /**
   *
   * @param {type} ws
   * @param {type} key Description
   *
   * @returns {type} Description
   */
  connectOverSignaling (stream) {
    return this.establishDataChannel(
      stream.filter(msg => 'data' in msg).map(msg => msg.data),
      msg => stream.send(JSON.stringify(msg))
    )
  }

  establishDataChannel (stream, send, label = null) {
    const pc = this.createPeerConnection()
    const remoteCandidateStream = new ReplaySubject()
    this.createLocalCandidateStream(pc).subscribe(
      candidate => send({candidate}),
      err => console.warn(err),
      () => send({candidate: ''})
    )

    return new Promise((resolve, reject) => {
      const subs = stream.subscribe(
        msg => {
          if ('answer' in msg) {
            pc.setRemoteDescription(msg.answer)
              .then(() => {
                remoteCandidateStream.subscribe(
                  candidate => {
                    pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate))
                      .catch(reject)
                  },
                  err => console.warn(err),
                  () => subs.unsubscribe()
                )
              })
              .catch(reject)
          } else if ('candidate' in msg) {
            if (msg.candidate !== '') {
              remoteCandidateStream.next(msg.candidate)
            } else {
              remoteCandidateStream.complete()
            }
          }
        },
        reject,
        () => reject(new Error('Failed to establish RTCDataChannel: the connection with Signaling server was closed'))
      )

      this.waitForDataChannelOpen(pc, true, label)
        .then(resolve)
        .catch(reject)

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => send({offer: {
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp
        }}))
        .catch(reject)
    })
  }

  listenOnDataChannel (stream, send) {
    return Observable.create(observer => {
      const clients = new Map()
      stream.subscribe(
        ({msg, id}) => {
          let client = clients.get(id)
          let pc
          let remoteCandidateStream
          if (client) {
            [pc, remoteCandidateStream] = client
          } else {
            pc = this.createPeerConnection()
            remoteCandidateStream = new ReplaySubject()
            this.createLocalCandidateStream(pc).subscribe(
              candidate => send({candidate}, id),
              err => console.warn(err),
              () => send({candidate: ''}, id)
            )
            clients.set(id, [pc, remoteCandidateStream])
          }
          if ('offer' in msg) {
            this.waitForDataChannelOpen(pc, false)
              .then(dc => observer.next(dc))
              .catch(err => {
                clients.delete(id)
                console.warn(`Client "${id}" failed to establish RTCDataChannel with you: ${err.message}`)
              })
            pc.setRemoteDescription(msg.offer)
              .then(() => remoteCandidateStream.subscribe(
                  candidate => {
                    pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate))
                      .catch(err => console.warn(err))
                  },
                  err => console.warn(err),
                  () => clients.delete(id)
                )
              )
              .then(() => pc.createAnswer())
              .then(answer => pc.setLocalDescription(answer))
              .then(() => send({answer: {
                type: pc.localDescription.type,
                sdp: pc.localDescription.sdp
              }}, id))
              .catch(err => {
                clients.delete(id)
                console.warn(err)
              })
          } else if ('candidate' in msg) {
            if (msg.candidate !== '') {
              remoteCandidateStream.next(msg.candidate)
            } else {
              remoteCandidateStream.complete()
            }
          }
        },
        err => observer.error(err),
        () => observer.complete()
      )
    })
  }

  createPeerConnection () {
    return new wrtc.RTCPeerConnection({iceServers: this.iceServers})
  }

  /**
   * Creates an instance of `RTCPeerConnection` and sets `onicecandidate` event handler.
   *
   * @private
   * @param  {function(candidate: Object)} onCandidate
   * candidate event handler.
   * @return {RTCPeerConnection}
   */
  createLocalCandidateStream (pc) {
    return Observable.create(observer => {
      pc.onicecandidate = evt => {
        if (evt.candidate !== null) {
          observer.next({
            candidate: evt.candidate.candidate,
            sdpMid: evt.candidate.sdpMid,
            sdpMLineIndex: evt.candidate.sdpMLineIndex
          })
        } else {
          observer.complete()
        }
      }
    })
  }

  waitForDataChannelOpen (pc, offerCreator, label = null) {
    if (offerCreator) {
      let dc
      try {
        dc = pc.createDataChannel(label)
        this.configOnDisconnect(pc, dc)
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`${CONNECTION_TIMEOUT}ms timeout`))
          }, CONNECTION_TIMEOUT)
          dc.onopen = evt => {
            clearTimeout(timeout)
            resolve(dc)
          }
        })
      } catch (err) {
        return Promise.reject(err)
      }
    } else {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`${CONNECTION_TIMEOUT}ms timeout`))
        }, CONNECTION_TIMEOUT)
        pc.ondatachannel = dcEvt => {
          this.configOnDisconnect(pc, dcEvt.channel)
          dcEvt.channel.onopen = evt => {
            clearTimeout(timeout)
            resolve(dcEvt.channel)
          }
        }
      })
    }
  }

  /**
   * @private
   * @param {RTCPeerConnection} pc
   * @param {RTCDataChannel} dataCh
   */
  configOnDisconnect (pc, dc) {
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' && dc.onclose) {
        dc.onclose(new CloseEvent('disconnect', {
          code: 4201,
          reason: 'disconnected'
        }))
      }
    }
  }
}

export default WebRTCService

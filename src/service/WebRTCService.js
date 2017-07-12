import '../../node_modules/webrtc-adapter/out/adapter_no_edge_no_global'
import { ReplaySubject } from 'node_modules/rxjs/ReplaySubject'
import { Observable } from 'node_modules/rxjs/Observable'
import 'node_modules/rxjs/add/operator/map'

import { Util } from 'Util'
import { InnerMessageMixin } from 'service/InnerMessageMixin'
import { webRTC } from 'Protobuf.js'
const wrtc = Util.require(Util.WEB_RTC)
const CloseEvent = Util.require(Util.CLOSE_EVENT)

const ID = 0

const CONNECTION_TIMEOUT = 10000

/**
 * Service class responsible to establish `RTCDataChannel` between two clients via
 * signaling server or `WebChannel`.
 *
 */
export class WebRTCService extends InnerMessageMixin {
  constructor (wc, iceServers) {
    super(ID, webRTC.Message, wc._msgStream)
    this.wc = wc
    this.rtcConfiguration = { iceServers }
  }

  static get isSupported () {
    return wrtc !== undefined
  }

  channelsFromWebChannel () {
    if (WebRTCService.isSupported) {
      return this._channels(
        this.innerStream.map(({ msg, senderId }) => ({ offer: msg.offer, id: senderId, candidate: msg.candidate })),
        (msg, id) => this.wc._sendTo({ recipientId: id, content: super.encode(msg) })
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough `WebChannel`.
   * Starts by sending an **SDP offer**.
   *
   * @param {number} id Peer id
   *
   * @returns {Promise<RTCDataChannel>} Data channel between you and `id` peer
   */
  connectOverWebChannel (id) {
    if (WebRTCService.isSupported) {
      return this._establishChannel(
        this.innerStream
          .filter(({ senderId }) => senderId === id)
          .map(({ msg }) => ({ answer: msg.answer, candidate: msg.candidate })),
        msg => this.wc._sendTo({ recipientId: id, content: super.encode(msg) }),
        id
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * Listen on `RTCDataChannel` from Signaling server. Starts to listen on **SDP answer**.
   *
   * @param {Subject} signalingStream Specific to Netflux RxJs Subject connection with Signaling server
   *
   * @returns {Observable<RTCDataChannel>} Observable emitting `RTCDataChannel`. Can emit errors and completes when the stream with Signaling server has completed.
   */
  channelsFromSignaling (signalingStream) {
    if (WebRTCService.isSupported) {
      return this._channels(
        signalingStream.filter(msg => 'id' in msg && 'data' in msg)
          .map(({ data, id }) => ({ offer: data.offer, id, candidate: data.candidate })),
        (msg, id) => signalingStream.send(JSON.stringify({id, data: msg}))
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough Signaling server.
   * Starts by sending an **SDP offer**.
   *
   * @param {Subject} signalingStream Specific to Netflux RxJs Subject connection with Signaling server
   *
   * @returns {Promise<RTCDataChannel>} Data channel between you and `id` peer
   */
  connectOverSignaling (signalingStream) {
    if (WebRTCService.isSupported) {
      return this._establishChannel(
        signalingStream.filter(msg => 'data' in msg)
          .map(({ data }) => ({ answer: data.answer, candidate: data.candidate })),
        msg => signalingStream.send(JSON.stringify({data: msg}))
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * @private
   * @param  {Subject} stream
   * @param  {function(msg: Object): void} send
   * @param  {string} [peerId]
   * @return {Promise<RTCDataChannel>}
   */
  _establishChannel (stream, send, peerId = 1) {
    const pc = new wrtc.RTCPeerConnection(this.rtcConfiguration)
    const remoteCandidateStream = new ReplaySubject()
    this._localCandidates(pc).subscribe(
      candidate => send({ candidate }),
      err => console.warn(err),
      () => send({})
    )

    return new Promise((resolve, reject) => {
      const subs = stream.subscribe(
        ({ answer, candidate }) => {
          if (answer) {
            pc.setRemoteDescription({ type: 'answer', sdp: answer })
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
          } else if (candidate) {
            remoteCandidateStream.next(candidate)
          } else {
            remoteCandidateStream.complete()
          }
        },
        reject,
        () => reject(new Error('Failed to establish RTCDataChannel: the connection with Signaling server was closed'))
      )

      this._openChannel(pc, true, peerId)
        .then(resolve)
        .catch(reject)

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => send({offer: pc.localDescription.sdp}))
        .catch(reject)
    })
  }

  /**
   * @private
   * @param  {Subject} stream
   * @param  {function(msg: Object, id: number): void} send
   * @param  {functioin} initFunc
   * @param  {RTCConfiguration} rtcConfiguration
   * @return {Observable<Channel>}
   */
  _channels (stream, send) {
    return Observable.create(observer => {
      const clients = new Map()
      stream.subscribe(
        ({ offer, candidate, id }) => {
          let client = clients.get(id)
          let pc
          let remoteCandidateStream
          if (client) {
            [pc, remoteCandidateStream] = client
          } else {
            pc = new wrtc.RTCPeerConnection(this.rtcConfiguration)
            remoteCandidateStream = new ReplaySubject()
            this._localCandidates(pc).subscribe(
              candidate => send({candidate}, id),
              err => console.warn(err),
              () => send({}, id)
            )
            clients.set(id, [pc, remoteCandidateStream])
          }
          if (offer) {
            this._openChannel(pc, false)
              .then(ch => observer.next(ch))
              .catch(err => {
                clients.delete(id)
                console.error(`Client "${id}" failed to establish RTCDataChannel with you: ${err.message}`)
              })
            pc.setRemoteDescription({ type: 'offer', sdp: offer })
              .then(() => remoteCandidateStream.subscribe(
                candidate => {
                  pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate))
                    .catch(err => console.warn(err))
                },
                err => console.warn(err),
                () => clients.delete(id)
              ))
              .then(() => pc.createAnswer())
              .then(answer => pc.setLocalDescription(answer))
              .then(() => send({answer: pc.localDescription.sdp}, id))
              .catch(err => {
                clients.delete(id)
                console.error(err)
              })
          } else if (candidate) {
            remoteCandidateStream.next(candidate)
          } else {
            remoteCandidateStream.complete()
          }
        },
        err => observer.error(err),
        () => observer.complete()
      )
    })
  }

  /**
   * @private
   * @param  {RTCPeerConnection} pc
   * @return {Observable<{candidate: string, sdpMid: string, sdpMLineIndex: string}>}
   */
  _localCandidates (pc) {
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

  /**
   * @private
   * @param  {RTCPeerConnection} pc
   * @param  {boolean} offerCreator
   * @param  {string} [peerId='']
   * @return {Promise<RTCDataChannel>}
   */
  _openChannel (pc, offerCreator, peerId) {
    if (offerCreator) {
      try {
        const dc = pc.createDataChannel(this.wc.myId)

        // Initialize dataChannel for WebChannel
        const channel = this.wc._initConnection(dc, peerId)

        // Configure disconnection
        this._configOnDisconnect(pc, dc)
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`${CONNECTION_TIMEOUT}ms timeout`))
          }, CONNECTION_TIMEOUT)
          dc.onopen = () => {
            clearTimeout(timeout)
            resolve(channel)
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
          // Configure disconnection
          this._configOnDisconnect(pc, dcEvt.channel)
          dcEvt.channel.onopen = evt => {
            clearTimeout(timeout)

            // Initialize dataChannel for WebChannel
            resolve(this.wc._initConnection(dcEvt.channel, Number(dcEvt.channel.label)))
          }
        }
      })
    }
  }

  /**
   * @private
   * @param {RTCPeerConnection} pc
   * @param {RTCDataChannel} dc
   */
  _configOnDisconnect (pc, dc) {
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

import '../../node_modules/webrtc-adapter/out/adapter_no_edge_no_global'
import { ReplaySubject } from 'node_modules/rxjs/ReplaySubject'
import { Observable } from 'node_modules/rxjs/Observable'
import 'node_modules/rxjs/add/operator/map'

import { Util } from 'Util'
import { Service } from 'service/Service'
import { webRTCBuilder } from 'Protobuf.js'
import { Channel } from 'Channel'
const wrtc = Util.require(Util.WEB_RTC)
const CloseEvent = Util.require(Util.CLOSE_EVENT)

const ID = 0

const CONNECTION_TIMEOUT = 10000

/**
 * Service class responsible to establish `RTCDataChannel` between two clients via
 * signaling server or `WebChannel`.
 *
 */
export class WebRTCBuilder extends Service {
  constructor (wc, iceServers) {
    super(ID, webRTCBuilder.Message, wc._svcMsgStream)
    this.wc = wc
    this.rtcConfiguration = { iceServers }
  }

  static get isSupported () {
    return wrtc !== undefined
  }

  channelsFromWebChannel () {
    if (WebRTCBuilder.isSupported) {
      return this._channels(
        this.svcMsgStream.map(({ msg, senderId }) => ({ offer: msg.offer, id: senderId, candidate: msg.candidate })),
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
    if (WebRTCBuilder.isSupported) {
      return this._establishChannel(
        this.svcMsgStream
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
   * @param {Subject} signaling Specific to Netflux RxJs Subject connection with Signaling server
   *
   * @returns {Observable<RTCDataChannel>} Observable emitting `RTCDataChannel`. Can emit errors and completes when the stream with Signaling server has completed.
   */
  channelsFromSignaling (signaling) {
    if (WebRTCBuilder.isSupported) {
      return this._channels(
        signaling.stream.filter(msg => msg.id !== 0)
          .map(msg => {
            const data = super.decode(msg.data)
            return Object.assign(data, { id: msg.id })
          }),
        (msg, id) => {
          const bytes = webRTCBuilder.Message
            .encode(webRTCBuilder.Message.create(msg))
            .finish()
          signaling.send({ id, data: bytes })
        }
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough Signaling server.
   * Starts by sending an **SDP offer**.
   *
   * @param {Subject} signaling Specific to Netflux RxJs Subject connection with Signaling server
   *
   * @returns {Promise<RTCDataChannel>} Data channel between you and `id` peer
   */
  connectOverSignaling (signaling) {
    if (WebRTCBuilder.isSupported) {
      return this._establishChannel(
        signaling.stream.filter(msg => msg.id === 0)
          .map(msg => super.decode(msg.data)),
        msg => {
          const bytes = webRTCBuilder.Message
            .encode(webRTCBuilder.Message.create(msg))
            .finish()
          signaling.send({ data: bytes })
        }
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
      () => send({ isEnd: true })
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
        .then(() => send({ offer: pc.localDescription.sdp }))
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
              candidate => send({ candidate }, id),
              err => console.warn(err),
              () => send({ isEnd: true }, id)
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
              .then(() => send({ answer: pc.localDescription.sdp }, id))
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
        const channel = new Channel(dc, this.wc, peerId)

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
            resolve(new Channel(dcEvt.channel, this.wc, Number(dcEvt.channel.label)))
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

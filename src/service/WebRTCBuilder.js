import { ReplaySubject } from 'rxjs/ReplaySubject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'

import { Service } from './Service'
import { webRTCBuilder } from '../Protobuf'
import { Channel } from '../Channel'
import { WebRTC, CloseEvent } from '../polyfills'

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
    this.clients = new Map()
  }

  static get isSupported () {
    return WebRTC !== undefined
  }

  channelsFromWebChannel () {
    if (WebRTCBuilder.isSupported) {
      return this._channels(
        this.svcMsgStream
          .filter(({ msg }) => msg.isInitiator)
          .map(({ msg, senderId }) => {
            msg.id = senderId
            return msg
          }),
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
          .filter(({ msg, senderId }) => senderId === id && !msg.isInitiator)
          .map(({ msg }) => ({ answer: msg.answer, iceCandidate: msg.iceCandidate })),
        msg => {
          msg.isInitiator = true
          this.wc._sendTo({ recipientId: id, content: super.encode(msg) })
        },
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
        signaling.stream.filter(({ id }) => id !== 0)
          .map(msg => {
            if (msg.type === 'data') {
              const completeData = super.decode(msg.data)
              completeData.id = msg.id
              return completeData
            } else {
              return { isError: true }
            }
          }),
        (msg, id) => {
          const bytes = webRTCBuilder.Message
            .encode(webRTCBuilder.Message.create(msg))
            .finish()
          const isEnd = msg.iceCandidate !== undefined && msg.iceCandidate.candidate !== ''
          signaling.send({ id, isEnd, data: bytes })
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
        signaling.stream.filter(({ id }) => id === 0)
          .map(msg => {
            return msg.type === 'data' ? super.decode(msg.data) : { isError: true }
          }),
        msg => {
          const bytes = webRTCBuilder.Message
            .encode(webRTCBuilder.Message.create(msg))
            .finish()
          const isEnd = msg.iceCandidate !== undefined && msg.iceCandidate.candidate !== ''
          signaling.send({ isEnd, data: bytes })
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
    const pc = new WebRTC.RTCPeerConnection(this.rtcConfiguration)
    const remoteCandidateStream = new ReplaySubject()
    this._localCandidates(pc).subscribe(
      iceCandidate => send({ iceCandidate }),
      err => console.warn(err),
      () => send({ iceCandidate: { candidate: '' } })
    )

    return new Promise((resolve, reject) => {
      const subs = stream.subscribe(
        ({ answer, iceCandidate, isError }) => {
          if (answer) {
            pc.setRemoteDescription({ type: 'answer', sdp: answer })
              .then(() => {
                remoteCandidateStream.subscribe(
                  iceCandidate => {
                    pc.addIceCandidate(new WebRTC.RTCIceCandidate(iceCandidate))
                      .catch(reject)
                  },
                  err => console.warn(err),
                  () => subs.unsubscribe()
                )
              })
              .catch(reject)
          } else if (iceCandidate) {
            if (iceCandidate.candidate !== '') {
              remoteCandidateStream.next(iceCandidate)
            } else {
              remoteCandidateStream.complete()
            }
          } else if (isError) {
            reject(new Error('Remote peer no longer available via Signaling'))
          } else {
            console.log('Unknown message from a remote peer', {answer, iceCandidate, isError})
            reject(new Error('Unknown message from a remote peer', {answer, iceCandidate, isError}))
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
      stream.subscribe(
        ({ offer, iceCandidate, id, isError }) => {
          const client = this.clients.get(id)
          let pc
          let remoteCandidateStream
          if (client) {
            [pc, remoteCandidateStream] = client
          } else {
            pc = new WebRTC.RTCPeerConnection(this.rtcConfiguration)
            remoteCandidateStream = new ReplaySubject()
            this._localCandidates(pc).subscribe(
              iceCandidate => send({ iceCandidate }, id),
              err => console.warn(err),
              () => send({ iceCandidate: { candidate: '' } }, id)
            )
            this.clients.set(id, [pc, remoteCandidateStream])
          }
          if (offer) {
            this._openChannel(pc, false)
              .then(ch => observer.next(ch))
              .catch(err => {
                this.clients.delete(id)
                console.error(`Client "${id}" failed to establish RTCDataChannel with you: ${err.message}`)
              })
            pc.setRemoteDescription({ type: 'offer', sdp: offer })
              .then(() => remoteCandidateStream.subscribe(
                iceCandidate => {
                  pc.addIceCandidate(new WebRTC.RTCIceCandidate(iceCandidate))
                    .catch(err => console.warn(err))
                },
                err => console.warn(err),
                () => this.clients.delete(id)
              ))
              .then(() => pc.createAnswer())
              .then(answer => pc.setLocalDescription(answer))
              .then(() => send({ answer: pc.localDescription.sdp }, id))
              .catch(err => {
                this.clients.delete(id)
                console.error(err)
              })
          } else if (iceCandidate) {
            if (iceCandidate.candidate !== '') {
              remoteCandidateStream.next(iceCandidate)
            } else {
              remoteCandidateStream.complete()
            }
          } else if (isError) {
            console.warn('Remote peer no longer available via Signaling')
          } else {
            console.error(new Error('Unknown message from a remote peer', {offer, iceCandidate, isError}))
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

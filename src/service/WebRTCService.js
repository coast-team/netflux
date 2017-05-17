import '../../node_modules/webrtc-adapter/out/adapter_no_edge_no_global'
import { ReplaySubject } from 'node_modules/rxjs/ReplaySubject'
import { Observable } from 'node_modules/rxjs/Observable'
import 'node_modules/rxjs/add/operator/map'

import { Util } from 'Util'
import { Service } from 'service/Service'
const wrtc = Util.require(Util.WEB_RTC)
const CloseEvent = Util.require(Util.CLOSE_EVENT)

const CONNECTION_TIMEOUT = 5000

/**
 * Service class responsible to establish `RTCDataChannel` between two clients via
 * signaling server or `WebChannel`.
 *
 */
export class WebRTCService extends Service {
  onChannelFromWebChannel (wc) {
    if (WebRTCChecker.isSupported) {
      return this.onDataChannel(
        wc._msgStream
          .filter(msg => msg.serviceId === this.id)
          .map(msg => ({msg: msg.content, id: msg.senderId})),
        (msg, id) => wc.sendInnerTo(id, this.id, msg)
      )
    }
    throw new Error('Peer is not listening on RTCDataChannel')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough `WebChannel`.
   * Starts by sending an **SDP offer**.
   *
   * @param {WebChannel} wc WebChannel
   * @param {number} id Peer id
   * @param {RTCConfiguration} rtcConfiguration Configuration object for `RTCPeerConnection`
   *
   * @returns {Promise<RTCDataChannel>} Data channel between you and `id` peer
   */
  connectOverWebChannel (wc, id, rtcConfiguration) {
    return this.createDataChannel(
      wc._msgStream
        .filter(msg => msg.serviceId === this.id && msg.senderId === id)
        .map(msg => msg.content),
      msg => wc.sendInnerTo(id, this.id, msg),
      wc.myId,
      rtcConfiguration
    )
  }

  /**
   * Listen on `RTCDataChannel` from Signaling server. Starts to listen on **SDP answer**.
   *
   * @param {Subject} stream Specific to Netflux RxJs Subject connection with Signaling server
   * @param {RTCConfiguration} rtcConfiguration Configuration object for `RTCPeerConnection`
   *
   * @returns {Observable<RTCDataChannel>} Observable emitting `RTCDataChannel`. Can emit errors and completes when the stream with Signaling server has completed.
   */
  onChannelFromSignaling (stream, rtcConfiguration) {
    if (WebRTCChecker.isSupported) {
      return this.onDataChannel(
        stream
          .filter(msg => 'id' in msg && 'data' in msg)
          .map(msg => ({msg: msg.data, id: msg.id})),
        (msg, id) => stream.send(JSON.stringify({id, data: msg})),
        rtcConfiguration
      )
    }
    throw new Error('Peer is not listening on RTCDataChannel')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough Signaling server.
   * Starts by sending an **SDP offer**.
   *
   * @param {Subject} stream Specific to Netflux RxJs Subject connection with Signaling server
   * @param {RTCConfiguration} rtcConfiguration Configuration object for `RTCPeerConnection`
   *
   * @returns {Promise<RTCDataChannel>} Data channel between you and `id` peer
   */
  connectOverSignaling (stream, rtcConfiguration) {
    return this.createDataChannel(
      stream.filter(msg => 'data' in msg).map(msg => msg.data),
      msg => stream.send(JSON.stringify({data: msg})),
      rtcConfiguration
    )
  }

  /**
   * @private
   * @param  {Subject} stream
   * @param  {function(msg: Object): void} send
   * @param  {string} [label=null]
   * @param  {RTCConfiguration} rtcConfiguration
   * @return {Promise<RTCDataChannel>}
   */
  createDataChannel (stream, send, label = null, rtcConfiguration) {
    const pc = this.createPeerConnection(rtcConfiguration)
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

      this.openDataChannel(pc, true, label)
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

  /**
   * @private
   * @param  {Subject} stream
   * @param  {function(msg: Object, id: number): void} send
   * @param  {RTCConfiguration} rtcConfiguration
   * @return {Observable<RTCDataChannel>}
   */
  onDataChannel (stream, send, rtcConfiguration) {
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
            pc = this.createPeerConnection(rtcConfiguration)
            remoteCandidateStream = new ReplaySubject()
            this.createLocalCandidateStream(pc).subscribe(
              candidate => send({candidate}, id),
              err => console.warn(err),
              () => send({candidate: ''}, id)
            )
            clients.set(id, [pc, remoteCandidateStream])
          }
          if ('offer' in msg) {
            this.openDataChannel(pc, false)
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

  /**
   * @private
   * @param  {RTCConfiguration} [rtcConfiguration={}]
   * @return {RTCPeerConnection}
   */
  createPeerConnection (rtcConfiguration = {}) {
    return new wrtc.RTCPeerConnection(rtcConfiguration)
  }

  /**
   * @private
   * @param  {RTCPeerConnection} pc
   * @return {Observable<{candidate: string, sdpMid: string, sdpMLineIndex: string}>}
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

  /**
   * @private
   * @param  {RTCPeerConnection} pc
   * @param  {boolean} offerCreator
   * @param  {string} [label=null]
   * @return {Promise<RTCDataChannel>}
   */
  openDataChannel (pc, offerCreator, label = null) {
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
   * @param {RTCDataChannel} dc
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

export class WebRTCChecker {
  static get isSupported () {
    return wrtc !== undefined
  }
}

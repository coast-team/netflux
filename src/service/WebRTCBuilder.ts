import { Observable } from 'rxjs/Observable'
import { Observer } from 'rxjs/Observer'
import { filter, map, pluck } from 'rxjs/operators'
import { ReplaySubject } from 'rxjs/ReplaySubject'

import { Channel } from '../Channel'
import { isWebRTCSupported, log } from '../misc/Util'
import { signaling as protoSig, webRTCBuilder as proto } from '../proto'
import { IWebRTCStream } from '../Signaling'
import { Service } from './Service'
import { WebChannel } from './WebChannel'

let counter = 0

export const CONNECT_TIMEOUT = 20000

interface ICommonMessage {
  iceCandidate?: proto.IIceCandidate
  isError?: boolean
  isEnd?: boolean
}

interface IOfferSend extends ICommonMessage {
  offer?: string
  isInitiator?: boolean
}

interface IOfferReceived extends IOfferSend {
  id: number
}

interface IAnswer extends ICommonMessage {
  answer?: string
}

export interface ISignalingConnection {
  onMessage: Observable<any>
  send: (msg: protoSig.IContent) => void
}

/**
 * Service class responsible to establish `RTCDataChannel` between two remotes via
 * signaling server or `WebChannel`.
 *
 */
export class WebRTCBuilder extends Service<proto.IMessage, proto.Message> {
  public static readonly SERVICE_ID = 7431
  private rtcConfiguration: RTCConfiguration

  constructor(wc: WebChannel, rtcConfiguration: RTCConfiguration) {
    super(WebRTCBuilder.SERVICE_ID, proto.Message, wc.serviceMessageSubject)
    this.wc = wc
    this.rtcConfiguration = rtcConfiguration
  }

  /**
   * Listen on `RTCDataChannel` from WebChannel (another peer is playing a signaling role).
   * Starts to listen on **SDP answer**.
   */
  onChannelFromWebChannel(): Observable<Channel> {
    if (isWebRTCSupported()) {
      return this.onChannel(
        this.onServiceMessage.pipe(
          filter(({ msg }) => msg.isInitiator),
          map(({ msg, senderId }: { msg: any; senderId: number }) => {
            msg.id = senderId
            return msg
          })
        ),
        (msg, id) => super._sendTo(id, msg)
      )
    }
    log.webrtc('WebRTC is not supported')
    throw new Error('WebRTC is not supported')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough `WebChannel`.
   * Starts by sending an **SDP offer**.
   *
   * @param id  Peer id
   */
  connectOverWebChannel(id: number): Promise<Channel> {
    if (isWebRTCSupported()) {
      return this.establishChannel(
        this.onServiceMessage.pipe(
          filter(({ msg, senderId }: { msg: any; senderId: number }) => senderId === id && !msg.isInitiator),
          pluck('msg')
        ),
        (msg: IOfferSend) => {
          msg.isInitiator = true
          super._sendTo(id, msg)
        },
        id
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * Listen on `RTCDataChannel` from Signaling server.
   * Starts to listen on **SDP answer**.
   */
  onChannelFromSignaling(wrtcStream: IWebRTCStream): Observable<Channel> {
    if (isWebRTCSupported()) {
      return this.onChannel(
        wrtcStream.message.pipe(
          filter((msg) => msg.id !== 0),
          map((msg) => (msg.type === 'data' ? Object.assign({ id: msg.id }, super.decode(msg.data)) : msg))
        ),
        (msg: any, id: number) => {
          if (!('isError' in msg || 'isEnd' in msg)) {
            msg.data = super.encode(msg)
          }
          msg.id = id
          wrtcStream.send(msg)
        }
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough Signaling server.
   * Starts by sending an **SDP offer**.
   */
  connectOverSignaling(wrtcStream: IWebRTCStream): Promise<Channel> {
    if (isWebRTCSupported()) {
      return this.establishChannel(
        wrtcStream.message.pipe(filter((msg) => msg.id === 0), map((msg) => (msg.type === 'data' ? (super.decode(msg.data) as any) : msg))),
        (msg: any) => {
          if (!('isError' in msg || 'isEnd' in msg)) {
            wrtcStream.send({ data: super.encode(msg) })
          } else {
            wrtcStream.send(msg)
          }
        }
      )
    }
    throw new Error('WebRTC is not supported')
  }

  private establishChannel(onMessage: Observable<IAnswer>, send: (msg: IOfferSend) => void, id = 1): Promise<Channel> {
    let isOfferSent = false
    const pc = new global.RTCPeerConnection(this.rtcConfiguration)
    pc.onicegatheringstatechange = () => {
      log.webrtc('ICE GATHERING STATE changed to', pc.iceGatheringState)
      if (pc.iceGatheringState === 'complete' && isOfferSent) {
        send({ isEnd: true })
        isOfferSent = false
      }
    }
    counter++
    pc.onsignalingstatechange = () => {
      log.webrtc('SIGNALING STATE changed to', pc.signalingState)
    }
    const rcs = new ReplaySubject<RTCIceCandidate>()
    this.setupLocalCandidates(pc, (iceCandidate) => send({ iceCandidate }))

    return new Promise((resolve, reject) => {
      const onMessageSub = onMessage.subscribe(
        ({ answer, iceCandidate, isError, isEnd }) => {
          pc.oniceconnectionstatechange = () => {
            log.webrtc(counter + ': ICE CONNECTION STATE changed to', pc.iceConnectionState)
            if (pc.iceConnectionState === 'failed') {
              rcs.complete()
              pc.close()
              send({ isError: true })
              onMessageSub.unsubscribe()
              reject(new Error(counter + ': Failed to establish RTCDataChannel: Ice Connection failed'))
            }
          }
          if (isError) {
            rcs.complete()
            onMessageSub.unsubscribe()
            if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
              log.webrtc(counter + ': Failed to establish RTCDataChannel: remote peer error')
              pc.close()
              reject(new Error(counter + ': Remote peer error'))
            } else {
              log.webrtc(counter + ': Remote peer error, but RTCDataChannel has still been established')
            }
          } else if (answer) {
            log.webrtc(counter + ': REMOTE Answer is received', { answer })
            pc
              .setRemoteDescription({ type: 'answer', sdp: answer } as any)
              .then(() => {
                rcs.subscribe((ic) => pc.addIceCandidate(ic).catch((err) => log.webrtc('${id}: Failed to add REMOTE Ice Candidate', err)))
              })
              .catch((err) => {
                log.webrtc(counter + ': Failed to establish RTCDataChannel: Set REMOTE Answer ERROR', err)
                rcs.complete()
                pc.close()
                send({ isError: true })
                onMessageSub.unsubscribe()
                reject(new Error(counter + ': Error during setting a remote answer'))
              })
          } else if (iceCandidate) {
            if (iceCandidate.candidate !== '') {
              log.webrtc(counter + ': REMOTE Ice Candidate is received', iceCandidate)
              rcs.next(new global.RTCIceCandidate(iceCandidate as RTCIceCandidateInit))
            } else {
              log.webrtc(counter + ': REMOTE Ice Candidate gathering COMPLETED', iceCandidate.candidate)
              rcs.complete()
            }
          } else if (isEnd) {
            log.webrtc(counter + ': REMOTE Peer FINISHED send all data')
            onMessageSub.unsubscribe()
          } else {
            log.webrtc(counter + ': Unknown message from a remote peer: stopping connection establishment')
            rcs.complete()
            pc.close()
            send({ isError: true })
            onMessageSub.unsubscribe()
            reject(new Error(counter + ': Unknown message from a remote peer'))
          }
        },
        (err) => {
          log.webrtc(counter + ': Intermidiary steram was interrupted', err)
          rcs.complete()
          if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
            log.webrtc(counter + ': Failed to establish RTCDataChannel: Intermidiary steram was interrupted')
            pc.close()
            reject(err)
          } else {
            log.webrtc(counter + ': Intermidiary steram was interrupted, but RTCDataChannel has still been established')
          }
        },
        () => {
          rcs.complete()
          if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
            const err = new Error('Intermidiary steram was closed')
            log.webrtc(counter + ': Failed to establish RTCDataChannel', err)
            pc.close()
            reject(err)
          } else {
            log.webrtc(counter + ': Connection with Signaling closed, but RTCDataChannel has still been established')
          }
        }
      )

      this.openChannel(pc, id)
        .then(resolve)
        .catch((err) => {
          rcs.complete()
          pc.close()
          send({ isError: true })
          onMessageSub.unsubscribe()
          reject(err)
        })

      pc
        .createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (pc.localDescription && pc.localDescription.sdp) {
            send({ offer: pc.localDescription.sdp })
            isOfferSent = true
            if (pc.iceGatheringState === 'complete') {
              send({ isEnd: true })
            }
          }
        })
        .catch((err) => {
          rcs.complete()
          pc.close()
          send({ isError: true })
          onMessageSub.unsubscribe()
          log.webrtc(counter + ': Failed to establish RTCDataChannel: Error while setting LOCAL Offer', err)
          reject(err)
        })
    })
  }

  private onChannel(onMessage: Observable<IOfferReceived>, send: (msg: IAnswer, id: number) => void): Observable<Channel> {
    const remotes: Map<number, [RTCPeerConnection, ReplaySubject<RTCIceCandidate>, boolean]> = new Map()
    const failedRemotes: number[] = []
    return Observable.create((observer: Observer<Channel>) => {
      onMessage.pipe(filter(({ id }) => !failedRemotes.includes(id))).subscribe(
        (msg) => {
          const { offer, iceCandidate, id, isError, isEnd } = msg

          const clean = (peerId: number, pc: RTCPeerConnection, rcs: ReplaySubject<RTCIceCandidate>) => {
            pc.oniceconnectionstatechange = () => {}
            rcs.complete()
            send({ isError: true }, peerId)
            remotes.delete(id)
            failedRemotes[failedRemotes.length] = peerId
          }

          if (isError) {
            log.webrtc(`${id}: Failed to establish RTCDataChannel: remote peer error`)
            const remote = remotes.get(id)
            if (remote) {
              remote[1].complete()
              remotes.delete(id)
            }
            failedRemotes[failedRemotes.length] = id
          } else {
            let pc: RTCPeerConnection
            let rcs: ReplaySubject<RTCIceCandidate>
            let isAnswerSent: boolean
            const remote = remotes.get(id)
            if (remote) {
              ;[pc, rcs, isAnswerSent] = remote
            } else {
              isAnswerSent = false

              pc = new global.RTCPeerConnection(this.rtcConfiguration)
              pc.oniceconnectionstatechange = () => {
                log.webrtc(`${id}: ICE CONNECTION STATE changed to`, pc.iceConnectionState)
                if (pc.iceConnectionState === 'failed') {
                  clean(id, pc, rcs)
                }
              }
              pc.onicegatheringstatechange = () => {
                log.webrtc(`${id}: ICE GATHERING STATE changed to`, pc.iceGatheringState)
                if (pc.iceGatheringState === 'complete' && isAnswerSent) {
                  send({ isEnd: true }, id)
                  pc.onicegatheringstatechange = () => {}
                }
              }
              pc.onsignalingstatechange = () => {
                log.webrtc(`${id}: SIGNALING STATE changed to`, pc.signalingState)
              }
              rcs = new ReplaySubject<RTCIceCandidate>()
              this.setupLocalCandidates(pc, (ic) => send({ iceCandidate: ic }, id))
              this.openChannel(pc)
                .then((ch) => {
                  pc.oniceconnectionstatechange = () => {}
                  observer.next(ch)
                })
                .catch(() => clean(id, pc, rcs))
              remotes.set(id, [pc, rcs, isAnswerSent])
            }

            if (offer) {
              log.webrtc(`${id}: REMOTE OFFER is received`, { offer })
              pc
                .setRemoteDescription({ type: 'offer', sdp: offer } as RTCSessionDescription)
                .then(() =>
                  rcs.subscribe((ic) => pc.addIceCandidate(ic).catch((err) => log.webrtc(`${id}: Failed to addIceCandidate`, err)))
                )
                .then(() => pc.createAnswer())
                .then((answer) => pc.setLocalDescription(answer))
                .then(() => {
                  if (pc.localDescription && pc.localDescription.sdp) {
                    log.webrtc(`${id}: Send LOCAL ANSWER`, { answer: pc.localDescription.sdp })
                    send({ answer: pc.localDescription.sdp }, id)
                    isAnswerSent = true
                    if (pc.iceGatheringState === 'complete') {
                      send({ isEnd: true }, id)
                      pc.onicegatheringstatechange = () => {}
                    }
                  }
                })
                .catch((err) => {
                  log.webrtc(`${id}: Error during offer/answer setting`, err)
                  clean(id, pc, rcs)
                })
            } else if (iceCandidate) {
              if (iceCandidate.candidate !== '') {
                log.webrtc(`${id}: REMOTE Ice Candidate is received`, iceCandidate)
                rcs.next(new global.RTCIceCandidate(iceCandidate as RTCIceCandidateInit))
              } else {
                log.webrtc(`${id}: REMOTE Ice Candidate gathering COMPLETED`, iceCandidate.candidate)
                rcs.complete()
              }
            } else if (isEnd) {
              log.webrtc(`${id}: REMOTE Peer FINISHED send all data`)
              remotes.delete(id)
            } else {
              log.webrtc(`${id}: Unknown message from a remote peer: stopping connection establishment`, msg)
              clean(id, pc, rcs)
            }
          }
        },
        (err) => {
          log.webrtc('Intermidiary steram was interrupted', err)
          for (const [id, [pc, rcs]] of remotes) {
            rcs.complete()
            if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
              log.webrtc(`${id}: Failed to establish RTCDataChannel`)
              pc.close()
            } else {
              log.webrtc(`${id}: RTCDataChannel with ${id} has still been established`)
            }
          }
          observer.error(err)
        },
        () => {
          log.webrtc('${id}: Intermidiary stream has closed')
          for (const [id, [pc, rcs]] of remotes) {
            rcs.complete()
            if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
              log.webrtc(`${id}: Failed to establish RTCDataChannel: Intermidiary stream has closed`)
              pc.close()
            } else {
              log.webrtc(`${id}: RTCDataChannel has still been established`)
            }
          }
          observer.complete()
        }
      )
    })
  }

  private setupLocalCandidates(pc: RTCPeerConnection, cb: (obj: proto.IIceCandidate) => void): void {
    pc.onicecandidate = (evt: RTCPeerConnectionIceEvent) => {
      if (evt.candidate !== null) {
        log.webrtc('LOCAL Ice Candidate gathered', evt.candidate.candidate)
        cb({
          candidate: evt.candidate.candidate,
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex,
        })
      }
    }
  }

  private openChannel(pc: RTCPeerConnection, id?: number): Promise<Channel> {
    let dc: RTCDataChannel
    if (id) {
      try {
        dc = pc.createDataChannel(this.wc.myId.toString())
      } catch (err) {
        log.webrtc('Failed to create RTCDataChannel', err)
        return Promise.reject(err)
      }
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (dc.readyState !== 'open') {
            dc.close()
            const errMsg = `RTCDataChannel ${CONNECT_TIMEOUT}ms connection timeout with '${id}'`
            log.webrtc(errMsg)
            reject(new Error(errMsg))
          }
        }, CONNECT_TIMEOUT)
        dc.onopen = () => {
          clearTimeout(timeout)
          log.webrtc(`RTCDataChannel with ${id} has opened`, (pc as any).sctp)
          resolve(new Channel(this.wc, dc, { rtcPeerConnection: pc, id }))
        }
      })
    } else {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (dc === undefined || dc.readyState !== 'open') {
            if (dc !== undefined) {
              dc.close()
            }
            const errMsg = `RTCDataChannel ${CONNECT_TIMEOUT}ms connection timeout with joining peer`
            log.webrtc(errMsg)
            reject(new Error(errMsg))
          }
        }, CONNECT_TIMEOUT)
        pc.ondatachannel = (dcEvt: RTCDataChannelEvent) => {
          dc = dcEvt.channel
          const peerId = Number.parseInt(dc.label, 10)
          dc.onopen = () => {
            clearTimeout(timeout)
            log.webrtc(`RTCDataChannel with ${peerId} has opened`, (pc as any).sctp)
            resolve(new Channel(this.wc, dc, { rtcPeerConnection: pc, id: peerId }))
          }
        }
      })
    }
  }
}

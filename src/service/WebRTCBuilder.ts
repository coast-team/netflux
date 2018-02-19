import { Observable } from 'rxjs/Observable'
import { Observer } from 'rxjs/Observer'
import { filter, map, pluck } from 'rxjs/operators'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import { Subject } from 'rxjs/Subject'

import { Channel } from '../Channel'
import { log } from '../misc/Util'
import { signaling as sigProto, webRTCBuilder } from '../proto'
import { IWebRTCStream } from '../Signaling'
import { Service } from './Service'
import { WebChannel } from './WebChannel'

let counter = 0

/**
 * Service id.
 */
const ID = 300
export const CONNECT_TIMEOUT = 20000

interface ICommonMessage {
  iceCandidate?: webRTCBuilder.IIceCandidate,
  isError?: boolean,
  isEnd?: boolean,
}

interface IOfferSend extends ICommonMessage {
  offer?: string,
}

interface IOfferReceived extends IOfferSend {
  id: number,
}

interface IAnswer extends ICommonMessage {
  answer?: string,
}

export interface ISignalingConnection {
  onMessage: Observable<any>,
  send: (msg: sigProto.IContent) => void
}

/**
 * Service class responsible to establish `RTCDataChannel` between two remotes via
 * signaling server or `WebChannel`.
 *
 */
export class WebRTCBuilder extends Service {
  /**
   * Indicates whether WebRTC is supported by the environment.
   */
  static get isSupported (): boolean {
    return global.RTCPeerConnection !== undefined
  }

  private wc: WebChannel
  private rtcConfiguration: RTCConfiguration

  constructor (wc: WebChannel, rtcConfiguration: RTCConfiguration) {
    super(ID, webRTCBuilder.Message, wc.serviceMessageSubject)
    this.wc = wc
    this.rtcConfiguration = rtcConfiguration
  }

  /**
   * Listen on `RTCDataChannel` from WebChannel (another peer is playing a signaling role).
   * Starts to listen on **SDP answer**.
   */
  onChannelFromWebChannel (): Observable<Channel> {
    if (WebRTCBuilder.isSupported) {
      return this.onChannel(
        this.onServiceMessage.pipe(
          filter(({ msg }: {msg: any}) => msg.isInitiator),
          map(({ msg, senderId }: { msg: any, senderId: number }) => {
            msg.id = senderId
            return msg
          }),
        ),
        (msg, id) => this.wc.sendToProxy({ recipientId: id, content: super.encode(msg) }),
      )
    }
    log.debug('WebRTC is not supported')
    throw new Error('WebRTC is not supported')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough `WebChannel`.
   * Starts by sending an **SDP offer**.
   *
   * @param id  Peer id
   */
  connectOverWebChannel (id: number): Promise<Channel> {
    if (WebRTCBuilder.isSupported) {
      return this.establishChannel(
        this.onServiceMessage.pipe(
          filter(({ msg, senderId }: { msg: any, senderId: number }) => senderId === id && !msg.isInitiator),
          pluck('msg'),
        ),
        (msg: IOfferSend) => {
          msg['isInitiator'] = true
          this.wc.sendToProxy({ recipientId: id, content: super.encode(msg) })
        },
        id,
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * Listen on `RTCDataChannel` from Signaling server.
   * Starts to listen on **SDP answer**.
   */
  onChannelFromSignaling (wrtcStream: IWebRTCStream): Observable<Channel> {
    if (WebRTCBuilder.isSupported) {
      return this.onChannel(
        wrtcStream.message.pipe(
          filter((msg) => msg.id !== 0),
          map((msg) => {
            if (msg.type === 'data') {
              const data = super.decode(msg.data)
              data.id = msg.id
              return data
            }
            return msg
          }),
        ),
        (msg: any, id) => {
          if (!('isError' in msg || 'isEnd' in msg)) {
            msg.data = webRTCBuilder.Message.encode(webRTCBuilder.Message.create(msg)).finish()
          }
          msg.id = id
          wrtcStream.send(msg)
        },
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough Signaling server.
   * Starts by sending an **SDP offer**.
   */
  connectOverSignaling (wrtcStream: IWebRTCStream): Promise<Channel> {
    if (WebRTCBuilder.isSupported) {
      return this.establishChannel(
        wrtcStream.message.pipe(
          filter((msg) => msg.id === 0),
          map((msg) => msg.type === 'data' ? super.decode(msg.data) : msg),
        ),
        (msg) => {
          if (!('isError' in msg || 'isEnd' in msg)) {
            wrtcStream.send({ data: webRTCBuilder.Message.encode(webRTCBuilder.Message.create(msg)).finish() })
          } else {
            wrtcStream.send(msg)
          }
        },
      )
    }
    throw new Error('WebRTC is not supported')
  }

  private establishChannel (
    onMessage: Observable<IAnswer>,
    send: (msg: IOfferSend) => void,
    id = 1,
  ): Promise<Channel> {
    let isOfferSent = false
    const pc = new global.RTCPeerConnection(this.rtcConfiguration)
    pc.onicegatheringstatechange = () => {
      log.debug('ICE GATHERING STATE changed to', pc.iceGatheringState)
      if (pc.iceGatheringState === 'complete' && isOfferSent) {
        send({ isEnd: true })
        isOfferSent = false
      }
    }
    counter++
    pc.onsignalingstatechange = () => {log.debug('SIGNALING STATE changed to', pc.signalingState)}
    const remoteCandidateStream = new ReplaySubject<RTCIceCandidate>()
    this.setupLocalCandidates(pc, (iceCandidate) => send({ iceCandidate }))

    return new Promise((resolve, reject) => {
      const onMessageSub = onMessage.subscribe(
        ({ answer, iceCandidate, isError, isEnd }) => {
          pc.oniceconnectionstatechange = () => {
            log.debug(counter + ': ICE CONNECTION STATE changed to', pc.iceConnectionState)
            if (pc.iceConnectionState === 'failed') {
              remoteCandidateStream.complete()
              pc.close()
              send({ isError: true })
              onMessageSub.unsubscribe()
              reject(new Error(counter + ': Failed to establish RTCDataChannel: Ice Connection failed'))
            }
          }
          if (isError) {
            remoteCandidateStream.complete()
            onMessageSub.unsubscribe()
            if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
              log.debug(counter + ': Failed to establish RTCDataChannel: remote peer error')
              pc.close()
              reject(new Error(counter + ': Remote peer error'))
            } else {
              log.debug(counter + ': Remote peer error, but RTCDataChannel has still been established')
            }
          } else if (answer) {
            log.debug(counter + ': REMOTE Answer is received', {answer})
            pc.setRemoteDescription({ type: 'answer', sdp: answer } as any)
              .then(() => {
                remoteCandidateStream.subscribe(
                  (ic) => pc.addIceCandidate(ic)
                      .catch((err) => log.debug('${id}: Failed to add REMOTE Ice Candidate', err)),
                )
              })
              .catch((err) => {
                log.debug(counter + ': Failed to establish RTCDataChannel: Set REMOTE Answer ERROR', err)
                remoteCandidateStream.complete()
                pc.close()
                send({ isError: true })
                onMessageSub.unsubscribe()
                reject(new Error(counter + ': Error during setting a remote answer'))
              })
          } else if (iceCandidate) {
            if (iceCandidate.candidate !== '') {
              log.debug(counter + ': REMOTE Ice Candidate is received', iceCandidate)
              remoteCandidateStream.next(new global.RTCIceCandidate(iceCandidate))
            } else {
              log.debug(counter + ': REMOTE Ice Candidate gathering COMPLETED', iceCandidate.candidate)
              remoteCandidateStream.complete()
            }
          } else if (isEnd) {
            log.debug(counter + ': REMOTE Peer FINISHED send all data')
            onMessageSub.unsubscribe()
          } else {
            log.debug(counter + ': Unknown message from a remote peer: stopping connection establishment')
            remoteCandidateStream.complete()
            pc.close()
            send({ isError: true })
            onMessageSub.unsubscribe()
            reject(new Error(counter + ': Unknown message from a remote peer'))
          }
        },
        (err) => {
          log.debug(counter + ': Intermidiary steram was interrupted', err)
          remoteCandidateStream.complete()
          if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
            log.debug(counter + ': Failed to establish RTCDataChannel: Intermidiary steram was interrupted')
            pc.close()
            reject(err)
          } else {
            log.debug(counter + ': Intermidiary steram was interrupted, but RTCDataChannel has still been established')
          }
        },
        () => {
          remoteCandidateStream.complete()
          if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
            const err = new Error('Intermidiary steram was closed')
            log.debug(counter + ': Failed to establish RTCDataChannel', err)
            pc.close()
            reject(err)
          } else {
            log.debug(counter + ': Connection with Signaling was closed, but RTCDataChannel has still been established')
          }
        },
      )

      this.openChannel(pc, id)
        .then(resolve)
        .catch((err) => {
          remoteCandidateStream.complete()
          pc.close()
          send({ isError: true })
          onMessageSub.unsubscribe()
          reject(err)
        })

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          log.debug(counter + ': Send LOCAL Offer: ', {offer: pc.localDescription.sdp})
          send({ offer: pc.localDescription.sdp })
          isOfferSent = true
          if (pc.iceGatheringState === 'complete') {
            send({ isEnd: true })
          }
        })
        .catch((err) => {
          remoteCandidateStream.complete()
          pc.close()
          send({ isError: true })
          onMessageSub.unsubscribe()
          log.debug(counter + ': Failed to establish RTCDataChannel: Error while setting LOCAL Offer', err)
          reject(err)
        })
    })
  }

  private onChannel (
    onMessage: Observable<IOfferReceived>,
    send: (msg: IAnswer, id: number) => void,
  ): Observable< Channel> {
    const remotes: Map<number, [RTCPeerConnection, ReplaySubject<RTCIceCandidate>, boolean]> = new Map()
    const failedRemotes: number[] = []
    return Observable.create((observer) => {
      onMessage.pipe(filter(({ id }) => !failedRemotes.includes(id)))
        .subscribe((msg) => {
          const { offer, iceCandidate, id, isError, isEnd } = msg

          const clean = (peerId, pc, remoteCandidateStream) => {
            pc.oniceconnectionstatechange = undefined
            remoteCandidateStream.complete()
            send({ isError: true }, peerId)
            remotes.delete(id)
            failedRemotes[failedRemotes.length] = peerId
          }

          if (isError) {
            log.debug(`${id}: Failed to establish RTCDataChannel: remote peer error`)
            if (remotes.has(id)) {
              const [pc, remoteCandidateStream] = remotes.get(id)
              remoteCandidateStream.complete()
              remotes.delete(id)
            }
            failedRemotes[failedRemotes.length] = id
          } else {
            let pc
            let remoteCandidateStream
            let isAnswerSent
            if (remotes.has(id)) {
              [pc, remoteCandidateStream, isAnswerSent] = remotes.get(id)
            } else {
              isAnswerSent = false

              pc = new global.RTCPeerConnection(this.rtcConfiguration)
              pc.oniceconnectionstatechange = () => {
                log.debug(`${id}: ICE CONNECTION STATE changed to`, pc.iceConnectionState)
                if (pc.iceConnectionState === 'failed') {
                  clean(id, pc, remoteCandidateStream)
                }
              }
              pc.onicegatheringstatechange = () => {
                log.debug(`${id}: ICE GATHERING STATE changed to`, pc.iceGatheringState)
                if (pc.iceGatheringState === 'complete' && isAnswerSent) {
                  send({ isEnd: true }, id)
                  pc.onicegatheringstatechange = undefined
                }
              }
              pc.onsignalingstatechange = () => {log.debug(`${id}: SIGNALING STATE changed to`, pc.signalingState)}
              remoteCandidateStream = new ReplaySubject<RTCIceCandidate>()
              this.setupLocalCandidates(pc, (ic) => send({ iceCandidate: ic }, id))
              this.openChannel(pc)
                .then((ch) => {
                  pc.oniceconnectionstatechange = undefined
                  observer.next(ch)
                })
                .catch((err) => clean(id, pc, remoteCandidateStream))
              remotes.set(id, [pc, remoteCandidateStream, isAnswerSent])
            }

            if (offer) {
              log.debug(`${id}: REMOTE OFFER is received`, {offer})
              pc.setRemoteDescription({ type: 'offer', sdp: offer })
                .then(() => remoteCandidateStream.subscribe(
                  (ic) => pc.addIceCandidate(ic).catch((err) => log.debug(`${id}: Failed to addIceCandidate`, err)),
                ))
                .then(() => pc.createAnswer())
                .then((answer) => pc.setLocalDescription(answer))
                .then(() => {
                  log.debug(`${id}: Send LOCAL ANSWER`, {answer: pc.localDescription.sdp})
                  send({ answer: pc.localDescription.sdp }, id)
                  isAnswerSent = true
                  if (pc.iceGatheringState === 'complete') {
                    send({ isEnd: true }, id)
                    pc.onicegatheringstatechange = undefined
                  }
                })
                .catch((err) => {
                  log.debug(`${id}: Error during offer/answer setting`, err)
                  clean(id, pc, remoteCandidateStream)
                })
            } else if (iceCandidate) {
              if (iceCandidate.candidate !== '') {
                log.debug(`${id}: REMOTE Ice Candidate is received`, iceCandidate)
                remoteCandidateStream.next(new global.RTCIceCandidate(iceCandidate))
              } else {
                log.debug(`${id}: REMOTE Ice Candidate gathering COMPLETED`, iceCandidate.candidate)
                remoteCandidateStream.complete()
              }
            } else if (isEnd) {
              log.debug(`${id}: REMOTE Peer FINISHED send all data`)
              remotes.delete(id)
            } else {
              log.debug(`${id}: Unknown message from a remote peer: stopping connection establishment`, msg)
              clean(id, pc, remoteCandidateStream)
            }
          }
        },
          (err) => {
            log.debug('Intermidiary steram was interrupted', err)
            for (const [id, [pc, remoteCandidateStream]] of remotes) {
              remoteCandidateStream.complete()
              if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
                log.debug(`${id}: Failed to establish RTCDataChannel`)
                pc.close()
              } else {
                log.debug(`${id}: RTCDataChannel with ${id} has still been established`)
              }
            }
            observer.error(err)
          },
          () => {
            log.debug('${id}: Intermidiary stream has closed')
            for (const [id, [pc, remoteCandidateStream]] of remotes) {
              remoteCandidateStream.complete()
              if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
                log.debug(`${id}: Failed to establish RTCDataChannel: Intermidiary stream has closed`)
                pc.close()
              } else {
                log.debug(`${id}: RTCDataChannel has still been established`)
              }
            }
            observer.complete()
          },
        )
    })
  }

  private setupLocalCandidates (pc: RTCPeerConnection, cb: (obj: webRTCBuilder.IIceCandidate) => void): void {
    pc.onicecandidate = (evt: RTCPeerConnectionIceEvent) => {
      if (evt.candidate !== null) {
        log.debug('LOCAL Ice Candidate gathered', evt.candidate.candidate)
        cb({
          candidate: evt.candidate.candidate,
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex,
        })
      }
    }
  }

  private openChannel (pc: RTCPeerConnection, id?: number): Promise<Channel> {
    let dc
    if (id) {
      try {
        dc = pc.createDataChannel((this.wc.myId).toString())
      } catch (err) {
        log.debug('Failed to create RTCDataChannel', err)
        return Promise.reject(err)
      }
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (dc.readyState !== 'open') {
            dc.close()
            const errMsg = `RTCDataChannel ${CONNECT_TIMEOUT}ms connection timeout with '${id}'`
            log.debug(errMsg)
            reject(new Error(errMsg))
          }
        }, CONNECT_TIMEOUT)
        dc.onopen = () => {
          clearTimeout(timeout)
          log.debug(`RTCDataChannel with ${id} has opened`, (pc as any).sctp)
          resolve(new Channel(this.wc, dc, {rtcPeerConnection: pc, id}))
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
            log.debug(errMsg)
            reject(new Error(errMsg))
          }
        }, CONNECT_TIMEOUT)
        pc.ondatachannel = (dcEvt: RTCDataChannelEvent) => {
          dc = dcEvt.channel
          const peerId = Number.parseInt(dc.label, 10)
          dc.onopen = () => {
            clearTimeout(timeout)
            log.debug(`RTCDataChannel with ${peerId} has opened`, (pc as any).sctp)
            resolve(new Channel(this.wc, dc, {rtcPeerConnection: pc, id: peerId}))
          }
        }
      })
    }
  }
}

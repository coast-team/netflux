/**
 * WebRTC builder module.
 */

import { ReplaySubject } from 'rxjs/ReplaySubject'
import { Subject } from 'rxjs/Subject'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'

import { Service } from './Service'
import { webRTCBuilder } from '../Protobuf'
import { Channel } from '../Channel'
import { WebChannel } from './WebChannel'

/**
 * WebRTC builder module.
 */

/**
 * Service id.
 */
const ID = 0

interface IceCandidate {
  candidate: string,
  sdpMid?: string,
  sdpMLineIndex?: number
}

interface OfferSent {
  offer?: string,
  iceCandidate?: IceCandidate
}

interface OfferReceived {
  offer?: string,
  iceCandidate?: IceCandidate,
  isError?: boolean,
  id: number
}

interface AnswerSent {
  answer?: string,
  iceCandidate?: IceCandidate
}

interface AnswerReceived {
  answer?: string,
  iceCandidate?: IceCandidate,
  isError?: boolean
}

export interface SignalingConnection {
  stream: Observable<any>,
  send: (msg: any) => any
}

/**
 * Service class responsible to establish `RTCDataChannel` between two clients via
 * signaling server or `WebChannel`.
 *
 */
export class WebRTCBuilder extends Service {
  private wc: WebChannel
  private rtcConfiguration: RTCConfiguration
  private clients: Map<number, [RTCPeerConnection, ReplaySubject<IceCandidate>]>

  constructor (wc: WebChannel, iceServers: RTCIceServer[]) {
    super(ID, webRTCBuilder.Message, wc._svcMsgStream)
    this.wc = wc
    this.rtcConfiguration = { iceServers }
    this.clients = new Map()
  }

  /**
   * Indicates whether WebRTC is supported by the environment.
   */
  static get isSupported (): boolean {
    return RTCPeerConnection !== undefined
  }

  channelsFromWebChannel () {
    if (WebRTCBuilder.isSupported) {
      return this.channels(
        this.svcMsgStream
          .filter(({ msg }: {msg: any}) => msg.isInitiator)
          .map(({ msg, senderId }: { msg: any, senderId: number }) => {
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
   * @param id  Peer id
   */
  connectOverWebChannel (id: number): Promise<Channel> {
    if (WebRTCBuilder.isSupported) {
      return this.establishChannel(
        this.svcMsgStream
          .filter(({ msg, senderId }: { msg: any, senderId: number }) => senderId === id && !msg.isInitiator)
          .map(({ msg }: { msg: any }) => ({ answer: msg.answer, iceCandidate: msg.iceCandidate })),
        (msg: any) => {
          msg.isInitiator = true
          this.wc._sendTo({ recipientId: id, content: super.encode(msg) })
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
  channelsFromSignaling (signaling: SignalingConnection): Observable<Channel> {
    if (WebRTCBuilder.isSupported) {
      return this.channels(
        signaling.stream.filter(({ id }) => id !== 0)
          .map(msg => {
            if (msg.type === 'data') {
              const completeData: any = super.decode(msg.data)
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
          const isEnd = msg.iceCandidate !== undefined && msg.iceCandidate.candidate === ''
          signaling.send({ id, isEnd, data: bytes })
        }
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough Signaling server.
   * Starts by sending an **SDP offer**.
   */
  connectOverSignaling (signaling: SignalingConnection): Promise<Channel> {
    if (WebRTCBuilder.isSupported) {
      return this.establishChannel(
        signaling.stream.filter(({ id }) => id === 0)
          .map(msg => {
            return msg.type === 'data' ? super.decode(msg.data) : { isError: true }
          }),
        msg => {
          const bytes = webRTCBuilder.Message
            .encode(webRTCBuilder.Message.create(msg))
            .finish()
          const isEnd = msg.iceCandidate !== undefined && msg.iceCandidate.candidate === ''
          signaling.send({ isEnd, data: bytes })
        }
      )
    }
    throw new Error('WebRTC is not supported')
  }

  private establishChannel (
    stream: Observable<AnswerReceived>,
    send: (msg: OfferSent) => void,
    peerId = 1
  ): Promise<Channel> {
    const pc = new RTCPeerConnection(this.rtcConfiguration)
    const remoteCandidateStream = new ReplaySubject()
    this.localCandidates(pc).subscribe(
      iceCandidate => send({ iceCandidate }),
      err => console.warn(err),
      () => send({ iceCandidate: { candidate: '' } })
    )

    return new Promise((resolve, reject) => {
      const subs = stream.subscribe(
        ({ answer, iceCandidate, isError }) => {
          if (answer) {
            pc.setRemoteDescription({ type: 'answer', sdp: answer } as any)
              .then(() => {
                remoteCandidateStream.subscribe(
                  iceCandidate => {
                    pc.addIceCandidate(new RTCIceCandidate(iceCandidate))
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
            reject(new Error('Unknown message from a remote peer'))
          }
        },
        err => reject(err),
        () => reject(new Error('Failed to establish RTCDataChannel: the connection with Signaling server was closed'))
      )

      this.openChannel(pc, peerId)
        .then(resolve)
        .catch(reject)

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => send({ offer: pc.localDescription.sdp }))
        .catch(reject)
    })
  }

  private channels (
    stream: Observable<OfferReceived>,
    send: (msg: AnswerSent, id: number) => void
  ): Observable<Channel> {
    return Observable.create(observer => {
      stream.subscribe(
        ({ offer, iceCandidate, id, isError }) => {
          const client = this.clients.get(id)
          let pc
          let remoteCandidateStream
          if (client) {
            [pc, remoteCandidateStream] = client
          } else {
            pc = new RTCPeerConnection(this.rtcConfiguration)
            remoteCandidateStream = new ReplaySubject()
            this.localCandidates(pc).subscribe(
              iceCandidate => send({ iceCandidate }, id),
              err => console.warn(err),
              () => send({ iceCandidate: { candidate: '' } }, id)
            )
            this.clients.set(id, [pc, remoteCandidateStream])
          }
          if (offer) {
            this.openChannel(pc)
              .then(ch => observer.next(ch))
              .catch(err => {
                this.clients.delete(id)
                console.error(`Client "${id}" failed to establish RTCDataChannel with you: ${err.message}`)
              })
            pc.setRemoteDescription({ type: 'offer', sdp: offer })
              .then(() => remoteCandidateStream.subscribe(
                iceCandidate => {
                  pc.addIceCandidate(new RTCIceCandidate(iceCandidate))
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
            console.error(new Error('Unknown message from a remote peer'))
          }
        },
        err => observer.error(err),
        () => observer.complete()
      )
    })
  }

  private localCandidates (pc: RTCPeerConnection): Observable<IceCandidate> {
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

  private openChannel (pc: RTCPeerConnection, peerId?: number): Promise<Channel> {
    if (peerId !== undefined) {
      try {
        const dc = pc.createDataChannel((this.wc.myId).toString())
        const channel = new Channel(this.wc, dc, {rtcPeerConnection: pc, id: peerId})
        return new Promise((resolve, reject) => {
          pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'failed') {
              reject('Failed to establish PeerConnection: ' +
              'The ICE candidate did not find compatible matches for all components of the connection')
            }
          }
          dc.onopen = () => {
            pc.oniceconnectionstatechange = () => {
              if (pc.iceConnectionState === 'failed') {
                channel.close()
              }
            }
            resolve(channel)
          }
        })
      } catch (err) {
        return Promise.reject(err)
      }
    } else {
      return new Promise((resolve, reject) => {
        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'failed') {
            reject('The ICE candidate did not find compatible matches for all components of the connection')
          }
        }
        pc.ondatachannel = dcEvt => {
          const dc = dcEvt.channel
          const peerId = Number.parseInt(dc.label, 10)
          const channel = new Channel(this.wc, dc, {rtcPeerConnection: pc, id: peerId})
          dc.onopen = evt => {
            pc.oniceconnectionstatechange = () => {
              if (pc.iceConnectionState === 'failed') {
                channel.close()
              }
            }
            resolve(channel)
          }
        }
      })
    }
  }
}

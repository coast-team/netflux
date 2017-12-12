import { Observable } from 'rxjs/Observable'
import { filter, map } from 'rxjs/operators'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import { Subject } from 'rxjs/Subject'

import { log } from '../misc/Util'
import { signaling, webRTCBuilder } from '../proto'
import { Channel } from './Channel'
import { Service } from './Service'
import { WebChannel } from './WebChannel'

/**
 * Service id.
 */
const ID = 300

export interface ISignalingConnection {
  onMessage: Observable<any>,
  send: (msg: signaling.IContent) => void
}

/**
 * Service class responsible to establish `RTCDataChannel` between two clients via
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
  private clients: Map<number, [RTCPeerConnection, ReplaySubject<webRTCBuilder.IIceCandidate>]>

  constructor (wc: WebChannel, iceServers: RTCIceServer[]) {
    super(ID, webRTCBuilder.Message, wc.serviceMessageSubject)
    this.wc = wc
    this.rtcConfiguration = { iceServers }
    this.clients = new Map()
  }

  /**
   * Listen on `RTCDataChannel` from WebChannel (another peer is playing a signaling role).
   * Starts to listen on **SDP answer**.
   */
  onChannelFromWebChannel () {
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
          map(({ msg }: { msg: any }) => ({ answer: msg.answer, iceCandidate: msg.iceCandidate })),
        ),
        (msg: any) => {
          msg.isInitiator = true
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
  onChannelFromSignaling (signalingConnection: ISignalingConnection): Observable<Channel> {
    if (WebRTCBuilder.isSupported) {
      return this.onChannel(
        signalingConnection.onMessage.pipe(
          filter(({ id }) => id !== 0),
          map((msg) => {
            if (msg.type === 'data') {
              const completeData: any = super.decode(msg.data)
              completeData.id = msg.id
              return completeData
            } else {
              return { isError: true }
            }
          }),
        ),
        (msg, id) => {
          const bytes = webRTCBuilder.Message
            .encode(webRTCBuilder.Message.create(msg))
            .finish()
          const isEnd = msg.iceCandidate !== undefined && msg.iceCandidate.candidate === ''
          signalingConnection.send({ id, isEnd, data: bytes })
        },
      )
    }
    throw new Error('WebRTC is not supported')
  }

  /**
   * Establish an `RTCDataChannel` with a peer identified by `id` trough Signaling server.
   * Starts by sending an **SDP offer**.
   */
  connectOverSignaling (signalingConnection: ISignalingConnection): Promise<Channel> {
    if (WebRTCBuilder.isSupported) {
      return this.establishChannel(
        signalingConnection.onMessage.pipe(
          filter(({ id }) => id === 0),
          map((msg) => {
            return msg.type === 'data' ? super.decode(msg.data) : { isError: true }
          }),
        ),
        (msg) => {
          const bytes = webRTCBuilder.Message
            .encode(webRTCBuilder.Message.create(msg))
            .finish()
          const isEnd = msg.iceCandidate !== undefined && msg.iceCandidate.candidate === ''
          signalingConnection.send({ isEnd, data: bytes })
        },
      )
    }
    throw new Error('WebRTC is not supported')
  }

  private establishChannel (
    onMessage: Observable<{
      answer?: string,
      iceCandidate?: webRTCBuilder.IIceCandidate,
      isError?: boolean,
    }>,
    send: (msg: {
      offer?: string,
      iceCandidate?: webRTCBuilder.IIceCandidate,
    }) => void,
    id = 1,
  ): Promise<Channel> {
    const pc = new global.RTCPeerConnection(this.rtcConfiguration)
    const remoteCandidateStream = new ReplaySubject()
    this.localCandidates(pc).subscribe(
      (iceCandidate) => send({ iceCandidate }),
      (err) => console.warn(err),
      () => send({ iceCandidate: { candidate: '' } }),
    )

    return new Promise((resolve, reject) => {
      const subs = onMessage.subscribe(
        ({ answer, iceCandidate, isError }) => {
          if (answer) {
            console.log(`ANSWER received: `, answer)
            pc.setRemoteDescription({ type: 'answer', sdp: answer } as any)
              .then(() => {
                remoteCandidateStream.subscribe(
                  (ic) => {
                    console.log(`REMOTE candidate: `, ic)
                    pc.addIceCandidate(new global.RTCIceCandidate(ic))
                      .catch(reject)
                  },
                  (err) => console.warn(err),
                  () => subs.unsubscribe(),
                )
              })
              .catch(reject)
          } else if (iceCandidate) {
            if (iceCandidate.candidate !== '') {
              remoteCandidateStream.next(iceCandidate)
            } else {
              console.log(`REMOTE candidates COMPLETED`)
              remoteCandidateStream.complete()
            }
          } else if (isError) {
            reject(new Error('Remote peer no longer available via Signaling'))
          } else {
            reject(new Error('Unknown message from a remote peer'))
          }
        },
        (err) => reject(err),
        () => reject(new Error('Failed to establish RTCDataChannel: the connection with Signaling server was closed')),
      )

      this.openChannel(pc, id)
        .then(resolve)
        .catch(reject)

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          console.log(`SENDING offer `, pc.localDescription.sdp)
          send({ offer: pc.localDescription.sdp })
        })
        .catch(reject)
    })
  }

  private onChannel (
    onMessage: Observable<{
      offer?: string,
      iceCandidate?: webRTCBuilder.IIceCandidate,
      isError?: boolean,
      id: number,
    }>,
    send: (msg: {
      answer?: string,
      iceCandidate?: webRTCBuilder.IIceCandidate,
    },     id: number) => void,
  ): Observable<Channel> {
    return Observable.create((observer) => {
      onMessage.subscribe(
        ({ offer, iceCandidate, id, isError }) => {
          const client = this.clients.get(id)
          let pc
          let remoteCandidateStream
          if (client) {
            [pc, remoteCandidateStream] = client
          } else {
            pc = new global.RTCPeerConnection(this.rtcConfiguration)
            remoteCandidateStream = new ReplaySubject()
            this.localCandidates(pc).subscribe(
              (ic) => send({ iceCandidate: ic }, id),
              (err) => console.warn(err),
              () => send({ iceCandidate: { candidate: '' } }, id),
            )
            this.clients.set(id, [pc, remoteCandidateStream])
          }
          if (offer) {
            this.openChannel(pc)
              .then((ch) => observer.next(ch))
              .catch((err) => {
                this.clients.delete(id)
                console.warn(`Client "${id}" failed to establish RTCDataChannel with you: ${err.message}`)
              })
            console.log(`OFFER received: `, offer)
            pc.setRemoteDescription({ type: 'offer', sdp: offer })
              .then(() => remoteCandidateStream.subscribe(
                (ic) => {
                  console.log(`REMOTE candidate: `, ic)
                  pc.addIceCandidate(new global.RTCIceCandidate(ic))
                    .catch((err) => console.warn(err))
                },
                (err) => console.warn(err),
                () => this.clients.delete(id),
              ))
              .then(() => pc.createAnswer())
              .then((answer) => pc.setLocalDescription(answer))
              .then(() => {
                console.log(`SENDING answer `, pc.localDescription.sdp)
                send({ answer: pc.localDescription.sdp }, id)
              })
              .catch((err) => {
                this.clients.delete(id)
                console.error(err)
              })
          } else if (iceCandidate) {
            if (iceCandidate.candidate !== '') {
              remoteCandidateStream.next(iceCandidate)
            } else {
              console.log(`REMOTE candidates COMPLETED`)
              remoteCandidateStream.complete()
            }
          } else if (isError) {
            console.warn('Remote peer no longer available via Signaling')
          } else {
            console.error(new Error('Unknown message from a remote peer'))
          }
        },
        (err) => observer.error(err),
        () => observer.complete(),
      )
    })
  }

  private localCandidates (pc: RTCPeerConnection): Observable<webRTCBuilder.IIceCandidate> {
    return Observable.create((observer) => {
      pc.onicecandidate = (evt) => {
        console.log(`LOCAL candidate: `, evt.candidate !== null ? evt.candidate.candidate : 'NULL')
        if (evt.candidate !== null) {
          observer.next({
            candidate: evt.candidate.candidate,
            sdpMid: evt.candidate.sdpMid,
            sdpMLineIndex: evt.candidate.sdpMLineIndex,
          })
        } else {
          observer.complete()
        }
      }
    })
  }

  private openChannel (pc: RTCPeerConnection, id?: number): Promise<Channel> {
    if (id !== undefined) {
      try {
        const dc = pc.createDataChannel((this.wc.myId).toString())
        const channel = new Channel(this.wc, dc, {rtcPeerConnection: pc, id})
        return new Promise((resolve, reject) => {
          pc.oniceconnectionstatechange = () => {
            console.log(`Connection STATE: `, pc.iceConnectionState)
            if (pc.iceConnectionState === 'failed') {
              reject('Failed to establish PeerConnection: ' +
              'The ICE candidate did not find compatible matches for all components of the connection')
            }
          }
          dc.onopen = () => {
            pc.oniceconnectionstatechange = () => {
              log.info(
                `ICE connection state with ${channel.id} changed to ${pc.iceConnectionState.toUpperCase()}`,
              )
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
          console.log(`Connection STATE: `, pc.iceConnectionState)
          if (pc.iceConnectionState === 'failed') {
            reject('The ICE candidate did not find compatible matches for all components of the connection')
          }
        }
        pc.ondatachannel = (dcEvt) => {
          const dc = dcEvt.channel
          const peerId = Number.parseInt(dc.label, 10)
          const channel = new Channel(this.wc, dc, {rtcPeerConnection: pc, id: peerId})
          dc.onopen = (evt) => {
            pc.oniceconnectionstatechange = () => {
              log.info(
                `ICE connection state with ${channel.id} changed to ${pc.iceConnectionState.toUpperCase()}`,
              )
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

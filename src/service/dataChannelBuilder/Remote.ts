import { ReplaySubject } from 'rxjs'

import { env, RTCDataChannel } from '../../misc/env'
import { log } from '../../misc/util'
import { dataChannelBuilder as proto } from '../../proto/index'

export class Remote {
  public readonly id: number
  public readonly pc: RTCPeerConnection
  public finalMessageReceived: boolean

  private readonly candidates: ReplaySubject<RTCIceCandidate>
  private readonly send: (msg: proto.IMessage) => void
  private readonly remotes: Map<number, Remote>
  private isSDPSent: boolean
  private _onError: (err: Error) => void
  private timer: any
  private finalMessageSent: boolean

  constructor(
    id: number,
    pc: RTCPeerConnection,
    send: (msg: proto.IMessage) => void,
    remotes: Map<number, Remote>,
    timeout: number
  ) {
    this.finalMessageReceived = false
    this.finalMessageSent = false
    this.id = id
    this.pc = pc
    this.send = send
    this._onError = () => {}
    this.candidates = new ReplaySubject()
    this.remotes = remotes
    this.isSDPSent = false
    this.remotes.set(id, this)
    this.timer = setTimeout(() => {
      if (
        this.pc.iceConnectionState !== 'connected' &&
        this.pc.iceConnectionState !== 'completed'
      ) {
        this._onError(new Error(`${timeout}ms connection timeout`))
      }
    }, timeout)

    pc.oniceconnectionstatechange = () => {
      log.webrtc('LOCAL ICE CONNECTION STATE', pc.iceConnectionState)
      if (pc.iceConnectionState === 'failed') {
        this._onError(new Error('Ice Connection State is FAILED'))
      }
    }

    pc.onicecandidate = (evt: RTCPeerConnectionIceEvent) => {
      if (evt.candidate !== null) {
        log.webrtc('LOCAL ICE CANDIDATE', evt.candidate.candidate)
        this.send({
          candidate: {
            candidate: evt.candidate.candidate,
            sdpMid: evt.candidate.sdpMid,
            sdpMLineIndex: evt.candidate.sdpMLineIndex,
          },
        })
      } else {
        this.pc.onicecandidate = () => {}
        if (this.isSDPSent) {
          this.sendFinalMessage()
        }
      }
    }
  }

  get onError() {
    return this._onError
  }

  set onError(handler: (err: Error) => void) {
    this._onError = (err: Error) => {
      log.webrtc('ERROR: ', err.message)
      this.clean(err.message !== 'clean')
      handler(err)
    }
  }

  sdpIsSent() {
    this.isSDPSent = true
    if (this.pc.iceGatheringState === 'complete') {
      this.sendFinalMessage()
    }
  }

  clean(sendFinalMessage = true) {
    log.webrtc('CLEAN REMOTE')
    this.pc.oniceconnectionstatechange = () => {}
    this.pc.onicecandidate = () => {}
    ;(this.pc as any).ondatachannel = () => {}
    this._onError = () => {}
    this.candidates.complete()
    this.remotes.delete(this.id)
    clearTimeout(this.timer)
    this.pc.close()
    if (sendFinalMessage) {
      this.sendFinalMessage()
    }
  }

  dataChannelOpen(dc: RTCDataChannel) {
    log.webrtc(`DATA CHANNEL with ${this.id} OPEN`)
    if (this.finalMessageReceived && this.finalMessageSent) {
      this.remotes.delete(this.id)
    }
    this.pc.oniceconnectionstatechange = () => {}
    dc.onopen = () => {}
    ;(this.pc as any).ondatachannel = () => {}
    this._onError = () => {}
  }

  handleMessage(msg: proto.Message) {
    if (msg.type) {
      switch (msg.type) {
        case 'offer':
          log.webrtc('REMOTE OFFER', { offer: msg.offer })
          this.pc
            .setRemoteDescription({ type: 'offer', sdp: msg.offer })
            .then(() =>
              this.candidates.subscribe((ic) =>
                this.pc
                  .addIceCandidate(ic)
                  .catch((err) => log.webrtc('Failed to addIceCandidate', err))
              )
            )
            .then(() => this.pc.createAnswer())
            .then((answer) => this.pc.setLocalDescription(answer))
            .then(() => {
              const { sdp } = this.pc.localDescription as RTCSessionDescription
              log.webrtc('Send LOCAL ANSWER', { answer: sdp })
              this.send({ answer: sdp })
              this.sdpIsSent()
            })
            .catch((err) => this._onError(err))
          break
        case 'answer':
          log.webrtc('REMOTE ANSWER is received', { answer: msg.answer })
          this.pc
            .setRemoteDescription({ type: 'answer', sdp: msg.answer } as any)
            .then(() => {
              this.candidates.subscribe((ic) =>
                this.pc
                  .addIceCandidate(ic)
                  .catch((err) => log.webrtc(`${this.id}: Failed to add REMOTE Ice Candidate`, err))
              )
            })
            .catch((err) => this._onError(err))
          break
        case 'candidate':
          log.webrtc('REMOTE ICE CANDIDATE is received', msg.candidate)
          this.candidates.next(new env.RTCIceCandidate(msg.candidate as proto.IceCandidate))
          break
        default:
          this._onError(new Error('Buffer Protocol unknown message from the remote peer'))
      }
    } else {
      log.webrtc('REMOTE FINAL MESSAGE received')
      this.finalMessageReceived = true
      this.candidates.complete()
      if (this.finalMessageSent) {
        this.remotes.delete(this.id)
      }
    }
  }

  private sendFinalMessage() {
    if (!this.finalMessageSent) {
      this.finalMessageSent = true
      this.send({})
      if (this.finalMessageReceived) {
        this.remotes.delete(this.id)
      }
    }
  }
}

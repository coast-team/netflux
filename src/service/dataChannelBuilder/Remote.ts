import { ReplaySubject } from 'rxjs'

import { log } from '../../misc/util'
import { dataChannelBuilder as proto } from '../../proto'

export class Remote {
  public readonly id: number
  public readonly pc: RTCPeerConnection
  public peerToLog = 'INITIATOR'

  private readonly candidates: ReplaySubject<RTCIceCandidate>
  private readonly send: (msg: proto.IMessage) => void
  private readonly remotes: Map<number, Remote>
  private isSDPSent: boolean
  private _onError: (err: Error) => void

  constructor(
    id: number,
    pc: RTCPeerConnection,
    send: (msg: proto.IMessage) => void,
    remotes: Map<number, Remote>
  ) {
    this.id = id
    this.pc = pc
    this.send = send
    this._onError = () => {}
    this.candidates = new ReplaySubject()
    this.remotes = remotes
    this.isSDPSent = false
    this.remotes.set(id, this)

    pc.oniceconnectionstatechange = () => {
      this.log('ICE CONNECTION STATE', pc.iceConnectionState)
      if (pc.iceConnectionState === 'failed') {
        this._onError(new Error('Ice Connection State is FAILED'))
      }
    }

    pc.onicecandidate = (evt: RTCPeerConnectionIceEvent) => {
      if (evt.candidate !== null) {
        this.log('LOCAL ICE CANDIDATE', evt.candidate.candidate)
        this.send({
          candidate: {
            candidate: evt.candidate.candidate,
            sdpMid: evt.candidate.sdpMid,
            sdpMLineIndex: evt.candidate.sdpMLineIndex,
          },
        })
      } else if (this.isSDPSent) {
        this.pc.onicecandidate = () => {}
        this.log(`FINISHED (onicecandidate) with: ${this.id}`)
        this.send({})
      }
    }
  }

  get onError() {
    return this._onError
  }

  set onError(handler: (err: Error) => void) {
    this._onError = handler
  }

  // Mandatory for the passive peer (who listens on the connection)
  set onDataChannel(handler: (dc: RTCDataChannel) => void) {
    this.pc.ondatachannel = ({ channel }: RTCDataChannelEvent) => {
      this.pc.oniceconnectionstatechange = () => {}
      handler(channel)
    }
  }

  sdpIsSent() {
    this.isSDPSent = true
    if (this.pc.iceGatheringState === 'complete') {
      this.pc.onicecandidate = () => {}
      this.log(`FINISHED (sdpIsSent) with: ${this.id}`)
      this.send({})
    }
  }

  clean() {
    this.pc.oniceconnectionstatechange = () => {}
    this.pc.onicecandidate = () => {}
    this.candidates.complete()
    this.remotes.delete(this.id)
    this.log(`DELETE Remote: ${this.id}`)
    if (this.pc.iceConnectionState !== 'connected' && this.pc.iceConnectionState !== 'completed') {
      this.log('Failed to establish RTCDataChannel')
      this.pc.close()
      this.log(`FINISHED (clean) with: ${this.id}`)
      this.send({})
    }
  }

  handleMessage(msg: proto.Message) {
    if (msg.type) {
      switch (msg.type) {
        case 'offer':
          this.log('REMOTE OFFER', { offer: msg.offer })
          this.pc.setRemoteDescription({ type: 'offer', sdp: msg.offer })
            .then(() =>
              this.candidates.subscribe((ic) =>
                this.pc
                  .addIceCandidate(ic)
                  .catch((err) => this.log('Failed to addIceCandidate', err))
              )
            )
            .then(() => this.pc.createAnswer())
            .then((answer) => this.pc.setLocalDescription(answer))
            .then(() => {
              const { sdp } = this.pc.localDescription as RTCSessionDescription
              this.log('Send LOCAL ANSWER', { answer: sdp })
              this.send({ answer: sdp })
              this.sdpIsSent()
            })
            .catch((err) => this._onError(err))
          break
        case 'answer':
          this.log('REMOTE ANSWER is received', { answer: msg.answer })
          this.pc.setRemoteDescription({ type: 'answer', sdp: msg.answer } as any)
            .then(() => {
              this.candidates.subscribe((ic) =>
                this.pc
                  .addIceCandidate(ic)
                  .catch((err) => this.log(`${this.id}: Failed to add REMOTE Ice Candidate`, err))
              )
            })
            .catch((err) => this._onError(err))
          break
        case 'candidate':
          this.log('REMOTE ICE CANDIDATE is received', msg.candidate)
          this.candidates.next(new global.RTCIceCandidate(msg.candidate as proto.IceCandidate))
          break
        default:
          this._onError(new Error('Buffer Protocol unknown message from the remote peer'))
      }
    } else {
      this.log('REMOTE peer FINISHED')
      this.candidates.complete()
      this.remotes.delete(this.id)
    }
  }

  private log(msg: string, obj?: any) {
    if (obj) {
      log.webrtc(`${this.peerToLog}: ${msg}`, obj)
    } else {
      log.webrtc(`${this.peerToLog}: ${msg}`)
    }
  }
}

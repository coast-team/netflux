import { Observable, Subject } from 'rxjs'

import { Channel } from '../../Channel'
import '../../misc/env'
import { env, RTCDataChannelEvent } from '../../misc/env'
import { log } from '../../misc/util'
import { dataChannelBuilder as proto } from '../../proto'
import { WebChannel } from '../../WebChannel'
import { IAllStreams, Service } from '../Service'
import { Remote } from './Remote'

export const CONNECT_TIMEOUT = 9000

/**
 * Service class responsible to establish `RTCDataChannel` between two remotes via
 * signaling server or `WebChannel`.
 */
export class DataChannelBuilder extends Service<proto.IMessage, proto.Message> {
  public static readonly SERVICE_ID = 7431

  private readonly remotes: Map<number, Remote>
  private readonly channelsSubject: Subject<{ id: number; channel: Channel }>
  private rtcConfiguration: RTCConfiguration
  private allStreams: IAllStreams<proto.IMessage, proto.Message>
  private wc: WebChannel

  constructor(wc: WebChannel, rtcConfiguration: RTCConfiguration) {
    super(DataChannelBuilder.SERVICE_ID, proto.Message)
    this.wc = wc
    this.allStreams = super.useAllStreams(wc, wc.signaling)

    this.rtcConfiguration = rtcConfiguration
    this.channelsSubject = new Subject()
    this.remotes = new Map()
    this.allStreams.message.subscribe(({ streamId, senderId, recipientId, msg }) => {
      try {
        let remote = this.remotes.get(senderId)
        if (!remote) {
          if (msg.type && (msg.type === 'offer' || msg.type === 'candidate')) {
            remote = this.createRemote(streamId, senderId, recipientId, true)
          } else {
            return
          }
        } else {
          if (remote.finalMessageReceived) {
            log.webrtc('CLEAN Remote: final message already received')
            remote.clean(false)
            if (msg.type && (msg.type === 'offer' || msg.type === 'candidate')) {
              remote = this.createRemote(streamId, senderId, recipientId, true)
            } else {
              return
            }
          }
        }
        remote.handleMessage(msg)
      } catch (err) {}
    })
  }

  onChannel(): Observable<{ id: number; channel: Channel }> {
    return this.channelsSubject.asObservable()
  }

  /**
   * Establish an `RTCDataChannel`. Starts by sending an **SDP offer**.
   */
  async connect(targetId: number, myId: number, type: number) {
    log.webrtc('connectWith call', { targetId, myId, type })
    const streamId =
      type === Channel.WITH_INTERNAL ? this.wc.STREAM_ID : this.wc.signaling.STREAM_ID
    let remote = this.remotes.get(targetId) as Remote
    if (remote) {
      remote.clean()
    } else {
      remote = this.createRemote(streamId, targetId, myId)
    }
    const targetType =
      type === Channel.WITH_INTERNAL
        ? Channel.WITH_INTERNAL
        : type === Channel.WITH_JOINING
          ? Channel.WITH_MEMBER
          : Channel.WITH_JOINING
    const dc = (remote.pc as any).createDataChannel(`{"id":${this.wc.myId},"type":${targetType}}`)
    const offerInit = await remote.pc.createOffer()
    await remote.pc.setLocalDescription(offerInit)

    const offer = (remote.pc.localDescription as RTCSessionDescription).sdp
    this.allStreams.sendOver(streamId, { offer }, targetId, myId)
    remote.sdpIsSent()

    const channel = (await new Promise((resolve, reject) => {
      remote.onError = (err) => reject(err)
      dc.onopen = () => {
        remote.dataChannelOpen(dc)
        resolve(new Channel(this.wc, dc, type, targetId, remote.pc))
      }
    })) as Channel
    this.channelsSubject.next({ id: targetId, channel })
  }

  clean(id?: number, streamId?: number) {
    if (id && streamId) {
      const remote = this.remotes.get(id)
      if (remote) {
        log.webrtc('CLEAN Remote: called higher')
        remote.clean(false)
      }
    } else {
      this.remotes.forEach((remote) => remote.onError(new Error('clean')))
    }
  }

  private createRemote(
    streamId: number,
    recipientId: number,
    senderId: number,
    passive = false
  ): Remote {
    const remote = new Remote(
      recipientId,
      new env.RTCPeerConnection(this.rtcConfiguration),
      (msg) => this.allStreams.sendOver(streamId, msg, recipientId, senderId),
      this.remotes,
      CONNECT_TIMEOUT
    )
    if (passive) {
      log.webrtc(`create a new remote object with ${recipientId} - PASSIVE`)
      const pc = remote.pc as any
      pc.ondatachannel = ({ channel: dc }: RTCDataChannelEvent) => {
        const { id, type } = JSON.parse(dc.label) as { id: number; type: number }
        dc.onopen = () => {
          remote.dataChannelOpen(dc)
          const channel = new Channel(this.wc, dc, type, id, remote.pc)
          this.channelsSubject.next({ id: recipientId, channel })
        }
      }
    } else {
      log.webrtc(`create a new remote object with ${recipientId} - INITIATOR`)
    }
    return remote
  }
}

import { Observable, Subject } from 'rxjs'

import { Channel, ChannelType } from '../../Channel'
import '../../misc/env'
import { env } from '../../misc/env'
import { log } from '../../misc/util'
import { dataChannelBuilder as proto } from '../../proto'
import { WebChannel } from '../../WebChannel'
import { WebChannelState } from '../../WebChannelState'
import { IAllStreams, Service } from '../Service'
import { Remote } from './Remote'

export const CONNECT_TIMEOUT = 9000

/**
 * Service class responsible to establish `RTCDataChannel` between two remotes via
 * signaling server or `WebChannel`.
 */
export class DataChannelBuilder extends Service<proto.IMessage, proto.Message> {
  public static readonly SERVICE_ID = 7431

  private readonly remotes: Map<number, Map<number, Remote>>
  private readonly channelsSubject: Subject<Channel>
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
    this.remotes.set(this.wc.STREAM_ID, new Map())
    this.remotes.set(this.wc.signaling.STREAM_ID, new Map())
    this.allStreams.message.subscribe(({ streamId, senderId, msg }) => {
      try {
        let remote = this.getRemotes(streamId).get(senderId)
        if (!remote) {
          if (msg.type && (msg.type === 'offer' || msg.type === 'candidate')) {
            remote = this.createRemote(streamId, senderId, true)
          } else {
            return
          }
        } else {
          if (remote.finalMessageReceived) {
            remote.clean(false)
            if (msg.type && (msg.type === 'offer' || msg.type === 'candidate')) {
              remote = this.createRemote(streamId, senderId, true)
            } else {
              return
            }
          }
        }
        remote.handleMessage(msg)
      } catch (err) {}
    })
  }

  onChannel(): Observable<Channel> {
    return this.channelsSubject.asObservable()
  }

  async connectInternal(id: number): Promise<void> {
    log.webrtc(this.wc.myId + 'connectInternal')
    this.channelsSubject.next(
      await this.connect(
        this.wc.STREAM_ID,
        ChannelType.INTERNAL,
        id
      )
    )
  }

  async connectToJoin(id: number): Promise<void> {
    log.webrtc(this.wc.myId + ' connectToJoin')
    this.channelsSubject.next(
      await this.connect(
        this.wc.signaling.STREAM_ID,
        ChannelType.JOINING,
        id
      )
    )
  }

  async connectToInvite(id: number): Promise<void> {
    log.webrtc(this.wc.myId + 'connectToInvite')
    this.channelsSubject.next(
      await this.connect(
        this.wc.signaling.STREAM_ID,
        ChannelType.INVITED,
        id
      )
    )
  }

  clean(id?: number, streamId?: number) {
    if (id && streamId) {
      const remote = this.getRemotes(streamId).get(id)
      if (remote) {
        remote.clean(false)
      }
    } else {
      this.remotes.forEach((remotes) =>
        remotes.forEach((remote) => {
          remote.onError(new Error('clean'))
        })
      )
    }
  }

  /**
   * Establish an `RTCDataChannel`. Starts by sending an **SDP offer**.
   */
  private async connect(streamId: number, type: ChannelType, id: number): Promise<Channel> {
    let remote = this.getRemotes(streamId).get(id) as Remote
    if (remote) {
      remote.clean()
    } else {
      remote = this.createRemote(streamId, id)
    }
    const dc = remote.pc.createDataChannel(this.wc.myId.toString())
    const offerInit = await remote.pc.createOffer()
    await remote.pc.setLocalDescription(offerInit)

    const offer = (remote.pc.localDescription as RTCSessionDescription).sdp
    this.allStreams.sendOver(streamId, { offer }, id)
    remote.sdpIsSent()

    return new Promise((resolve, reject) => {
      remote.onError = (err) => reject(err)
      dc.onopen = () => {
        remote.dataChannelOpen(dc)
        resolve(new Channel(this.wc, dc, type, id, remote.pc))
      }
    }) as Promise<Channel>
  }

  private createRemote(streamId: number, id: number, passive = false): Remote {
    const remote = new Remote(
      id,
      new env.RTCPeerConnection(this.rtcConfiguration),
      (msg) => this.allStreams.sendOver(streamId, msg, id),
      this.getRemotes(streamId),
      CONNECT_TIMEOUT
    )
    if (passive) {
      log.webrtc(`create a new remote object with ${id} - PASSIVE`)

      remote.pc.ondatachannel = ({ channel: dc }: RTCDataChannelEvent) => {
        const peerId = Number.parseInt(dc.label, 10)
        let type: ChannelType
        if (streamId === this.wc.STREAM_ID) {
          type = ChannelType.INTERNAL
        } else if (this.wc.state === WebChannelState.JOINED) {
          type = ChannelType.INVITED
        } else {
          type = ChannelType.JOINING
        }
        dc.onopen = () => {
          remote.dataChannelOpen(dc)
          this.channelsSubject.next(new Channel(this.wc, dc, type, peerId, remote.pc))
        }
      }
    } else {
      log.webrtc(`create a new remote object with ${id} - INITIATOR`)
    }
    return remote
  }

  private getRemotes(streamId: number): Map<number, Remote> {
    return this.remotes.get(streamId) as Map<number, Remote>
  }
}

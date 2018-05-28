import { Observable, Subject } from 'rxjs'

import { Channel, ChannelType } from '../../Channel'
import { log } from '../../misc/util'
import { dataChannelBuilder as proto } from '../../proto'
import { WebChannel } from '../../WebChannel'
import { WebChannelState } from '../../WebChannelState'
import { IAllStreams, Service } from '../Service'
import { Remote } from './Remote'

export const CONNECT_TIMEOUT = 7000

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
      const remote =
        this.getRemotes(streamId).get(senderId) || this.createRemote(streamId, senderId, true)
      remote.handleMessage(msg)
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

  clean() {
    this.remotes.forEach((remotes) =>
      remotes.forEach((remote) => {
        remote.onError(new Error('clean'))
        remote.clean()
      })
    )
  }

  /**
   * Establish an `RTCDataChannel`. Starts by sending an **SDP offer**.
   */
  private async connect(streamId: number, type: ChannelType, id: number): Promise<Channel> {
    const remote = this.createRemote(streamId, id)
    try {
      const dc = remote.pc.createDataChannel(this.wc.myId.toString())
      const offer = await remote.pc.createOffer()
      await remote.pc.setLocalDescription(offer)

      this.allStreams.sendOver(
        streamId,
        { offer: (remote.pc.localDescription as RTCSessionDescription).sdp },
        id
      )
      remote.sdpIsSent()

      const channel = (await new Promise((resolve, reject) => {
        remote.onError = (err) => reject(err)
        const timeout = setTimeout(() => {
          if (dc.readyState !== 'open') {
            reject(new Error(`RTCDataChannel ${CONNECT_TIMEOUT}ms connection timeout with '${id}'`))
          }
        }, CONNECT_TIMEOUT)
        dc.onopen = () => {
          const ch = new Channel(this.wc, dc, type, id, remote.pc)
          remote.pc.oniceconnectionstatechange = () => {}
          clearTimeout(timeout)
          log.webrtc(`${remote.peerToLog}: RTCDataChannel with ${id} has opened`)
          dc.onopen = () => {}
          resolve(ch)
        }
      })) as Channel
      return channel
    } catch (err) {
      log.webrtc('Error on initiator: ', err)
      remote.clean()
      throw err
    }
  }

  private createRemote(streamId: number, id: number, passive = false): Remote {
    log.webrtc(this.wc.myId + ` New Remote object: `, id)
    const remote = new Remote(
      id,
      new global.RTCPeerConnection(this.rtcConfiguration),
      (msg) => this.allStreams.sendOver(streamId, msg, id),
      this.getRemotes(streamId)
    )
    if (passive) {
      remote.peerToLog = '----------- PASSIVE'
      remote.onError = (err) => {
        log.webrtc('Error on passive: ', err)
        remote.clean()
      }
      let dc: RTCDataChannel
      const timer = setTimeout(() => {
        if (dc === undefined || dc.readyState !== 'open') {
          if (dc !== undefined) {
            dc.close()
          }
          remote.onError(new Error(`${CONNECT_TIMEOUT}ms connection timeout`))
        }
      }, CONNECT_TIMEOUT)

      remote.onDataChannel = (dataChannel: RTCDataChannel) => {
        dc = dataChannel
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
          const channel = new Channel(this.wc, dc, type, peerId, remote.pc)
          clearTimeout(timer)
          log.webrtc(`${remote.peerToLog}: RTCDataChannel with ${channel.id} has opened`)
          this.channelsSubject.next(channel)
          dc.onopen = () => {}
        }
      }
    }
    return remote
  }

  private getRemotes(streamId: number): Map<number, Remote> {
    return this.remotes.get(streamId) as Map<number, Remote>
  }
}

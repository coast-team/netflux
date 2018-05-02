import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

import { Channel, ChannelType } from '../../Channel'
import { log } from '../../misc/Util'
import { webRTCBuilder as proto } from '../../proto'
import { WebChannel } from '../../WebChannel'
import { WebChannelState } from '../../WebChannelState'
import { Service } from '../Service'
import { Remote } from './Remote'

export const CONNECT_TIMEOUT = 20000

/**
 * Service class responsible to establish `RTCDataChannel` between two remotes via
 * signaling server or `WebChannel`.
 *
 */
export class WebRTCBuilder extends Service<proto.IMessage, proto.Message> {
  public static readonly SERVICE_ID = 7431

  private readonly remotes: Map<number, Map<number, Remote>>
  private readonly channelsSubject: Subject<Channel>
  private rtcConfiguration: RTCConfiguration

  constructor(wc: WebChannel, rtcConfiguration: RTCConfiguration) {
    super(WebRTCBuilder.SERVICE_ID, proto.Message)

    super.useWebChannelStream(wc)
    super.useSignalingStream(wc.signaling)
    this.rtcConfiguration = rtcConfiguration
    this.channelsSubject = new Subject()
    this.remotes = new Map()
    this.remotes.set(this.wcStream.id, new Map())
    this.remotes.set(this.sigStream.id, new Map())
    this.streams.message.subscribe(({ streamId, senderId, msg }) => {
      const remote =
        this.getRemotes(streamId).get(senderId) || this.createRemote(streamId, senderId, true)
      remote.handleMessage(msg)
    })
  }

  onChannel(): Observable<Channel> {
    return this.channelsSubject.asObservable()
  }

  async connectInternal(id: number): Promise<void> {
    log.webrtc('connectInternal')
    this.channelsSubject.next(await this.connect(this.wcStream.id, ChannelType.INTERNAL, id))
  }

  async connectToJoin(id: number): Promise<void> {
    log.webrtc('connectToJoin')
    this.channelsSubject.next(await this.connect(this.sigStream.id, ChannelType.JOINING, id))
  }

  async connectToInvite(id: number): Promise<void> {
    log.webrtc('connectToInvite')
    this.channelsSubject.next(await this.connect(this.sigStream.id, ChannelType.INVITED, id))
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

      this.streams.sendOver(
        streamId,
        { offer: (remote.pc.localDescription as RTCSessionDescription).sdp },
        id
      )
      remote.sdpIsSent()

      return (await new Promise((resolve, reject) => {
        remote.onerror = (err) => reject(err)
        const timeout = setTimeout(() => {
          if (dc.readyState !== 'open') {
            reject(new Error(`RTCDataChannel ${CONNECT_TIMEOUT}ms connection timeout with '${id}'`))
          }
        }, CONNECT_TIMEOUT)
        const ch = new Channel(this.wc, dc, type, id, remote.pc)
        dc.onopen = () => {
          remote.pc.oniceconnectionstatechange = () => {}
          clearTimeout(timeout)
          log.webrtc(`${remote.peerToLog}: RTCDataChannel with ${id} has opened`)
          if (type === ChannelType.INVITED) {
            ch.initialize()
          }
          resolve(ch)
        }
      })) as Channel
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
      (msg) => this.streams.sendOver(streamId, msg, id),
      this.getRemotes(streamId)
    )
    if (passive) {
      remote.peerToLog = '----------- PASSIVE'
      remote.onerror = (err) => {
        log.webrtc('Error on passive: ', err)
        remote.clean()
      }
      let dc: RTCDataChannel
      const timer = setTimeout(() => {
        if (dc === undefined || dc.readyState !== 'open') {
          if (dc !== undefined) {
            dc.close()
          }
          log.webrtc('Timer EXECUTED for ' + id, timer)
          remote.onerror(new Error(`${CONNECT_TIMEOUT}ms connection timeout`))
        }
      }, CONNECT_TIMEOUT)
      log.webrtc('Timer SET for ' + id, timer)
      remote.onDataChannel = (dataChannel: RTCDataChannel) => {
        dc = dataChannel
        const peerId = Number.parseInt(dc.label, 10)
        const type =
          this.wc.state === WebChannelState.JOINED ? ChannelType.INVITED : ChannelType.JOINING
        const channel = new Channel(this.wc, dc, type, peerId, remote.pc)
        dc.onopen = () => {
          log.webrtc('Timer CLREAD for ' + id, timer)
          clearTimeout(timer)
          log.webrtc(`${remote.peerToLog}: RTCDataChannel with ${channel.id} has opened`)
          this.channelsSubject.next(channel)
        }
      }
    }
    return remote
  }

  private getRemotes(streamId: number): Map<number, Remote> {
    return this.remotes.get(streamId) as Map<number, Remote>
  }
}

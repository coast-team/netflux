import { Subject } from 'rxjs/Subject'
import { Subscription } from 'rxjs/Subscription'

import { Observable } from 'rxjs/Observable'
import { Channel } from './Channel'
import { IStream } from './IStream'
import {
  generateKey,
  isBrowser,
  isOnline,
  isURL,
  isVisible,
  log,
  MAX_KEY_LENGTH,
  randNumbers,
} from './misc/Util'
import { IMessage, Message } from './proto'
import { ChannelBuilder } from './service/channelBuilder/ChannelBuilder'
import { FullMesh } from './service/topology/FullMesh'
import { ITopology, TopologyEnum, TopologyStateEnum } from './service/topology/Topology'
import { UserDataType, UserMessage } from './service/UserMessage'
import { Signaling, SignalingState } from './Signaling'
import { WebChannelState } from './WebChannelState'
import { WebSocketBuilder } from './WebSocketBuilder'

export interface IWebChannelOptions {
  topology?: TopologyEnum
  signalingServer?: string
  rtcConfiguration?: RTCConfiguration
  autoRejoin?: boolean
}

export const defaultOptions: IWebChannelOptions = {
  topology: TopologyEnum.FULL_MESH,
  signalingServer: 'wss://signaling.netflux.coedit.re',
  rtcConfiguration: {
    iceServers: [{ urls: 'stun:stun3.l.google.com:19302' }],
  },
  autoRejoin: true,
}

export interface InWcMsg extends Message {
  channel: Channel
}

export type OutWcMessage = IMessage

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 * [[include:installation.md]]
 */
export class WebChannel implements IStream<OutWcMessage, InWcMsg> {
  public readonly STREAM_ID = 2
  public readonly members: number[]
  public topology: TopologyEnum
  public id: number
  public myId: number
  public key: string
  public autoRejoin: boolean
  public rtcConfiguration: RTCConfiguration
  public state: WebChannelState

  public onSignalingStateChange: (state: SignalingState) => void
  public onStateChange: (state: WebChannelState) => void
  public onMemberJoin: (id: number) => void
  public onMemberLeave: (id: number) => void
  public onMessage: (id: number, msg: UserDataType) => void

  public webSocketBuilder: WebSocketBuilder
  public channelBuilder: ChannelBuilder
  public topologyService: ITopology
  public signaling: Signaling
  public userMsg: UserMessage
  public streamSubject: Subject<InWcMsg>

  private isRejoinDisabled: boolean
  private topologySub: Subscription
  private rejoinTimer: any

  constructor({
    topology = defaultOptions.topology,
    signalingServer = defaultOptions.signalingServer,
    rtcConfiguration = defaultOptions.rtcConfiguration,
    autoRejoin = defaultOptions.autoRejoin,
  }: IWebChannelOptions = {}) {
    this.streamSubject = new Subject()

    // PUBLIC MEMBERS
    this.topology = topology
    this.id = this.generateId()
    this.myId = this.generateId()
    this.members = [this.myId]
    this.key = ''
    this.autoRejoin = autoRejoin
    this.rtcConfiguration = rtcConfiguration

    // PUBLIC EVENT HANDLERS
    this.onMemberJoin = function none() {}
    this.onMemberLeave = function none() {}
    this.onMessage = function none() {}
    this.onStateChange = function none() {}
    this.onSignalingStateChange = function none() {}

    // PRIVATE
    this.state = WebChannelState.LEFT
    this.userMsg = new UserMessage(this)

    // Signaling init
    this.signaling = new Signaling(this, signalingServer)
    this.signaling.onState.subscribe((state: SignalingState) => {
      log.signalingState(SignalingState[state], this.myId)
      this.onSignalingStateChange(state)
      switch (state) {
        case SignalingState.CONNECTING:
          this.setState(WebChannelState.JOINING)
          break
        case SignalingState.CLOSED:
          if (this.topologyService.state === TopologyStateEnum.DISCONNECTED) {
            this.setState(WebChannelState.LEFT)
          }
          this.rejoin(3000)
          break
        case SignalingState.STABLE:
          this.topologyService.setStable()
          break
      }
    })

    // Services init
    this.webSocketBuilder = new WebSocketBuilder(this)
    this.channelBuilder = new ChannelBuilder(this)

    // Topology init
    this.setTopology(topology)

    // Listen to browser events only
    if (isBrowser) {
      global.window.addEventListener('online', () => {
        if (isVisible() && this.state === WebChannelState.LEFT) {
          this.rejoin()
        }
      })
      global.window.addEventListener('visibilitychange', () => {
        if (isVisible() && this.state === WebChannelState.LEFT) {
          this.rejoin()
        }
      })
      global.window.addEventListener('beforeunload', () => this.internalLeave())
    }
  }

  get messageFromStream(): Observable<InWcMsg> {
    return this.streamSubject.asObservable()
  }

  sendOverStream(msg: OutWcMessage) {
    this.topologyService.sendTo(msg)
  }

  join(key: string = generateKey()): void {
    if (typeof key !== 'string') {
      throw new Error(`Failed to join: the key type "${typeof key}" is not a "string"`)
    } else if (key === '') {
      throw new Error('Failed to join: the key is an empty string')
    } else if (key.length > MAX_KEY_LENGTH) {
      throw new Error(
        `Failed to join : the key length of ${
          key.length
        } exceeds the maximum of ${MAX_KEY_LENGTH} characters`
      )
    }
    this.key = key
    if (
      isOnline() &&
      this.state === WebChannelState.LEFT &&
      this.signaling.state === SignalingState.CLOSED
    ) {
      this.setState(WebChannelState.JOINING)
      this.isRejoinDisabled = !this.autoRejoin
      this.signaling.join(this.key)
    }
  }

  invite(url: string): void {
    if (isURL(url)) {
      this.webSocketBuilder
        .connectToInvite(url)
        .catch((err) => log.webgroup(`Failed to invite the bot ${url}: ${err.message}`))
    } else {
      throw new Error(`Failed to invite a bot: ${url} is not a valid URL`)
    }
  }

  leave() {
    if (this.state !== WebChannelState.LEAVING && this.state !== WebChannelState.LEFT) {
      this.setState(WebChannelState.LEAVING)
      this.key = ''
      this.isRejoinDisabled = true
      this.signaling.close()
      this.topologyService.leave()
    }
  }

  send(data: UserDataType): void {
    if (this.members.length !== 1) {
      for (const chunk of this.userMsg.encodeUserMessage(data)) {
        this.topologyService.send({
          senderId: this.myId,
          recipientId: 0,
          serviceId: UserMessage.SERVICE_ID,
          content: chunk,
        })
      }
    }
  }

  sendTo(id: number, data: UserDataType): void {
    if (this.members.length !== 1) {
      for (const chunk of this.userMsg.encodeUserMessage(data)) {
        this.topologyService.sendTo({
          senderId: this.myId,
          recipientId: id,
          serviceId: UserMessage.SERVICE_ID,
          content: chunk,
        })
      }
    }
  }

  onMemberJoinProxy(id: number): void {
    if (!this.members.includes(id)) {
      this.members[this.members.length] = id
      this.onMemberJoin(id)
    }
  }

  onMemberLeaveProxy(id: number): void {
    if (this.members.includes(id)) {
      this.members.splice(this.members.indexOf(id), 1)
      this.onMemberLeave(id)
    }
  }

  private setState(state: WebChannelState): void {
    if (this.state !== state) {
      log.webGroupState(WebChannelState[state], this.myId)
      this.state = state
      this.onStateChange(state)
    }
  }

  private setTopology(topology: TopologyEnum): void {
    if (this.topologyService !== undefined) {
      if (this.topology !== topology) {
        this.topology = topology
        this.topologyService.leave()
        this.topologyService = new FullMesh(this)
        this.subscribeToTopology()
      }
    } else {
      this.topology = topology
      this.topologyService = new FullMesh(this)
      this.subscribeToTopology()
    }
  }

  private subscribeToTopology() {
    if (this.topologySub) {
      this.topologySub.unsubscribe()
    }
    this.topologySub = this.topologyService.onState.subscribe((state: TopologyStateEnum) => {
      switch (state) {
        case TopologyStateEnum.JOINING:
          this.setState(WebChannelState.JOINING)
          break
        case TopologyStateEnum.JOINED:
          this.setState(WebChannelState.JOINED)
          break
        case TopologyStateEnum.STABLE:
          this.setState(WebChannelState.JOINED)
          this.signaling.open()
          break
        case TopologyStateEnum.DISCONNECTED:
          if (this.signaling.state === SignalingState.CLOSED) {
            this.setState(WebChannelState.LEFT)
          }
          this.rejoin(2000)
          break
      }
    })
  }

  private rejoin(timeout: number = 0) {
    if (!this.isRejoinDisabled) {
      this.isRejoinDisabled = !this.autoRejoin
      global.clearTimeout(this.rejoinTimer)
      this.rejoinTimer = setTimeout(() => {
        if (isOnline() && isVisible()) {
          log.webgroup('REJOIN...')
          this.signaling.join(this.key)
        }
      }, timeout)
    }
  }

  /**
   * Generate random id for a `WebChannel` or a new peer.
   */
  private generateId(excludeIds: number[] = []): number {
    const id = randNumbers()[0]
    if (excludeIds.includes(id)) {
      return this.generateId()
    }
    return id
  }

  private internalLeave() {
    if (this.state !== WebChannelState.LEAVING && this.state !== WebChannelState.LEFT) {
      this.signaling.close()
      this.topologyService.leave()
      this.setState(WebChannelState.LEFT)
    }
  }
}

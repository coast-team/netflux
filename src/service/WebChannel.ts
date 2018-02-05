import { Subject } from 'rxjs/Subject'
import { Subscription } from 'rxjs/Subscription'

import { Channel } from '../Channel'
import { generateKey, isURL, log, MAX_KEY_LENGTH, randNumbers } from '../misc/Util'
import { IMessage, Message, service, webChannel } from '../proto'
import { Signaling, SignalingState } from '../Signaling'
import { UserDataType, UserMessage } from '../UserMessage'
import { WebSocketBuilder } from '../WebSocketBuilder'
import { ChannelBuilder } from './ChannelBuilder'
import { IServiceMessageDecoded, IServiceMessageEncoded, Service } from './Service'
import { FullMesh } from './topology/FullMesh'
import { ITopology, TopologyEnum, TopologyStateEnum } from './topology/Topology'
import { WebRTCBuilder } from './WebRTCBuilder'

/**
 * Service id.
 */
const ID = 200

const REJOIN_TIMEOUT = 3000

/**
 * Timout for ping `WebChannel` in milliseconds.
 * @type {number}
 */
const PING_TIMEOUT = 5000

export interface IWebChannelOptions {
  topology?: TopologyEnum,
  signalingURL?: string,
  iceServers?: RTCIceServer[],
  autoRejoin?: boolean
}

export const defaultOptions: IWebChannelOptions = {
  topology: TopologyEnum.FULL_MESH,
  signalingURL: 'wss://signaling.netflux.coedit.re',
  iceServers: [
    {urls: 'stun:stun3.l.google.com:19302'},
  ],
  autoRejoin: true,
}

export enum WebChannelState { JOINING, JOINED, LEFT }

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 * [[include:installation.md]]
 */
export class WebChannel extends Service {

  /**
   * An array of all peer ids except yours.
   */
  readonly members: number[]

  /**
   * Topology id.
   */
  topology: TopologyEnum

  /**
   * WebChannel id.
   */
  id: number

  /**
   * Your id as a peer in the network.
   */
  myId: number

  /**
   * Unique string mandatory to join a network.
   */
  key: string

  /**
   * If true, when the connection with Signaling is closed, will continuously
   * trying to reconnect to Signaling until succeed in order to join the network.
   */
  autoRejoin: boolean

  /**
   * Thi handler is called each time the state of Signaling server changes.
   */
  onSignalingStateChange: (state: SignalingState) => void

  /**
   * Thi handler is called each time the state of the network changes.
   */
  onStateChange: (state: WebChannelState) => void

  /**
   * This handler is called when a new peer has joined the network.
   */
  onMemberJoin: (id: number) => void

  /**
   * This handler is called when a peer hes left the network.
   */
  onMemberLeave: (id: number) => void

  /**
   *  This handler is called when a message has been received from the network.
   */
  onMessage: (id: number, msg: UserDataType) => void

  serviceMessageSubject: Subject<IServiceMessageEncoded>
  webRTCBuilder: WebRTCBuilder
  webSocketBuilder: WebSocketBuilder
  channelBuilder: ChannelBuilder
  topologyService: ITopology
  state: WebChannelState
  signaling: Signaling

  private userMsg: UserMessage
  private pingTime: number
  private maxTime: number
  private pingFinish: (maxTime: number) => void
  private pongNb: number
  private rejoinTimer: any
  private isRejoinDisabled: boolean
  private topologySub: Subscription

  constructor ({
    topology = defaultOptions.topology,
    signalingURL = defaultOptions.signalingURL,
    iceServers = defaultOptions.iceServers,
    autoRejoin = defaultOptions.autoRejoin,
  }: IWebChannelOptions = {}) {
    super(10, webChannel.Message)

    // PUBLIC MEMBERS
    this.topology = topology
    this.id = this.generateId()
    this.myId = this.generateId()
    this.members = [this.myId]
    this.key = ''
    this.autoRejoin = autoRejoin

    // PUBLIC EVENT HANDLERS
    this.onMemberJoin = function none () {}
    this.onMemberLeave = function none () {}
    this.onMessage = function none () {}
    this.onStateChange = function none () {}
    this.onSignalingStateChange = function none () {}

    // PRIVATE
    this.state = WebChannelState.LEFT
    this.userMsg = new UserMessage()

    // Signaling init
    this.signaling = new Signaling(this, signalingURL)
    this.signaling.onChannel.subscribe((ch) => this.initChannel(ch))
    this.signaling.onState.subscribe(
      (state: SignalingState) => {
        log.signalingState(SignalingState[state], this.myId)
        this.onSignalingStateChange(state)
        if (state === SignalingState.CLOSED) {
          if (this.members.length === 1) {
            this.setState(WebChannelState.LEFT)
            if (this.isRejoinDisabled) {
              this.key = ''
            }
          }
          if (!this.isRejoinDisabled) {
            this.rejoin()
          }
        } else if (state === SignalingState.STABLE && this.members.length === 1) {
          this.setState(WebChannelState.JOINED)
        }
      },
    )

    // Services init
    this.serviceMessageSubject = new Subject()
    super.setupServiceMessage(this.serviceMessageSubject)
    this.webRTCBuilder = new WebRTCBuilder(this, iceServers)
    this.webSocketBuilder = new WebSocketBuilder(this)
    this.channelBuilder = new ChannelBuilder(this)
    this.onServiceMessage.subscribe(
      (msg) => this.treatServiceMessage(msg),
      (err) => console.error('service/WebChannel inner message error', err),
    )

    // Topology init
    this.setTopology(topology)
    // FIXME: manage topologyService onState subscription

    // Ping-pong init
    this.pingTime = 0
    this.maxTime = 0
    this.pingFinish = () => {}
    this.pongNb = 0
  }

  /**
   * Join the network via a key provided by one of the network member or a `Channel`.
   */
  join (key: string = generateKey()): void {
    if (this.state === WebChannelState.LEFT && this.signaling.state === SignalingState.CLOSED) {
      if (typeof key !== 'string') {
        throw new Error(`Failed to join: the key type "${typeof key}" is not a "string"`)
      } else if (key === '') {
        throw new Error('Failed to join: the key is an empty string')
      } else if (key.length > MAX_KEY_LENGTH) {
        throw new Error(
          `Failed to join : the key length of ${key.length} exceeds the maximum of ${MAX_KEY_LENGTH} characters`,
        )
      }
      this.key = key
      this.isRejoinDisabled = !this.autoRejoin
      this.setState(WebChannelState.JOINING)
      this.signaling.join(this.key)
    } else {
      console.warn('Trying to join a group while already joined or joining. Maybe forgot to call leave().')
    }
  }

  /**
   * Invite a server peer to join the network.
   */
  invite (url: string): void {
    if (isURL(url)) {
      this.webSocketBuilder.connect(`${url}/invite?wcId=${this.id}&senderId=${this.myId}`)
        .then((connection: WebSocket) => this.initChannel(new Channel(this, connection)))
        .catch((err) => console.error(`Failed to invite the bot ${url}: ${err.message}`))
    } else {
      throw new Error(`Failed to invite a bot: ${url} is not a valid URL`)
    }
  }

  /**
   * Close the connection with Signaling server.
   */
  closeSignaling (): void {
    this.isRejoinDisabled = true
    clearTimeout(this.rejoinTimer)
    this.signaling.close()
  }

  /**
   * Leave the network which means close channels with all peers and connection
   * with Signaling server.
   */
  leave () {
    this.key = ''
    this.isRejoinDisabled = true
    clearTimeout(this.rejoinTimer)
    this.initPing()
    this.topologyService.leave()
    this.signaling.close()
  }

  /**
   * Broadcast a message to the network.
   */
  send (data: UserDataType): void {
    if (this.members.length !== 1) {
      const msg: any = {
        senderId: this.myId,
        recipientId: 0,
        isService: false,
      }
      const chunkedData = this.userMsg.encode(data)
      for (const chunk of chunkedData) {
        msg.content = chunk
        this.topologyService.send(msg)
      }
    }
  }

  /**
   * Send a message to a particular peer in the network.
   */
  sendTo (id: number, data: UserDataType): void {
    if (this.members.length !== 1) {
      const msg: any = {
        senderId: this.myId,
        recipientId: id,
        isService: false,
      }
      const chunkedData = this.userMsg.encode(data)
      for (const chunk of chunkedData) {
        msg.content = chunk
        this.topologyService.sendTo(msg)
      }
    }
  }

  /**
   * Get the ping of the `network. It is an amount in milliseconds which
   * corresponds to the longest ping to each network member.
   */
  ping (): Promise<number> {
    if (this.members.length !== 1 && this.pingTime === 0) {
      return new Promise((resolve, reject) => {
        if (this.pingTime === 0) {
          this.pingTime = Date.now()
          this.maxTime = 0
          this.pongNb = 0
          this.pingFinish = (delay) => resolve(delay)
          this.sendProxy({ content: super.encode({ ping: true }) })
          setTimeout(() => resolve(PING_TIMEOUT), PING_TIMEOUT)
        }
      })
    } else {
      return Promise.reject(new Error('No peers to ping'))
    }
  }

  onMemberJoinProxy (id: number): void {
    if (!this.members.includes(id)) {
      this.members[this.members.length] = id
      this.onMemberJoin(id)
    }
  }

  onMemberLeaveProxy (id: number): void {
    if (this.members.includes(id)) {
      this.members.splice(this.members.indexOf(id), 1)
      this.onMemberLeave(id)
      if (this.members.length === 1 && this.signaling.state !== SignalingState.STABLE) {
        this.setState(WebChannelState.LEFT)
      }
    }
  }

  /**
   * Send service message to a particular peer in the network.
   */
  sendToProxy ({ senderId = this.myId, recipientId = this.myId, isService = true, content}:
    {senderId?: number, recipientId?: number, isService?: boolean, content?: Uint8Array} = {},
  ): void {
    const msg = {senderId, recipientId, isService, content}
    if (msg.recipientId === this.myId) {
      this.treatMessage(undefined, msg)
    } else {
      this.topologyService.sendTo(msg)
    }
  }

  /**
   * Broadcast service message to the network.
   */
  sendProxy ({ senderId = this.myId, recipientId = 0, isService = true, content, isMeIncluded = false}:
    {senderId?: number, recipientId?: number, isService?: boolean, content?: Uint8Array, isMeIncluded?: boolean} = {},
  ): void {
    const msg = {senderId, recipientId, isService, content}
    if (isMeIncluded) {
      this.treatMessage(undefined, msg)
    }
    this.topologyService.send(msg)
  }

  encode ({ senderId = this.myId, recipientId = 0, isService = true, content }:
    {senderId?: number, recipientId?: number, isService?: boolean, content?: Uint8Array} = {},
  ): Uint8Array {
    const msg = {senderId, recipientId, isService, content}
    return Message.encode(Message.create(msg)).finish()
  }

  /**
   * Message handler. All messages arrive here first.
   */
  onMessageProxy (channel: Channel, bytes: Uint8Array): void {
    const msg = Message.decode(new Uint8Array(bytes))
    // recipientId values:
    // 0: broadcast message
    // 1: is a message to me from a peer who does not know yet my ID
    if (msg.recipientId === 0 || msg.recipientId === this.myId || msg.recipientId === 1) {
      this.treatMessage(channel, msg)
    }
    if (msg.recipientId !== this.myId) {
      this.topologyService.forward(msg)
    }
  }

  private treatMessage (channel: Channel, msg: IMessage): void {
    // User Message
    if (!msg.isService) {
      const data = this.userMsg.decode(msg.content, msg.senderId)
      if (data !== undefined) {
        this.onMessage(msg.senderId, data)
      }

    // Service Message
    } else {
      this.serviceMessageSubject.next(Object.assign({
        channel,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
      }, service.Message.decode(msg.content)))
    }
  }

  private treatServiceMessage ({channel, senderId, recipientId, msg}: IServiceMessageDecoded): void {
    switch (msg.type) {
    case 'init': {
      const { topology, wcId, generatedIds, members } = msg.init
      // Check whether the intermidiary peer is already a member of your
      // network (possible when merging two networks (works with FullMesh)).
      // If it is a case then you are already a member of the network.
      if (this.members.includes(senderId)) {
        if (!generatedIds.includes(this.myId)) {
          console.warn(`Failed merge networks: my members contain intermediary peer id,
            but my id is not included into the intermediary peer members`)
          channel.close()
          return
        }
        if (this.topology !== topology) {
          console.warn('Failed merge networks: different topologies')
          channel.close()
          return
        }
        log.info(`I:${this.myId} close connection with intermediary member ${senderId},
          because already connected with him`)
        this.setState(WebChannelState.JOINED)
        channel.closeQuietly()
        log.debug('Here')
      } else {
        this.setTopology(topology)
        this.id = wcId
        channel.id = senderId
        channel.send(this.encode({
          recipientId: channel.id,
          content: super.encode({ initOk: true }),
        }))
        this.topologyService.initJoining(channel, members)
      }
      break
    }
    case 'initOk': {
      channel.id = senderId
      this.topologyService.addJoining(channel)
      break
    }
    case 'ping': {
      this.sendToProxy({
        recipientId: channel.id,
        content: super.encode({ pong: true }),
      })
      break
    }
    case 'pong': {
      const now = Date.now()
      this.pongNb++
      this.maxTime = Math.max(this.maxTime, now - this.pingTime)
      if (this.pongNb === this.members.length - 1) {
        this.pingFinish(this.maxTime)
        this.pingTime = 0
      }
      break
    }
    default:
      throw new Error(`Unknown message type: "${msg.type}"`)
    }
  }

  private setState (state: WebChannelState): void {
    if (this.state !== state) {
      log.webGroupState(WebChannelState[state], this.myId)
      this.state = state
      this.onStateChange(state)
      if (state === WebChannelState.LEFT) {
        this.initPing()
      }
    }
  }

  private initPing () {
    this.pingTime = 0
    this.maxTime = 0
    this.pingFinish = () => {}
    this.pongNb = 0
  }

  /**
   * Delegate adding a new peer in the network to topology.
   */
  private initChannel (ch: Channel): void {
    const msg = this.encode({
      recipientId: 1,
      content: super.encode({ init: {
        topology: this.topology,
        wcId: this.id,
        generatedIds: this.members,
        members: this.members,
      }}),
    })
    ch.send(msg)
  }

  private setTopology (topology: TopologyEnum): void {
    if (this.topologyService !== undefined) {
      if (this.topology !== topology) {
        this.topology = topology
        this.topologyService.clean()
        this.topologyService = new FullMesh(this)
        this.subscribeToTopology()
      }
    } else {
      this.topology = topology
      this.topologyService = new FullMesh(this)
      this.subscribeToTopology()
    }
  }

  private subscribeToTopology () {
    if (this.topologySub) {
      this.topologySub.unsubscribe()
    }
    this.topologySub = this.topologyService.onState.subscribe((state: TopologyStateEnum) => {
      switch (state) {
      case TopologyStateEnum.JOINED:
        this.setState(WebChannelState.JOINED)
        break
      case TopologyStateEnum.STABLE:
        this.signaling.open()
        break
      case TopologyStateEnum.FAILED:
        this.setState(WebChannelState.LEFT)
        console.warn('Failed to join: topology error')
        break
      }
    })
  }

  private rejoin () {
    this.setState(WebChannelState.JOINING)
    this.rejoinTimer = setTimeout(
      () => {
        log.info(`I:${this.myId} rejoin`)
        this.signaling.join(this.key)
      },
      REJOIN_TIMEOUT,
    )
  }

  /**
   * Generate random id for a `WebChannel` or a new peer.
   */
  private generateId (excludeIds: number[] = []): number {
    const id = randNumbers()[0]
    if (excludeIds.includes(id)) {
      return this.generateId()
    }
    return id
  }
}

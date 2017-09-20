import { Subject } from 'rxjs/Subject'

import { Channel } from '../Channel'
import { FullMesh } from './topology/FullMesh'
import { Service, ServiceMessageDecoded, ServiceMessageEncoded } from './Service'
import { Signaling, SignalingStateEnum } from '../Signaling'
import { ChannelBuilder } from './ChannelBuilder'
import { WebSocketBuilder } from '../WebSocketBuilder'
import { WebRTCBuilder } from './WebRTCBuilder'
import { IMessage, Message, webChannel, service } from '../proto'
import { UserMessage, UserDataType } from '../UserMessage'
import { isURL, generateKey, MAX_KEY_LENGTH } from '../misc/Util'
import { TopologyInterface, TopologyEnum } from './topology/Topology'

export interface Options {
  topology: TopologyEnum,
  signalingURL: string,
  iceServers: RTCIceServer[],
  autoRejoin: boolean
}

export const defaultOptions: Options = {
  topology: TopologyEnum.FULL_MESH,
  signalingURL: 'wss://www.coedit.re:10473',
  iceServers: [
    {urls: 'stun:stun3.l.google.com:19302'}
  ],
  autoRejoin: true
}

export enum StateEnum {
  JOINING,
  JOINED,
  LEFT
}

const REJOIN_TIMEOUT = 3000

/**
 * Timout for ping `WebChannel` in milliseconds.
 * @type {number}
 */
const PING_TIMEOUT = 5000

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
  public readonly members: number[]

  /**
   * Topology id.
   */
  public topology: TopologyEnum

  /**
   * WebChannel id.
   */
  public id: number

  /**
   * Your id as a peer in the network.
   */
  public myId: number

  /**
   * Unique string mandatory to join a network.
   */
  public key: string

  /**
   * If true, when the connection with Signaling is closed, will continuously
   * trying to reconnect to Signaling until succeed in order to join the network.
   */
  public autoRejoin: boolean

  /**
   * Thi handler is called each time the state of Signaling server changes.
   */
  public onSignalingStateChange: (state: SignalingStateEnum) => void

  /**
   * Thi handler is called each time the state of the network changes.
   */
  public onStateChange: (state: StateEnum) => void

  /**
   * This handler is called when a new peer has joined the network.
   */
  public onMemberJoin: (id: number) => void

  /**
   * This handler is called when a peer hes left the network.
   */
  public onMemberLeave: (id: number) => void

  /**
   *  This handler is called when a message has been received from the network.
   */
  public onMessage: (id: number, msg: UserDataType, isBroadcast: boolean) => void

  public joinSubject: Subject<Error|void>
  public serviceMessageSubject: Subject<ServiceMessageEncoded>
  public webRTCBuilder: WebRTCBuilder
  public webSocketBuilder: WebSocketBuilder
  public channelBuilder: ChannelBuilder
  public topologyService: TopologyInterface
  public state: StateEnum
  public signaling: Signaling

  private userMsg: UserMessage
  private pingTime: number
  private maxTime: number
  private pingFinish: (maxTime: number) => void
  private pongNb: number
  private rejoinTimer: any
  private isRejoinDisabled: boolean

  /**
   * @param options Web channel settings
   */
  constructor ({
    topology = defaultOptions.topology,
    signalingURL = defaultOptions.signalingURL,
    iceServers = defaultOptions.iceServers,
    autoRejoin = defaultOptions.autoRejoin
  } = {}) {
    super(10, webChannel.Message)

    // PUBLIC MEMBERS
    this.members = []
    this.topology = topology
    this.id = this.generateId()
    this.myId = this.generateId()
    this.key = ''
    this.autoRejoin = autoRejoin

    // PUBLIC EVENT HANDLERS
    this.onMemberJoin = () => {}
    this.onMemberLeave = () => {}
    this.onMessage = () => {}
    this.onStateChange = () => {}
    this.onSignalingStateChange = () => {}

    // PRIVATE
    this.state = StateEnum.LEFT
    this.userMsg = new UserMessage()

    // Signaling init
    this.signaling = new Signaling(this, signalingURL)
    this.signaling.onChannel.subscribe(ch => this.initChannel(ch))
    this.signaling.onState.subscribe(
      (state: SignalingStateEnum) => {
        this.onSignalingStateChange(state)
        switch (state) {
        case SignalingStateEnum.OPEN:
          this.setState(StateEnum.JOINING)
          break
        case SignalingStateEnum.READY_TO_JOIN_OTHERS:
          this.setState(StateEnum.JOINED)
          break
        case SignalingStateEnum.CLOSED:
          if (this.members.length === 0) {
            this.setState(StateEnum.LEFT)
          }
          if (!this.isRejoinDisabled) {
            this.rejoin()
          }
          break
        }
      }
    )

    // Services init
    this.serviceMessageSubject = new Subject()
    super.setupServiceMessage(this.serviceMessageSubject)
    this.webRTCBuilder = new WebRTCBuilder(this, iceServers)
    this.webSocketBuilder = new WebSocketBuilder(this)
    this.channelBuilder = new ChannelBuilder(this)
    this.onServiceMessage.subscribe(
      msg => this.treatServiceMessage(msg),
      err => console.error('service/WebChannel inner message error', err)
    )

    // Topology init
    this.setTopology(topology)
    this.joinSubject = new Subject()
    this.joinSubject.subscribe((err?: Error) => {
      if (err !== undefined) {
        console.error('Failed to join: ' + err.message, err)
        this.signaling.close()
      } else {
        this.setState(StateEnum.JOINED)
        this.signaling.open()
      }
    })

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
    if (this.state === StateEnum.LEFT && this.signaling.state === SignalingStateEnum.CLOSED) {
      this.isRejoinDisabled = !this.autoRejoin
      this.setState(StateEnum.JOINING)
      if (typeof key === 'string' && key.length < MAX_KEY_LENGTH) {
        this.key = key
      } else {
        throw new Error('Parameter of the join function should be either a Channel or a string')
      }
      this.signaling.join(this.key)
    } else {
      console.warn('Failed to join: already joining or joined')
    }
  }

  /**
   * Invite a server peer to join the network.
   */
  invite (url: string): void {
    if (isURL(url)) {
      this.webSocketBuilder.connect(`${url}/invite?wcId=${this.id}&senderId=${this.myId}`)
        .then(connection => this.initChannel(new Channel(this, connection)))
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
    this.signaling.close()
  }

  /**
   * Leave the network which means close channels with all peers and connection
   * with Signaling server.
   */
  leave () {
    this.isRejoinDisabled = true
    this.pingTime = 0
    this.maxTime = 0
    this.pingFinish = () => {}
    this.pongNb = 0
    this.topologyService.leave()
    this.signaling.close()
  }

  /**
   * Broadcast a message to the network.
   */
  send (data: UserDataType): void {
    if (this.members.length !== 0) {
      const msg: any = {
        senderId: this.myId,
        recipientId: 0,
        isService: false
      }
      const chunkedData = this.userMsg.encode(data)
      for (let chunk of chunkedData) {
        msg.content = chunk
        this.topologyService.send(msg)
      }
    }
  }

  /**
   * Send a message to a particular peer in the network.
   */
  sendTo (id: number, data: UserDataType): void {
    if (this.members.length !== 0) {
      const msg: any = {
        senderId: this.myId,
        recipientId: id,
        isService: false
      }
      const chunkedData = this.userMsg.encode(data)
      for (let chunk of chunkedData) {
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
    if (this.members.length !== 0 && this.pingTime === 0) {
      return new Promise((resolve, reject) => {
        if (this.pingTime === 0) {
          this.pingTime = Date.now()
          this.maxTime = 0
          this.pongNb = 0
          this.pingFinish = delay => resolve(delay)
          this.sendProxy({ content: super.encode({ ping: true }) })
          setTimeout(() => resolve(PING_TIMEOUT), PING_TIMEOUT)
        }
      })
    } else {
      return Promise.reject(new Error('No peers to ping'))
    }
  }

  onMemberJoinProxy (id: number): void {
    this.members[this.members.length] = id
    this.onMemberJoin(id)
  }

  onMemberLeaveProxy (id: number): void {
    this.members.splice(this.members.indexOf(id), 1)
    this.onMemberLeave(id)
    if (this.members.length === 0
      && (this.signaling.state === SignalingStateEnum.CONNECTING
      || this.signaling.state === SignalingStateEnum.CLOSED)
    ) {
      this.setState(StateEnum.LEFT)
    }
  }

  /**
   * Send service message to a particular peer in the network.
   */
  sendToProxy ({
    senderId = this.myId,
    recipientId = this.myId,
    isService = true,
    content = undefined
  } = {}): void {
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
  sendProxy ({
    senderId = this.myId,
    recipientId = 0,
    isService = true,
    content = undefined,
    isMeIncluded = false
  } = {}) {
    const msg = {senderId, recipientId, isService, content}
    if (isMeIncluded) {
      this.treatMessage(undefined, msg)
    }
    this.topologyService.send(msg)
  }

  encode ({
    senderId = this.myId,
    recipientId = 0,
    isService = true,
    content = undefined
  } = {}): Uint8Array {
    const msg = {senderId, recipientId, isService, content}
    return Message.encode(Message.create(msg)).finish()
  }

  /**
   * Message handler. All messages arrive here first.
   */
  onMessageProxy (channel: Channel, bytes: Uint8Array): void {
    const msg = Message.decode(new Uint8Array(bytes))
    switch (msg.recipientId) {
    // If the message is broadcasted
    case 0:
      this.treatMessage(channel, msg)
      this.topologyService.forward(msg)
      break

    // If it is a private message to me
    case this.myId:
      this.treatMessage(channel, msg)
      break

    // If is is a message to me from a peer who does not know yet my ID
    case 1:
      this.treatMessage(channel, msg)
      break

    // Otherwise the message should be forwarded to the intended peer
    default:
      this.topologyService.forwardTo(msg)
    }
  }

  private treatMessage (channel: Channel, msg: IMessage): void {
    // User Message
    if (!msg.isService) {
      const data = this.userMsg.decode(msg.content, msg.senderId)
      if (data !== undefined) {
        this.onMessage(msg.senderId, data, msg.recipientId === 0)
      }

    // Service Message
    } else {
      this.serviceMessageSubject.next(Object.assign({
        channel,
        senderId: msg.senderId,
        recipientId: msg.recipientId
      }, service.Message.decode(msg.content)))
    }
  }

  private treatServiceMessage ({channel, senderId, recipientId, msg}: ServiceMessageDecoded): void {
    switch (msg.type) {
    case 'init': {
      // Check whether the intermidiary peer is already a member of your
      // network (possible when merging two networks (works with FullMesh)).
      // If it is a case then you are already a member of the network.
      if (this.members.includes(senderId)) {
        this.setState(StateEnum.JOINED)
        this.signaling.open()
        channel.close()
      } else {
        const { topology, wcId, generatedIds } = msg.init
        if (this.members.length !== 0) {
          if (generatedIds.includes(this.myId) || this.topology !== topology) {
            this.joinSubject.next(new Error('Failed merge with another network'))
            channel.close()
            return
          }
        }
        this.setTopology(topology)
        if (generatedIds.includes(this.myId)) {
          this.myId = this.generateId(generatedIds)
        }
        this.id = wcId
        channel.peerId = senderId
        this.topologyService.initJoining(channel)
        channel.send(this.encode({
          recipientId: channel.peerId,
          content: super.encode({ initOk: { members: this.members} })
        }))
      }
      break
    }
    case 'initOk': {
      channel.peerId = senderId
      this.topologyService.addJoining(channel, msg.initOk.members)
      break
    }
    case 'ping': {
      this.sendToProxy({
        recipientId: channel.peerId,
        content: super.encode({ pong: true })
      })
      break
    }
    case 'pong': {
      const now = Date.now()
      this.pongNb++
      this.maxTime = Math.max(this.maxTime, now - this.pingTime)
      if (this.pongNb === this.members.length) {
        this.pingFinish(this.maxTime)
        this.pingTime = 0
      }
      break
    }
    default:
      throw new Error(`Unknown message type: "${msg.type}"`)
    }
  }

  private setState (state: StateEnum): void {
    if (this.state !== state) {
      this.state = state
      this.onStateChange(state)
    }
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
        generatedIds: this.members
      }})
    })
    ch.send(msg)
  }

  private setTopology (topology: TopologyEnum): void {
    if (this.topologyService !== undefined) {
      if (this.topology !== topology) {
        this.topology = topology
        this.topologyService.clean()
        this.topologyService = new FullMesh(this)
      }
    } else {
      this.topology = topology
      this.topologyService = new FullMesh(this)
    }
  }

  private rejoin () {
    this.rejoinTimer = setTimeout(
      () => this.signaling.join(this.key),
      REJOIN_TIMEOUT
    )
  }

  /**
   * Generate random id for a `WebChannel` or a new peer.
   */
  private generateId (excludeIds = []): number {
    const id = crypto.getRandomValues(new Uint32Array(1))[0]
    if (id === this.myId || this.members.includes(id)
      || (excludeIds.length !== 0 && excludeIds.includes(id))) {
      return this.generateId()
    }
    return id
  }
}

import { Subject } from 'rxjs/Subject'

import { Channel } from '../Channel'
import { FullMesh } from './topology/FullMesh'
import { Service } from './Service'
import { Signaling } from '../Signaling'
import { ChannelBuilder } from './ChannelBuilder'
import { WebSocketBuilder } from '../WebSocketBuilder'
import { WebRTCBuilder } from './WebRTCBuilder'
import { Message, webChannel, service } from '../Protobuf'
import { UserMessage, UserDataType } from '../UserMessage'
import { isURL, MessageI, ServiceMessageDecoded, generateKey, MAX_KEY_LENGTH } from '../Util'
import { defaults, WebChannelOptions } from '../defaults'
import { TopologyInterface } from './topology/TopologyInterface'

const REJOIN_TIMEOUT = 3000

/**
 * Timout for ping `WebChannel` in milliseconds.
 * @type {number}
 */
const PING_TIMEOUT = 5000

const INNER_ID = 100

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 * [[include:installation.md]]
 */
export class WebChannel extends Service {

  static JOINING = 0

  static JOINED = 1

  static LEFT = 2

  static SIGNALING_CONNECTING = Signaling.CONNECTING

  static SIGNALING_OPEN = Signaling.OPEN

  static SIGNALING_FIRST_CONNECTED = Signaling.FIRST_CONNECTED

  static SIGNALING_READY_TO_JOIN_OTHERS = Signaling.READY_TO_JOIN_OTHERS

  static SIGNALING_CLOSED = Signaling.CLOSED

  /**
   * An array of all peer ids except yours.
   */
  public members: number[]

  /**
   * Topology id.
   */
  public topology: number

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
  public onSignalingStateChanged: (state: number) => void

  /**
   * Thi handler is called each time the state of the network changes.
   */
  public onStateChanged: (state: number) => void

  /**
   * This handler is called when a new peer has joined the network.
   */
  public onPeerJoin: (id: number) => void

  /**
   * This handler is called when a peer hes left the network.
   */
  public onPeerLeave: (id: number) => void

  /**
   *  This handler is called when a message has been received from the network.
   */
  public onMessage: (id: number, msg: UserDataType, isBroadcast: boolean) => void

  // Private-public
  public _joinResult: Subject<Error|void>
  public webRTCBuilder: WebRTCBuilder
  public webSocketBuilder: WebSocketBuilder
  public channelBuilder: ChannelBuilder
  public _topology: TopologyInterface
  public _svcMsgStream: Subject<any>

  private _state: number
  private _signaling: Signaling
  private _userMsg: UserMessage
  private _pingTime: number
  private _maxTime: number
  private _pingFinish: (maxTime: number) => void
  private _pongNb: number
  private _rejoinTimer: any
  private _disableAutoRejoin: boolean

  /**
   * @param options Web channel settings
   */
  constructor ({
    topology = defaults.topology,
    signalingURL = defaults.signalingURL,
    iceServers = defaults.iceServers,
    autoRejoin = defaults.autoRejoin
  } = {}) {
    super(INNER_ID, webChannel.Message)

    // PUBLIC MEMBERS
    this.members = []
    this.topology = topology
    this.id = this._generateId()
    this.myId = this._generateId()
    this.key = undefined
    this.autoRejoin = autoRejoin

    // PUBLIC EVENT HANDLERS
    this.onPeerJoin = () => {}
    this.onPeerLeave = () => {}
    this.onMessage = () => {}
    this.onStateChanged = () => {}
    this.onSignalingStateChanged = () => {}

    // PRIVATE
    this._state = WebChannel.LEFT
    this._userMsg = new UserMessage()

    // Signaling init
    this._signaling = new Signaling(this, ch => this._initChannel(ch), signalingURL)
    this._signaling.onState.subscribe(
      state => {
        this.onSignalingStateChanged(state)
        switch (state) {
        case Signaling.OPEN:
          this._setState(WebChannel.JOINING)
          break
        case Signaling.READY_TO_JOIN_OTHERS:
          this._setState(WebChannel.JOINED)
          break
        case Signaling.CLOSED:
          if (this.members.length === 0) {
            this._setState(WebChannel.LEFT)
          }
          if (this.autoRejoin && !this._disableAutoRejoin) {
            this._rejoin()
          }
          break
        }
      }
    )

    // Services init
    this._svcMsgStream = new Subject()
    super.setSvcMsgStream(this._svcMsgStream)
    this.webRTCBuilder = new WebRTCBuilder(this, iceServers)
    this.webSocketBuilder = new WebSocketBuilder(this)
    this.channelBuilder = new ChannelBuilder(this)
    this.svcMsgStream.subscribe(
      msg => this._treatServiceMessage(msg),
      err => console.error('service/WebChannel inner message error', err)
    )

    // Topology init
    this._setTopology(topology)
    this._joinResult = new Subject()
    this._joinResult.subscribe((err?: Error) => {
      if (err !== undefined) {
        console.error('Failed to join: ' + err.message, err)
        this._signaling.close()
      } else {
        this._setState(WebChannel.JOINED)
        this._signaling.open()
      }
    })

    // Ping-pong init
    this._pingTime = 0
    this._maxTime = 0
    this._pingFinish = () => {}
    this._pongNb = 0
  }

  _setState (state: number): void {
    if (this._state !== state) {
      this._state = state
      this.onStateChanged(state)
    }
  }

  get state (): number {
    return this._state
  }

  get signalingState (): number {
    return this._signaling.state
  }

  get signalingURL (): string {
    return this._signaling.url
  }

  /**
   * Join the network via a key provided by one of the network member or a `Channel`.
   */
  join (value: string | Channel = generateKey()): void {
    if (this._state === WebChannel.LEFT && this._signaling.state === WebChannel.SIGNALING_CLOSED) {
      this._disableAutoRejoin = false
      this._setState(WebChannel.JOINING)
      if (!(value instanceof Channel)) {
        if ((typeof value === 'string' || value instanceof String) && value.length < MAX_KEY_LENGTH) {
          this.key = value
        } else {
          throw new Error('Parameter of the join function should be either a Channel or a string')
        }
        this._signaling.join(this.key)
      }
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
        .then(connection => this._initChannel(new Channel(this, connection)))
        .catch((err) => console.error(`Failed to invite the bot ${url}: ${err.message}`))
    } else {
      throw new Error(`Failed to invite a bot: ${url} is not a valid URL`)
    }
  }

  /**
   * Close the connection with Signaling server.
   */
  closeSignaling (): void {
    this._disableAutoRejoin = true
    this._signaling.close()
  }

  /**
   * Leave the network which means close channels with all peers and connection
   * with Signaling server.
   */
  leave () {
    this._disableAutoRejoin = true
    this._setState(WebChannel.LEFT)
    this._pingTime = 0
    this.members = []
    this._svcMsgStream.complete()
    this._signaling.close()
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
      const chunkedData = this._userMsg.encode(data)
      for (let chunk of chunkedData) {
        msg.content = chunk
        this._topology.send(msg)
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
      const chunkedData = this._userMsg.encode(data)
      for (let chunk of chunkedData) {
        msg.content = chunk
        this._topology.sendTo(msg)
      }
    }
  }

  /**
   * Get the ping of the `network. It is an amount in milliseconds which
   * corresponds to the longest ping to each network member.
   */
  ping (): Promise<number> {
    if (this.members.length !== 0 && this._pingTime === 0) {
      return new Promise((resolve, reject) => {
        if (this._pingTime === 0) {
          this._pingTime = Date.now()
          this._maxTime = 0
          this._pongNb = 0
          this._pingFinish = delay => resolve(delay)
          this._send({ content: super.encode({ ping: true }) })
          setTimeout(() => resolve(PING_TIMEOUT), PING_TIMEOUT)
        }
      })
    } else {
      return Promise.reject(new Error('No peers to ping'))
    }
  }

  _onPeerJoin (id: number): void {
    this.members[this.members.length] = id
    this.onPeerJoin(id)
  }

  _onPeerLeave (id: number): void {
    this.members.splice(this.members.indexOf(id), 1)
    this.onPeerLeave(id)
    if (this.members.length === 0
      && (this._signaling.state === Signaling.CONNECTING
      || this._signaling.state === Signaling.CLOSED)
    ) {
      this._setState(WebChannel.LEFT)
    }
  }

  /**
   * Send service message to a particular peer in the network.
   */
  _sendTo ({
    senderId = this.myId,
    recipientId = this.myId,
    isService = true,
    content = undefined
  } = {}): void {
    const msg = {senderId, recipientId, isService, content}
    if (msg.recipientId === this.myId) {
      this._treatMessage(undefined, msg)
    } else {
      this._topology.sendTo(msg)
    }
  }

  /**
   * Broadcast service message to the network.
   */
  _send ({
    senderId = this.myId,
    recipientId = 0,
    isService = true,
    content = undefined,
    isMeIncluded = false
  } = {}) {
    const msg = {senderId, recipientId, isService, content}
    if (isMeIncluded) {
      this._treatMessage(undefined, msg)
    }
    this._topology.send(msg)
  }

  _encode ({
    senderId = this.myId,
    recipientId = 0,
    isService = true,
    content = undefined
  } = {}): Uint8Array {
    const msg = {senderId, recipientId, isService, content}
    return Message.encode(Message.create(msg)).finish()
  }

  _decode (bytes: Uint8Array): MessageI {
    return Message.decode(new Uint8Array(bytes))
  }

  /**
   * Message handler. All messages arrive here first.
   */
  _onMessage (channel: Channel, bytes: Uint8Array): void {
    const msg = this._decode(bytes)
    switch (msg.recipientId) {
    // If the message is broadcasted
    case 0:
      this._treatMessage(channel, msg)
      this._topology.forward(msg)
      break

    // If it is a private message to me
    case this.myId:
      this._treatMessage(channel, msg)
      break

    // If is is a message to me from a peer who does not know yet my ID
    case 1:
      this._treatMessage(channel, msg)
      break

    // Otherwise the message should be forwarded to the intended peer
    default:
      this._topology.forwardTo(msg)
    }
  }

  private _treatMessage (channel: Channel, msg: MessageI): void {
    // User Message
    if (!msg.isService) {
      const data = this._userMsg.decode(msg.content, msg.senderId)
      if (data !== undefined) {
        this.onMessage(msg.senderId, data, msg.recipientId === 0)
      }

    // Service Message
    } else {
      this._svcMsgStream.next(Object.assign({
        channel,
        senderId: msg.senderId,
        recipientId: msg.recipientId
      }, service.Message.decode(msg.content)))
    }
  }

  private _treatServiceMessage ({channel, senderId, recipientId, msg}: ServiceMessageDecoded): void {
    switch (msg.type) {
    case 'init': {
      // Check whether the intermidiary peer is already a member of your
      // network (possible when merging two networks (works with FullMesh)).
      // If it is a case then you are already a member of the network.
      if (this.members.includes(senderId)) {
        this._setState(WebChannel.JOINED)
        this._signaling.open()
        channel.close()
      } else {
        const { topology, wcId, generatedIds } = msg.init
        if (this.members.length !== 0) {
          if (generatedIds.includes(this.myId) || this.topology !== topology) {
            this._joinResult.next(new Error('Failed merge with another network'))
            channel.close()
            return
          }
        }
        this._setTopology(topology)
        if (generatedIds.includes(this.myId)) {
          this.myId = this._generateId(generatedIds)
        }
        this.id = wcId
        channel.peerId = senderId
        this._topology.initJoining(channel)
        channel.send(this._encode({
          recipientId: channel.peerId,
          content: super.encode({ initOk: { members: this.members} })
        }))
      }
      break
    }
    case 'initOk': {
      channel.peerId = senderId
      this._topology.addJoining(channel, msg.initOk.members)
      break
    }
    case 'ping': {
      this._sendTo({
        recipientId: channel.peerId,
        content: super.encode({ pong: true })
      })
      break
    }
    case 'pong': {
      const now = Date.now()
      this._pongNb++
      this._maxTime = Math.max(this._maxTime, now - this._pingTime)
      if (this._pongNb === this.members.length) {
        this._pingFinish(this._maxTime)
        this._pingTime = 0
      }
      break
    }
    default:
      throw new Error(`Unknown message type: "${msg.type}"`)
    }
  }

  /**
   * Delegate adding a new peer in the network to topology.
   */
  private _initChannel (ch: Channel): void {
    const msg = this._encode({
      recipientId: 1,
      content: super.encode({ init: {
        topology: this._topology.serviceId,
        wcId: this.id
      }})
    })
    ch.send(msg)
  }

  private _setTopology (topology: number): void {
    if (this._topology !== undefined) {
      if (this.topology !== topology) {
        this.topology = topology
        this._topology.clean()
        this._topology = new FullMesh(this)
      }
    } else {
      this.topology = topology
      this._topology = new FullMesh(this)
    }
  }

  private _rejoin () {
    this._rejoinTimer = setTimeout(
      () => this._signaling.join(this.key),
      REJOIN_TIMEOUT
    )
  }

  /**
   * Generate random id for a `WebChannel` or a new peer.
   */
  private _generateId (excludeIds = []): number {
    const id = crypto.getRandomValues(new Uint32Array(1))[0]
    if (id === this.myId || this.members.includes(id)
      || (excludeIds.length !== 0 && excludeIds.includes(id))) {
      return this._generateId()
    }
    return id
  }
}

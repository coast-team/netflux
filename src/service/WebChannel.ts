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
import { isURL, MessageI, ServiceMessageDecoded } from '../Util'
import { defaults, WebChannelOptions } from '../defaults'
import { TopologyInterface } from './topology/TopologyInterface'

/**
 * Maximum identifier number for {@link WebChannel#_generateId} function.
 * @type {number}
 */
const MAX_ID = 2147483647
const REJOIN_MAX_ATTEMPTS = 10
const REJOIN_TIMEOUT = 2000

/**
 * Timout for ping `WebChannel` in milliseconds.
 * @type {number}
 */
const PING_TIMEOUT = 5000

const ID_TIMEOUT = 10000

const INNER_ID = 100

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 */
export class WebChannel extends Service {

  static JOINING = 0

  static JOINED = 1

  static DISCONNECTED = 2

  static SIGNALING_CONNECTING = Signaling.CONNECTING

  static SIGNALING_CONNECTED = Signaling.CONNECTED

  static SIGNALING_OPEN = Signaling.OPEN

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
   * Unique string mandatory to join a network
   */
  public key: string

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
  public _joinSucceed: () => void
  public _joinFailed: (err?: string) => void
  public webRTCBuilder: WebRTCBuilder
  public webSocketBuilder: WebSocketBuilder
  public channelBuilder: ChannelBuilder
  public _topology: TopologyInterface
  public _svcMsgStream: Subject<any>

  private _generatedIds: Set<number>
  private _state: number
  private _signaling: Signaling
  private _userMsg: UserMessage
  private _pingTime: number
  private _maxTime: number
  private _pingFinish: (maxTime: number) => void
  private _pongNb: number

  /**
   * @param {WebChannelSettings} settings Web channel settings
   */
  constructor ({
    topology = defaults.topology,
    signalingURL = defaults.signalingURL,
    iceServers = defaults.iceServers
  } = {}) {
    super(INNER_ID, webChannel.Message)
    this._generatedIds = new Set()

    // public members
    this.members = []
    this.topology = topology
    this.id = this._generateId()
    this.myId = this._generateId()
    this.key = undefined

    // public event handlers
    this.onPeerJoin = () => {}
    this.onPeerLeave = () => {}
    this.onMessage = () => {}
    this.onStateChanged = () => {}
    this.onSignalingStateChanged = () => {}

    // private
    this._state = WebChannel.DISCONNECTED
    this._signaling = new Signaling(this, ch => this._addChannel(ch), signalingURL)
    this._signaling.onStateChanged = state => {
      if (state === Signaling.CLOSED && this.members.length === 0) {
        this._setState(WebChannel.DISCONNECTED)
      }
      this.onSignalingStateChanged(state)
    }
    this._userMsg = new UserMessage()

    this._svcMsgStream = new Subject()
    super.setSvcMsgStream(this._svcMsgStream)
    this.webRTCBuilder = new WebRTCBuilder(this, iceServers)
    this.webSocketBuilder = new WebSocketBuilder(this)
    this.channelBuilder = new ChannelBuilder(this)
    this.svcMsgStream.subscribe(
      msg => this._treatServiceMessage(msg),
      err => console.error('service/WebChannel inner message error', err)
    )
    this._setTopology(topology)

    this._joinSucceed = () => {}
    this._joinFailed = () => {}

    // Related to ping-pong
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
  join (value: string | Channel): Promise<void> {
    if (this._state === WebChannel.DISCONNECTED) {
      this._setState(WebChannel.JOINING)
      return new Promise((resolve, reject) => {
        if (value instanceof Channel) {
          this._joinSucceed = () => {
            this._setState(WebChannel.JOINED)
            resolve()
          }
          this._joinFailed = err => {
            this._setState(WebChannel.DISCONNECTED)
            reject(err)
          }
        } else {
          if (value === undefined) {
            this.key = this._generateKey()
          } else if ((typeof value === 'string' || value instanceof String) && value.length < 512) {
            this.key = value
          } else {
            throw new Error('Parameter of the join function should be either a Channel or a string')
          }
          this._joinRecursively(() => resolve(), err => reject(err), 0)
        }
      })
    }
    return Promise.reject(new Error('Could not join: already joining or joined'))
  }

  /**
   * Invite a server peer to join the network.
   */
  invite (url: string): Promise<void> {
    if (isURL(url)) {
      return this.webSocketBuilder.connect(`${url}/invite?wcId=${this.id}&senderId=${this.myId}`)
        .then(connection => this._addChannel(new Channel(connection, this)))
    } else {
      return Promise.reject(new Error(`${url} is not a valid URL`))
    }
  }

  /**
   * TODO
   */
  openSignaling () { }

  /**
   * Close the connection with Signaling server.
   */
  closeSignaling (): void {
    this._signaling.close()
  }

  /**
   * Leave the network which means close channels with all peers and connection
   * with Signaling server.
   */
  disconnect () {
    this._setState(WebChannel.DISCONNECTED)
    this._pingTime = 0
    this.members = []
    this._joinSucceed = () => {}
    this._joinFailed = () => {}
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
    if (this.members.length === 0 && this._signaling.state === Signaling.CLOSED) {
      this._setState(WebChannel.DISCONNECTED)
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

  private _treatServiceMessage ({channel, senderId, recipientId, msg}: ServiceMessageDecoded) {
    switch (msg.type) {
    case 'initWebChannel': {
      const { topology, wcId, peerId } = msg.initWebChannel
      this._setTopology(topology)
      this.myId = peerId
      this.id = wcId
      channel.peerId = senderId
      this._topology.initJoining(channel)
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
  private _addChannel (ch: Channel): void {
    ch.peerId = this._generateId()
    const msg = this._encode({
      recipientId: 1,
      content: super.encode({initWebChannel: {
        topology: this._topology.serviceId,
        wcId: this.id,
        peerId: ch.peerId
      }})
    })
    ch.send(msg)
    this._topology.addJoining(ch)
  }

  private _joinRecursively (resolve: () => void, reject: (err?: Error) => void, attempt: number): void {
    this._signaling.join(this.key)
      .then(ch => {
        if (ch) {
          this._joinSucceed = () => {
            this._signaling.open()
            this._setState(WebChannel.JOINED)
            resolve()
          }
          this._joinFailed = str => {
            this._setState(WebChannel.DISCONNECTED)
            reject(new Error(str))
          }
        } else {
          this._setState(WebChannel.JOINED)
          resolve()
        }
      })
      .catch(err => {
        console.warn(`Failed to join via ${this.signalingURL} with ${this.key} key: ${err.message}`)
        if (attempt === REJOIN_MAX_ATTEMPTS) {
          reject(new Error(`Failed to join via ${this.signalingURL} with `
            + `${this.key} key: reached maximum rejoin attempts (${REJOIN_MAX_ATTEMPTS})`))
        } else {
          console.info(`Trying to rejoin in ${REJOIN_TIMEOUT} the ${attempt + 1} time... `)
          setTimeout(() => {
            this._joinRecursively(() => resolve(), err => reject(err), ++attempt)
          }, REJOIN_TIMEOUT)
        }
      })
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

  /**
   * Generate random id for a `WebChannel` or a new peer.
   */
  private _generateId (): number {
    do {
      const id = Math.ceil(Math.random() * MAX_ID)
      if (id === this.myId) {
        continue
      }
      if (this.members.includes(id)) {
        continue
      }
      if (this._generatedIds.has(id)) {
        continue
      }
      this._generatedIds.add(id)
      setTimeout(() => this._generatedIds.delete(id), ID_TIMEOUT)
      return id
    } while (true)
  }

  /**
   * Generate random key which will be used to join the network.
   */
  private _generateKey (): string {
    const MIN_LENGTH = 5
    const DELTA_LENGTH = 0
    const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH)

    for (let i = 0; i < length; i++) {
      result += MASK[Math.round(Math.random() * (MASK.length - 1))]
    }
    return result
  }
}

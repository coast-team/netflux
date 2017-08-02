import { Subject } from 'rxjs/Subject'

import { Channel } from '../Channel'
import { SprayService } from './topology/spray/SprayService'
import { Service } from './Service'
import { Signaling, CONNECTING, CONNECTED, OPEN, CLOSED } from '../Signaling'
import { ChannelBuilder } from './ChannelBuilder'
import { WebSocketBuilder } from '../WebSocketBuilder'
import { WebRTCBuilder } from './WebRTCBuilder'
import { Message, webChannel, service, spray } from '../Protobuf'
import { UserMessage } from '../UserMessage'
import { Util } from '../Util'
import { defaults } from '../defaults'

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

const JOINING = 0
const JOINED = 1
export const DISCONNECTED = 2

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 */
export class WebChannel extends Service {
  /**
   * @param {WebChannelSettings} settings Web channel settings
   */
  constructor ({
    topology = defaults.topology,
    signalingURL = defaults.signalingURL,
    iceServers = defaults.iceServers
  } = {}) {
    super(INNER_ID, webChannel.Message)
    /**
     * An array of all peer ids except this.
     * @type {number[]}
     */
    this.members = []

    this.topology = topology

    /**
     * @private
     * @type {Set<number>}
     */
    this._generatedIds = new Set()

    /**
     * Unique `WebChannel` identifier. Its value is the same for all `WebChannel` members.
     * @type {number}
     */
    this.id = this._generateId()

    /**
     * Unique peer identifier of you in this `WebChannel`. After each `join` function call
     * this id will change, because it is up to the `WebChannel` to assign it when
     * you join.
     * @type {number}
     */
    this.myId = this._generateId()

    this.key = undefined

    this._state = DISCONNECTED

    this._signaling = new Signaling(this, ch => this._addChannel(ch), signalingURL)
    this._signaling.onStateChanged = state => {
      if (state === CLOSED && this.members.length === 0) {
        this._setState(DISCONNECTED)
      }
      this.onSignalingStateChanged(state)
    }

    /**
     * @private
     * @type {Date}
     */
    this._pingTime = 0

    /**
     * @private
     * @type {number}
     */
    this._maxTime = 0

    /**
     * @private
     * @type {function(delay: number)}
     */
    this._pingFinish = () => {}

    /**
     * @private
     * @type {number}
     */
    this._pongNb = 0

    /**
     * Is the event handler called when a new peer has  joined the `WebChannel`.
     * @type {function(id: number)}
     */
    this.onPeerJoin = () => {}

    /**
     * Is the event handler called when a peer hes left the `WebChannel`.
     * @type {function(id: number)}
     */
    this.onPeerLeave = () => {}

    /**
     * Is the event handler called when a message is available on the `WebChannel`.
     * @type {function(id: number, msg: UserMessage, isBroadcast: boolean)}
     */
    this.onMessage = () => {}

    this.onStateChanged = () => {}

    this.onSignalingStateChanged = () => {}

    /**
     * This event handler is used to resolve *Promise* in {@link WebChannel#join}.
     * @private
     */
    this._joinSucceed = () => {}
    this._joinFailed = () => {}

    /**
     * Message builder service instance.
     *
     * @private
     * @type {MessageService}
     */
    this._userMsg = new UserMessage()

    this._svcMsgStream = new Subject()
    super.setSvcMsgStream(this._svcMsgStream)
    this.webRTCBuilder = new WebRTCBuilder(this, iceServers)
    this.webSocketBuilder = new WebSocketBuilder(this)
    this.channelBuilder = new ChannelBuilder(this)
    this.svcMsgStream.subscribe(
      msg => this._handleServiceMessage(msg),
      err => console.error('service/WebChannel inner message error', err)
    )

    /**
     * `WebChannel` topology.
     * @private
     * @type {Service}
     */
    this._setTopology(topology)
  }

  _setState (state) {
    if (this._state !== state) {
      this._state = state
      this.onStateChanged(state)
    }
  }

  static get JOINING () { return JOINING }

  static get JOINED () { return JOINED }

  static get DISCONNECTED () { return DISCONNECTED }

  static get SIGNALING_CONNECTING () { return CONNECTING }

  static get SIGNALING_CONNECTED () { return CONNECTED }

  static get SIGNALING_OPEN () { return OPEN }

  static get SIGNALING_CLOSED () { return CLOSED }

  get state () {
    return this._state
  }

  get signalingState () {
    return this._signaling.state
  }

  get signalingURL () {
    return this._signaling.url
  }

  /**
   * Join the `WebChannel`.
   *
   * @param  {string|WebSocket} value The key provided by one of the `WebChannel` members or a socket
   * @returns {Promise<undefined,string>} It resolves once you became a `WebChannel` member.
   */
  join (value) {
    if (this._state === DISCONNECTED) {
      this._setState(JOINING)
      return new Promise((resolve, reject) => {
        if (value instanceof Channel) {
          this._joinSucceed = () => {
            this._setState(JOINED)
            resolve()
          }
          this._joinFailed = err => {
            this._setState(DISCONNECTED)
            reject(err)
          }
        } else {
          if (value === undefined) {
            this.key = this.generateKey()
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
   * Invite a peer to join the `WebChannel`.
   *
   * @param {string} url
   *
   * @returns {Promise<undefined,string>}
   */
  invite (url) {
    if (Util.isURL(url)) {
      return this.webSocketBuilder.connect(`${url}/invite?wcId=${this.id}&senderId=${this.myId}`)
        .then(connection => this._addChannel(new Channel(connection, this)))
    } else {
      return Promise.reject(new Error(`${url} is not a valid URL`))
    }
  }

  /**
   * Enable other peers to join the `WebChannel` with your help as an
   * intermediary peer.
   */
  openSignaling () {
    // if (key !== undefined) {
    //   return this._signaling.open(this.settings.signalingURL, key)
    // } else {
    //   return this._signaling.open(this.settings.signalingURL)
    // }
  }

  /**
   * Prevent clients to join the `WebChannel` even if they possesses a key.
   */
  closeSignaling () {
    this._signaling.close()
  }

  /**
   * Leave the `WebChannel`. No longer can receive and send messages to the group.
   */
  disconnect () {
    this._setState(DISCONNECTED)
    this._pingTime = 0
    this.members = []
    this._joinSucceed = () => {}
    this._joinFailed = () => {}
    this._svcMsgStream.complete()
    this._signaling.close()
  }

  /**
   * Send the message to all `WebChannel` members.
   * @param  {UserMessage} data - Message
   */
  send (data) {
    if (this.members.length !== 0) {
      const msg = {
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
   * Send the message to a particular peer in the `WebChannel`.
   * @param  {number} id - Id of the recipient peer
   * @param  {UserMessage} data - Message
   */
  sendTo (id, data) {
    if (this.members.length !== 0) {
      const msg = {
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
   * Get the ping of the `WebChannel`. It is an amount in milliseconds which
   * corresponds to the longest ping to each `WebChannel` member.
   * @returns {Promise}
   */
  ping () {
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
    } else return Promise.reject(new Error('No peers to ping'))
  }

  /**
   * @private
   * @param {Channel} ch
   *
   * @returns {Promise<undefined,string>}
   */
  _addChannel (ch) {
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
    return this._topology.addJoining(ch)
  }

  /**
   * @private
   * @param {number} peerId
   */
  _onPeerJoin (peerId) {
    this.members[this.members.length] = peerId
    this.onPeerJoin(peerId)
  }

  /**
   * @private
   * @param {number} peerId
   */
  _onPeerLeave (peerId) {
    this.members.splice(this.members.indexOf(peerId), 1)
    this.onPeerLeave(peerId)
    if (this.members.length === 0 && this._signaling.state === CLOSED) {
      this._setState(DISCONNECTED)
    }
  }

  /**
   * Send a message to a service of the same peer, joining peer or any peer in
   * the `WebChannel`.
   * @private
   * @param {Object} msg
   * @param {string} [msg.serviceId] - Service id
   * @param {number} [msg.recipientId] - Identifier of recipient peer id
   * @param {boolean} [msg.isService] - SHould the message be forwarded?
   * @param {Object} [msg.content] - Message to send
   */
  _sendTo ({
    senderId = this.myId,
    recipientId = this.myId,
    isService = true,
    content = new Uint8Array(),
    meta = undefined
  } = {}) {
    const msg = {senderId, recipientId, isService, content, meta}
    if (msg.recipientId === this.myId) {
      this._handleMyMessage(undefined, msg)
    } else {
      this._topology.sendTo(msg)
    }
  }

  /**
   * @private
   * @param {Object} msg
   * @param {boolean} isMeIncluded
   */
  _send ({
    senderId = this.myId,
    recipientId = 0,
    isService = true,
    content = new Uint8Array(),
    meta = undefined,
    isMeIncluded = false
  } = {}) {
    const msg = {senderId, recipientId, isService, content, meta}
    if (isMeIncluded) {
      this._handleMyMessage(undefined, msg)
    }
    this._topology.send(msg)
  }

  /**
   * Message event handler (`WebChannel` mediator). All messages arrive here first.
   * @private
   * @param {Channel} channel - The channel the message came from
   * @param {external:ArrayBuffer} bytes - Message
   */
  _onMessage (channel, bytes) {
    console.info(this.myId + ' new message incoming from ' + channel.peerId)
    const msg = this._decode(bytes)

    switch (msg.recipientId) {
      // If the message is broadcasted
      case 0:
        // console.info(this.myId + ' broadcast message from ' + channel.peerId, msg)
        console.warn(this.myId + ' broadcast message from ' + channel.peerId + ` ${msg.senderId} => ${msg.recipientId}`, msg)
        if (msg.meta && msg.meta.timestamp !== undefined) {
          console.warn(this.myId + ' timestamp : ' + msg.meta.timestamp)
        }
        this._handleMyMessage(channel, msg)
        this._topology.forward(msg)
        break

      // If it is a private message to me
      case this.myId:
        // console.info(this.myId + ' message for me from ' + channel.peerId, msg)
        console.warn(this.myId + ' message for me from ' + channel.peerId + ` ${msg.senderId} => ${msg.recipientId}`)
        if (msg.meta && msg.meta.timestamp !== undefined) {
          console.warn(this.myId + ' timestamp : ' + msg.meta.timestamp)
        }
        this._handleMyMessage(channel, msg)
        break

      // If is is a message to me from a peer who does not know yet my ID
      case 1:
        // console.info(this.myId + ' init message for me from ' + channel.peerId, msg)
        console.warn(this.myId + ' init message for me from ' + channel.peerId + ` ${msg.senderId} => ${msg.recipientId}`)
        if (msg.meta && msg.meta.timestamp !== undefined) {
          console.warn(this.myId + ' timestamp : ' + msg.meta.timestamp)
        }
        this._handleMyMessage(channel, msg)
        break

      // Otherwise the message should be forwarded to the intended peer
      default:
        try {
          let jpsString = ''
          for (let [key, value] of this._topology.jps) {
            jpsString += `${key} => ${value.peerId}\n`
          }
          // console.warn(this.myId + ' forwardTo from ' + channel.peerId + ' : ' + msg.senderId + ' => ' + msg.recipientId, msg, '\n' + this._topology.p.toString() + '\n', jpsString)
          console.warn(this.myId + ' forwardTo from ' + channel.peerId + ' : ' + msg.senderId + ' => ' + msg.recipientId, '\n' + this._topology.p.toString() + '\n', jpsString)
          if (msg.meta && msg.meta.timestamp !== undefined) {
            console.warn(this.myId + ' timestamp : ' + msg.meta.timestamp)
          }
        } catch (e) {
          // Do nothing
        }
        this._topology.forwardTo(msg)
    }
  }

  _handleMyMessage (channel, msg) {
    if (!msg.isService) {
      // User Message
      // console.info(this.myId + ' User Message from ' + channel.peerId, msg)
      const data = this._userMsg.decode(msg.content, msg.senderId)
      if (data !== undefined) {
        this.onMessage(msg.senderId, data, msg.recipientId === 0)
      }
    } else {
      // Inner Message
      // console.info(this.myId + ' Inner message from ' + channel.peerId, msg)
      try {
        if (JSON.stringify(spray.Message.decode(service.Message.decode(msg.content).content)) !== {}) {
          console.info(this.myId + ' content1 : ' + JSON.stringify(spray.Message.decode(service.Message.decode(msg.content).content)))
        } else if (JSON.stringify(super.decode(service.Message.decode(msg.content).content)) !== {}) {
          console.info(this.myId + ' content2 : ' + JSON.stringify(super.decode(service.Message.decode(msg.content).content)))
        } else if (JSON.stringify(this.decode(service.Message.decode(msg.content).content)) !== {}) {
          console.info(this.myId + ' content3 : ' + JSON.stringify(this.decode(service.Message.decode(msg.content).content)))
        } else {
          console.info(this.myId + ' undecodable ')
        }
      } catch (e) {
        try {
          if (JSON.stringify(super.decode(service.Message.decode(msg.content).content)) !== {}) {
            console.info(this.myId + ' content2 : ' + JSON.stringify(super.decode(service.Message.decode(msg.content).content)))
          } else if (JSON.stringify(this.decode(service.Message.decode(msg.content).content)) !== {}) {
            console.info(this.myId + ' content3 : ' + JSON.stringify(this.decode(service.Message.decode(msg.content).content)))
          } else {
            console.info(this.myId + ' undecodable ')
          }
        } catch (e2) {
          try {
            if (JSON.stringify(this.decode(service.Message.decode(msg.content).content)) !== {}) {
              console.info(this.myId + ' content3 : ' + JSON.stringify(this.decode(service.Message.decode(msg.content).content)))
            } else {
              console.info(this.myId + ' undecodable ')
            }
          } catch (e3) {
            console.info(this.myId + ' undecodable ' + e)
          }
        }
      }
      if (msg.hasOwnProperty('meta')) {
        this._svcMsgStream.next(Object.assign({
          channel,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          timestamp: msg.meta.timestamp
        }, service.Message.decode(msg.content)))
      } else {
        this._svcMsgStream.next(Object.assign({
          channel,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          timestamp: undefined
        }, service.Message.decode(msg.content)))
      }
    }
  }

  _handleServiceMessage ({channel, senderId, recipientId, msg}) {
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
        console.warn(this.myId + ' this.members.length : ' + this.members.length + ', this._pongNb : ' + this._pongNb)
        if (this._pongNb === this.members.length) {
          this._pingFinish(this._maxTime)
          console.warn(this.myId + ' this._maxtime : ' + this._maxTime)
          this._pingTime = 0
        }
        break
      }
      default:
        throw new Error(`Unknown message type: "${msg.type}"`)
    }
  }

  /**
   *
   * @private
   * @param  {[type]} resolve
   * @param  {[type]} reject
   * @param  {[type]} attempt
   * @return {void}
   */
  _joinRecursively (resolve, reject, attempt) {
    this._signaling.join(this.key)
      .then(ch => {
        if (ch) {
          this._joinSucceed = () => {
            this._signaling.open()
            this._setState(JOINED)
            resolve()
          }
          this._joinFailed = err => {
            this._setState(DISCONNECTED)
            reject(err)
          }
        } else {
          this._setState(JOINED)
          resolve()
        }
      })
      .catch(err => {
        console.warn(`Failed to join via ${this.signalingURL} with ${this.key} key: ${err.message}`)
        if (attempt === REJOIN_MAX_ATTEMPTS) {
          reject(new Error(`Failed to join via ${this.signalingURL} with ${this.key} key: reached maximum rejoin attempts (${REJOIN_MAX_ATTEMPTS})`))
        } else {
          console.info(`Trying to rejoin in ${REJOIN_TIMEOUT} the ${attempt + 1} time... `)
          setTimeout(() => {
            this._joinRecursively(() => resolve(), err => reject(err), ++attempt)
          }, REJOIN_TIMEOUT)
        }
      })
  }

  _setTopology (topology) {
    if (this._topology !== undefined) {
      if (this.topology !== topology) {
        this.topology = topology
        this._topology.clean()
        // this._topology = new FullMesh(this)
        this._topology = new SprayService(this)
      }
    } else {
      this.topology = topology
      // this._topology = new FullMesh(this)
      this._topology = new SprayService(this)
    }
  }

  /**
   * Generate random id for a `WebChannel` or a new peer.
   * @private
   * @returns {number} - Generated id
   */
  _generateId () {
    do {
      const id = Math.ceil(Math.random() * MAX_ID)
      if (id === this.myId) continue
      if (this.members.includes(id)) continue
      if (this._generatedIds.has(id)) continue
      this._generatedIds.add(id)
      setTimeout(() => this._generatedIds.delete(id), ID_TIMEOUT)
      return id
    } while (true)
  }

  _encode ({
    senderId = this.myId,
    recipientId = 0,
    isService = true,
    content = new Uint8Array(),
    meta = undefined
  } = {}) {
    const msg = {senderId, recipientId, isService, content, meta}
    return Message.encode(Message.create(msg)).finish()
  }

  _decode (bytes) {
    return Message.decode(new Uint8Array(bytes))
  }
}

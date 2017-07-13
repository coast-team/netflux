import { Subject } from 'rxjs/Subject'

import { Channel } from '../Channel'
import { FullMesh } from './topology/FullMesh'
import { Service } from './Service'
import { SignalingGate } from '../SignalingGate'
import { ChannelBuilder } from './ChannelBuilder'
import { WebSocketBuilder } from '../WebSocketBuilder'
import { WebRTCBuilder } from './WebRTCBuilder'
import { Message, webChannel, service } from '../Protobuf'
import { UserMessage } from '../UserMessage'
import { Util } from '../Util'
import * as log from '../log'

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
  /**
   * @param {WebChannelSettings} settings Web channel settings
   */
  constructor (settings) {
    super(INNER_ID, webChannel.Message)
    /**
     * @private
     * @type {WebChannelSettings}
     */
    this.settings = settings

    /**
     * This event handler is used to resolve *Promise* in {@link WebChannel#join}.
     * @private
     */
    this._joinSucceed = () => {}
    this._joinFailed = () => {}

    /**
     * An array of all peer ids except this.
     * @type {number[]}
     */
    this.members = []

    /**
     * @private
     * @type {Set<number>}
     */
    this._generatedIds = new Set()

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

    /**
     * Is the event handler called when the `WebChannel` has been closed.
     * @type {function(closeEvt: CloseEvent)}
     */
    this.onClose = () => {}

    /**
     * Message builder service instance.
     *
     * @private
     * @type {MessageService}
     */
    this._userMsg = new UserMessage()

    this._msgStream = new Subject()
    this.webRTCSvc = new WebRTCBuilder(this, this.settings.iceServers, this._msgStream)
    this.webSocketSvc = new WebSocketBuilder(this)
    this._signalingGate = new SignalingGate(this, ch => this._addChannel(ch))
    this.channelBuilderSvc = new ChannelBuilder(this)
    super.setInnerStream(this._msgStream)
    this.innerMessageSubscritption = this.innerStream.subscribe(
      (msg) => this._handleServiceMessage(msg),
      (err) => log.error('service/WebChannel inner message error', err)
    )

    /**
     * `WebChannel` topology.
     * @private
     * @type {Service}
     */
    this._setTopology(this.settings.topology)
  }

  /**
   * Join the `WebChannel`.
   *
   * @param  {string|WebSocket} keyOrChannel The key provided by one of the `WebChannel` members or a socket
   * @param  {string} [options] Join options
   * @returns {Promise<undefined,string>} It resolves once you became a `WebChannel` member.
   */
  join (keyOrChannel, options = {}) {
    let settings = {
      url: this.settings.signalingURL,
      open: true,
      rejoinAttempts: REJOIN_MAX_ATTEMPTS,
      rejoinTimeout: REJOIN_TIMEOUT
    }
    Object.assign(settings, options)
    return new Promise((resolve, reject) => {
      if (keyOrChannel.constructor.name !== 'Channel') {
        this._joinRecursively(keyOrChannel, settings, () => resolve(), err => reject(err), 0)
      } else {
        this._joinSucceed = () => resolve()
        this._joinFailed = err => reject(err)
      }
    })
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
      return this.webSocketSvc.connect(`${url}/invite?wcId=${this.id}&senderId=${this.myId}`)
        .then(connection => this._addChannel(new Channel(connection, this)))
    } else {
      return Promise.reject(new Error(`${url} is not a valid URL`))
    }
  }

  /**
   * Enable other peers to join the `WebChannel` with your help as an
   * intermediary peer.
   * @param  {string} [key] Key to use. If none provide, then generate one.
   * @returns {Promise} It is resolved once the `WebChannel` is open. The
   * callback function take a parameter of type {@link SignalingGate~AccessData}.
   */
  open (key = undefined) {
    if (key !== undefined) {
      return this._signalingGate.open(this.settings.signalingURL, key)
    } else {
      return this._signalingGate.open(this.settings.signalingURL)
    }
  }

  /**
   * Prevent clients to join the `WebChannel` even if they possesses a key.
   */
  close () {
    this._signalingGate.close()
  }

  /**
   * If the `WebChannel` is open, the clients can join it through you, otherwise
   * it is not possible.
   * @returns {boolean} True if the `WebChannel` is open, false otherwise
   */
  isOpen () {
    return this._signalingGate.isOpen()
  }

  /**
   * Get the data allowing to join the `WebChannel`. It is the same data which
   * {@link WebChannel#open} callback function provides.
   * @returns {OpenData|null} - Data to join the `WebChannel` or null is the `WebChannel` is closed
   */
  getOpenData () {
    return this._signalingGate.getOpenData()
  }

  /**
   * Leave the `WebChannel`. No longer can receive and send messages to the group.
   */
  leave () {
    this._pingTime = 0
    this.members = []
    this._topology.leave()
    this._joinSucceed = () => {}
    this._joinFailed = () => {}
    this._msgStream.complete()
    this._signalingGate.close()
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
    content = new Uint8Array()
  } = {}) {
    const msg = {senderId, recipientId, isService, content}
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
    isMeIncluded = false
  } = {}) {
    const msg = {senderId, recipientId, isService, content}
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
    const msg = this._decode(bytes)

    switch (msg.recipientId) {
      // If the message is broadcasted
      case 0:
        this._handleMyMessage(channel, msg)
        this._topology.forward(msg)
        break

      // If it is a private message to me
      case this.myId:
        this._handleMyMessage(channel, msg)
        break

      // If is is a message to me from a peer who does not know yet my ID
      case 1:
        this._handleMyMessage(channel, msg)
        break

      // Otherwise the message should be forwarded to the intended peer
      default:
        this._topology.forwardTo(msg)
    }
  }

  _handleMyMessage (channel, msg) {
    if (!msg.isService) {
      // User Message
      const data = this._userMsg.decode(msg.content, msg.senderId)
      if (data !== undefined) {
        this.onMessage(msg.senderId, data, msg.recipientId === 0)
      }
    } else {
      // Inner Message
      this._msgStream.next(Object.assign({
        channel,
        senderId: msg.senderId,
        recipientId: msg.recipientId
      }, service.Message.decode(msg.content)))
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
   *
   * @private
   * @param  {[type]} key
   * @param  {[type]} options
   * @param  {[type]} resolve
   * @param  {[type]} reject
   * @param  {[type]} attempt
   * @return {void}
   */
  _joinRecursively (key, options, resolve, reject, attempt) {
    this._signalingGate.join(key, options.url, options.open)
      .then(ch => {
        if (ch) {
          this._joinSucceed = () => resolve()
          this._joinFailed = err => reject(err)
        } else {
          resolve()
        }
      })
      .catch(err => {
        attempt++
        console.log(`Failed to join via ${options.url} with ${key} key: ${err.message}`)
        if (attempt === options.rejoinAttempts) {
          reject(new Error(`Failed to join via ${options.url} with ${key} key: reached maximum rejoin attempts (${REJOIN_MAX_ATTEMPTS})`))
        } else {
          console.log(`Trying to rejoin in ${options.rejoinTimeout} the ${attempt} time... `)
          setTimeout(() => {
            this._joinRecursively(key, options, () => resolve(), err => reject(err), attempt)
          }, options.rejoinTimeout)
        }
      })
  }

  _setTopology (topology) {
    if (this._topology !== undefined) {
      if (this.settings.topology !== topology) {
        this.settings.topology = topology
        this._topology.clean()
        this._topology = new FullMesh(this)
      }
    } else {
      this.settings.topology = topology
      this._topology = new FullMesh(this)
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
    content = new Uint8Array()
  } = {}) {
    const msg = {senderId, recipientId, isService, content}
    return Message.encode(Message.create(msg)).finish()
  }

  _decode (bytes) {
    return Message.decode(new Uint8Array(bytes))
  }
}

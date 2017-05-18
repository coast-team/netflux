import { Subject } from 'node_modules/rxjs/Subject'

import { ServiceFactory, WEB_SOCKET, MESSAGE_BUILDER, CHANNEL_BUILDER } from 'ServiceFactory'
import { Channel } from 'Channel'
import { SignalingGate } from 'SignalingGate'
import { Util } from 'Util'
import * as log from 'log'

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

/**
 * One of the internal message type. It's a peer message.
 * @ignore
 * @type {number}
 */
const USER_DATA = 1

/**
 * One of the internal message type. This message should be threated by a
 * specific service class.
 * @type {number}
 */
const INNER_DATA = 2

const INITIALIZATION = 3

/**
 * One of the internal message type. Ping message.
 * @type {number}
 */
const PING = 4

/**
 * One of the internal message type. Pong message, response to the ping message.
 * @type {number}
 */
const PONG = 5

const INIT_CHANNEL = 6

const INIT_CHANNEL_BIS = 7

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 */
export class WebChannel {
  /**
   * @param {WebChannelSettings} settings Web channel settings
   */
  constructor (settings) {
    /**
     * @private
     * @type {WebChannelSettings}
     */
    this.settings = settings

    /**
     * Channels through which this peer is connected with other peers. This
     * attribute depends on the `WebChannel` topology. E. g. in fully connected
     * `WebChannel` you are connected to each other peer in the group, however
     * in the star structure this attribute contains only the connection to
     * the central peer.
     * @private
     * @type {external:Set}
     */
    this._channels = new Set()

    /**
     * This event handler is used to resolve *Promise* in {@link WebChannel#join}.
     * @private
     */
    this._joinSucceed = () => {}

    /**
     * Message builder service instance.
     *
     * @private
     * @type {MessageBuilderService}
     */
    this._msgSvc = ServiceFactory.get(MESSAGE_BUILDER)

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
     * The `WebChannel` gate.
     * @private
     * @type {SignalingGate}
     */
    this._signalingGate = new SignalingGate(this, ch => this._addChannel(ch))

    this._initChannelPendingRequests = new Map()

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

    this._servicesData = {}
    this._msgStream = new Subject()
    ServiceFactory.get(CHANNEL_BUILDER).init(this)

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
   * @param  {string|WebSocket} keyOrSocket The key provided by one of the `WebChannel` members or a socket
   * @param  {string} [options] Join options
   * @returns {Promise<undefined,string>} It resolves once you became a `WebChannel` member.
   */
  join (keyOrSocket, options = {}) {
    let settings = {
      url: this.settings.signalingURL,
      open: true,
      rejoinAttempts: REJOIN_MAX_ATTEMPTS,
      rejoinTimeout: REJOIN_TIMEOUT
    }
    Object.assign(settings, options)
    return new Promise((resolve, reject) => {
      if (keyOrSocket.constructor.name !== 'WebSocket') {
        this._joinRecursively(keyOrSocket, settings, () => resolve(), err => reject(err), 0)
      } else {
        this._joinSucceed = () => resolve()
        this._initChannel(keyOrSocket).catch(reject)
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
      return ServiceFactory.get(WEB_SOCKET)
        .connect(`${url}/invite?wcId=${this.id}`)
        .then(ws => this._addChannel(ws))
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
  open (key = null) {
    if (key !== null) {
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
    if (this._channels.size !== 0) {
      this.members = []
      this._topologySvc.leave(this)
    }
    this._initChannelPendingRequests = new Map()
    this._joinSucceed = () => {}
    this._msgStream.complete()
    this._signalingGate.close()
  }

  /**
   * Send the message to all `WebChannel` members.
   * @param  {UserMessage} data - Message
   */
  send (data) {
    if (this._channels.size !== 0) {
      this._msgSvc.handleUserMessage(data, this.myId, null, dataChunk => {
        this._topologySvc.broadcast(this, dataChunk)
      })
    }
  }

  /**
   * Send the message to a particular peer in the `WebChannel`.
   * @param  {number} id - Id of the recipient peer
   * @param  {UserMessage} data - Message
   */
  sendTo (id, data) {
    if (this._channels.size !== 0) {
      this._msgSvc.handleUserMessage(data, this.myId, id, dataChunk => {
        this._topologySvc.sendTo(id, this, dataChunk)
      }, false)
    }
  }

  /**
   * Get the ping of the `WebChannel`. It is an amount in milliseconds which
   * corresponds to the longest ping to each `WebChannel` member.
   * @returns {Promise}
   */
  ping () {
    if (this._channels.size !== 0 && this._pingTime === 0) {
      return new Promise((resolve, reject) => {
        if (this._pingTime === 0) {
          this._pingTime = Date.now()
          this._maxTime = 0
          this._pongNb = 0
          this._pingFinish = delay => resolve(delay)
          this._topologySvc.broadcast(this, this._msgSvc.msg(PING, this.myId))
          setTimeout(() => resolve(PING_TIMEOUT), PING_TIMEOUT)
        }
      })
    } else return Promise.reject(new Error('No peers to ping'))
  }

  /**
   * @private
   * @param {WebSocket|RTCDataChannel} channel
   *
   * @returns {Promise<undefined,string>}
   */
  _addChannel (channel) {
    return this._initChannel(channel)
      .then(channel => {
        log.info('WebChannel _addChannel->initChannel: ', {myId: this.myId, hisId: channel.peerId})
        const msg = this._msgSvc.msg(INITIALIZATION, this.myId, channel.peerId, {
          topology: this._topologySvc.id,
          wcId: this.id
        })
        channel.send(msg)
        return this._topologySvc.add(channel)
      })
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
   * @param {number} recepient - Identifier of recepient peer id
   * @param {string} serviceId - Service id
   * @param {Object} data - Message to send
   * @param {boolean} [forward=false] - SHould the message be forwarded?
   */
  _sendInnerTo (recepient, serviceId, data, forward = false) {
    if (forward) {
      this._topologySvc.sendInnerTo(recepient, this, data)
    } else {
      if (Number.isInteger(recepient)) {
        const msg = this._msgSvc.msg(INNER_DATA, this.myId, recepient, {serviceId, data})
        this._topologySvc.sendInnerTo(recepient, this, msg)
      } else {
        recepient.send(this._msgSvc.msg(INNER_DATA, this.myId, recepient.peerId, {serviceId, data}))
      }
    }
  }

  /**
   * @private
   * @param {number} serviceId
   * @param {Object} data
   */
  _sendInner (serviceId, data) {
    this._topologySvc.sendInner(this, this._msgSvc.msg(INNER_DATA, this.myId, null, {serviceId, data}))
  }

  /**
   * Message event handler (`WebChannel` mediator). All messages arrive here first.
   * @private
   * @param {Channel} channel - The channel the message came from
   * @param {external:ArrayBuffer} data - Message
   */
  _onMessage (channel, data) {
    const header = this._msgSvc.readHeader(data)
    if (header.code === USER_DATA) {
      this._msgSvc.readUserMessage(this, header.senderId, data, (fullData, isBroadcast) => {
        this.onMessage(header.senderId, fullData, isBroadcast)
      })
    } else {
      const msg = this._msgSvc.readInternalMessage(data)
      switch (header.code) {
        case INITIALIZATION: {
          this._setTopology(msg.topology)
          this.myId = header.recepientId
          this.id = msg.wcId
          channel.peerId = header.senderId
          log.info('New peer initialized', {wc: this.id, FROM: header.senderId, ME: header.recepientId})
          break
        }
        case INNER_DATA: {
          if (header.recepientId === 0 || this.myId === header.recepientId) {
            this._msgStream.next({
              channel,
              serviceId: msg.serviceId,
              senderId: header.senderId,
              recepientId: header.recepientId,
              content: msg.data
            })
          } else this._sendInnerTo(header.recepientId, null, data, true)
          break
        }
        case INIT_CHANNEL: {
          this._initChannelPendingRequests.get(channel.peerId).resolve()
          channel.send(this._msgSvc.msg(INIT_CHANNEL_BIS, this.myId, channel.peerId))
          break
        }
        case INIT_CHANNEL_BIS: {
          const resolver = this._initChannelPendingRequests.get(channel.peerId)
          if (resolver) {
            resolver.resolve()
          }
          break
        }
        case PING:
          this._topologySvc.sendTo(header.senderId, this, this._msgSvc.msg(PONG, this.myId))
          break
        case PONG: {
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
          throw new Error(`Unknown message type code: "${header.code}"`)
      }
    }
  }

  /**
   * Initialize channel. The *Channel* object is a facade for *WebSocket* and
   * *RTCDataChannel*.
   * @private
   * @param {external:WebSocket|external:RTCDataChannel} ch - Channel to
   * initialize
   * @param {number} [id] - Assign an id to this channel. It would be generated
   * if not provided
   * @returns {Promise} - Resolved once the channel is initialized on both sides
   */
  _initChannel (ch, id = -1) {
    return new Promise((resolve, reject) => {
      if (id === -1) id = this._generateId()
      const channel = new Channel(ch)
      channel.peerId = id
      channel.webChannel = this
      channel.onMessage = data => this._onMessage(channel, data)
      channel.onClose = closeEvt => this._topologySvc.onChannelClose(closeEvt, channel)
      channel.onError = evt => this._topologySvc.onChannelError(evt, channel)
      this._initChannelPendingRequests.set(channel.peerId, {resolve: () => {
        this._initChannelPendingRequests.delete(channel.peerId)
        resolve(channel)
      }})
      channel.send(this._msgSvc.msg(INIT_CHANNEL, this.myId, channel.peerId))
    })
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
      .then(connection => {
        if (connection) {
          this._joinSucceed = () => resolve()
          this._initChannel(connection)
            .catch(reject)
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
    this.settings.topology = topology
    this._topologySvc = ServiceFactory.get(topology)
    this._topologySvc.init(this)
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
}

export { USER_DATA }

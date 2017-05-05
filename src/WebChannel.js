import { Subject } from 'node_modules/rxjs/Subject'

import { msgStream, topologyService } from 'symbols'
import { ServiceFactory, WEB_RTC, WEB_SOCKET, MESSAGE_BUILDER, CHANNEL_BUILDER } from 'ServiceFactory'
import { Channel } from 'Channel'
import { SignalingGate } from 'SignalingGate'
import { Util } from 'Util'

/**
 * Maximum identifier number for {@link WebChannel#generateId} function.
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
    this.channels = new Set()

    /**
     * This event handler is used to resolve *Promise* in {@link WebChannel#join}.
     * @private
     */
    this.onJoin = () => {}

    /**
     * Message builder service instance.
     *
     * @private
     * @type {MessageBuilderService}
     */
    this.msgBld = ServiceFactory.get(MESSAGE_BUILDER)

    /**
     * An array of all peer ids except this.
     * @type {number[]}
     */
    this.members = []

    /**
     * @private
     * @type {Set<number>}
     */
    this.generatedIds = new Set()

    /**
     * @private
     * @type {Date}
     */
    this.pingTime = 0

    /**
     * @private
     * @type {number}
     */
    this.maxTime = 0

    /**
     * @private
     * @type {function(delay: number)}
     */
    this.pingFinish = () => {}

    /**
     * @private
     * @type {number}
     */
    this.pongNb = 0

    /**
     * The `WebChannel` gate.
     * @private
     * @type {SignalingGate}
     */
    this.gate = new SignalingGate(this, ch => this.addChannel(ch))

    this.onInitChannel = new Map()

    /**
     * Unique `WebChannel` identifier. Its value is the same for all `WebChannel` members.
     * @type {number}
     */
    this.id = this.generateId()

    /**
     * Unique peer identifier of you in this `WebChannel`. After each `join` function call
     * this id will change, because it is up to the `WebChannel` to assign it when
     * you join.
     * @type {number}
     */
    this.myId = this.generateId()

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

    this[msgStream] = new Subject()
    const channelBuilder = ServiceFactory.get(CHANNEL_BUILDER)
    channelBuilder.init(this, {iceServers: this.settings.iceServers})

    /**
     * `WebChannel` topology.
     * @private
     * @type {Service}
     */
    this.setTopology(this.settings.topology)
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
        this.joinRecursively(keyOrSocket, settings, () => resolve(), err => reject(err), 0)
      } else {
        this.onJoin = () => resolve()
        this.initChannel(keyOrSocket).catch(reject)
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
        .then(ws => this.addChannel(ws))
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
      return this.gate.open(this.settings.signalingURL, key)
    } else {
      return this.gate.open(this.settings.signalingURL)
    }
  }

  /**
   * Prevent clients to join the `WebChannel` even if they possesses a key.
   */
  close () {
    this.gate.close()
  }

  /**
   * If the `WebChannel` is open, the clients can join it through you, otherwise
   * it is not possible.
   * @returns {boolean} True if the `WebChannel` is open, false otherwise
   */
  isOpen () {
    return this.gate.isOpen()
  }

  /**
   * Get the data allowing to join the `WebChannel`. It is the same data which
   * {@link WebChannel#open} callback function provides.
   * @returns {OpenData|null} - Data to join the `WebChannel` or null is the `WebChannel` is closed
   */
  getOpenData () {
    return this.gate.getOpenData()
  }

  /**
   * Leave the `WebChannel`. No longer can receive and send messages to the group.
   */
  leave () {
    this.pingTime = 0
    if (this.channels.size !== 0) {
      this.members = []
      this[topologyService].leave(this)
    }
    this.onInitChannel = new Map()
    this.onJoin = () => {}
    this[msgStream].complete()
    this.gate.close()
  }

  /**
   * Send the message to all `WebChannel` members.
   * @param  {UserMessage} data - Message
   */
  send (data) {
    if (this.channels.size !== 0) {
      this.msgBld.handleUserMessage(data, this.myId, null, dataChunk => {
        this[topologyService].broadcast(this, dataChunk)
      })
    }
  }

  /**
   * Send the message to a particular peer in the `WebChannel`.
   * @param  {number} id - Id of the recipient peer
   * @param  {UserMessage} data - Message
   */
  sendTo (id, data) {
    if (this.channels.size !== 0) {
      this.msgBld.handleUserMessage(data, this.myId, id, dataChunk => {
        this[topologyService].sendTo(id, this, dataChunk)
      }, false)
    }
  }

  /**
   * Get the ping of the `WebChannel`. It is an amount in milliseconds which
   * corresponds to the longest ping to each `WebChannel` member.
   * @returns {Promise}
   */
  ping () {
    if (this.channels.size !== 0 && this.pingTime === 0) {
      return new Promise((resolve, reject) => {
        if (this.pingTime === 0) {
          this.pingTime = Date.now()
          this.maxTime = 0
          this.pongNb = 0
          this.pingFinish = delay => resolve(delay)
          this[topologyService].broadcast(this, this.msgBld.msg(PING, this.myId))
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
  addChannel (channel) {
    return this.initChannel(channel)
      .then(channel => {
        const msg = this.msgBld.msg(INITIALIZATION, this.myId, channel.peerId, {
          topology: this[topologyService].id,
          wcId: this.id
        })
        channel.send(msg)
        return this[topologyService].add(channel)
      })
  }

  /**
   * @private
   * @param {number} peerId
   */
  onPeerJoin$ (peerId) {
    this.members[this.members.length] = peerId
    this.onPeerJoin(peerId)
  }

  /**
   * @private
   * @param {number} peerId
   */
  onPeerLeave$ (peerId) {
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
  sendInnerTo (recepient, serviceId, data, forward = false) {
    if (forward) {
      this[topologyService].sendInnerTo(recepient, this, data)
    } else {
      if (Number.isInteger(recepient)) {
        const msg = this.msgBld.msg(INNER_DATA, this.myId, recepient, {serviceId, data})
        this[topologyService].sendInnerTo(recepient, this, msg)
      } else {
        recepient.send(this.msgBld.msg(INNER_DATA, this.myId, recepient.peerId, {serviceId, data}))
      }
    }
  }

  /**
   * @private
   * @param {number} serviceId
   * @param {Object} data
   */
  sendInner (serviceId, data) {
    this[topologyService].sendInner(this, this.msgBld.msg(INNER_DATA, this.myId, null, {serviceId, data}))
  }

  /**
   * Message event handler (`WebChannel` mediator). All messages arrive here first.
   * @private
   * @param {Channel} channel - The channel the message came from
   * @param {external:ArrayBuffer} data - Message
   */
  onChannelMessage (channel, data) {
    const header = this.msgBld.readHeader(data)
    if (header.code === USER_DATA) {
      this.msgBld.readUserMessage(this, header.senderId, data, (fullData, isBroadcast) => {
        this.onMessage(header.senderId, fullData, isBroadcast)
      })
    } else {
      const msg = this.msgBld.readInternalMessage(data)
      switch (header.code) {
        case INITIALIZATION: {
          this.setTopology(msg.topology)
          this.myId = header.recepientId
          this.id = msg.wcId
          channel.peerId = header.senderId
          break
        }
        case INNER_DATA: {
          if (header.recepientId === 0 || this.myId === header.recepientId) {
            if (msg.serviceId !== WEB_RTC && msg.serviceId !== CHANNEL_BUILDER) {
              ServiceFactory.get(msg.serviceId).onMessage(
                channel,
                header.senderId,
                header.recepientId,
                msg.data
              )
            } else {
              this[msgStream].next({
                channel,
                serviceId: msg.serviceId,
                senderId: header.senderId,
                recepientId: header.recepientId,
                content: msg.data
              })
            }
          } else this.sendInnerTo(header.recepientId, null, data, true)
          break
        }
        case INIT_CHANNEL: {
          this.onInitChannel.get(channel.peerId).resolve()
          channel.send(this.msgBld.msg(INIT_CHANNEL_BIS, this.myId, channel.peerId))
          break
        }
        case INIT_CHANNEL_BIS: {
          const resolver = this.onInitChannel.get(channel.peerId)
          if (resolver) {
            resolver.resolve()
          }
          break
        }
        case PING:
          this[topologyService].sendTo(header.senderId, this, this.msgBld.msg(PONG, this.myId))
          break
        case PONG: {
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
  initChannel (ch, id = -1) {
    return new Promise((resolve, reject) => {
      if (id === -1) id = this.generateId()
      const channel = new Channel(ch)
      channel.peerId = id
      channel.webChannel = this
      channel.onMessage = data => this.onChannelMessage(channel, data)
      channel.onClose = closeEvt => this[topologyService].onChannelClose(closeEvt, channel)
      channel.onError = evt => this[topologyService].onChannelError(evt, channel)
      this.onInitChannel.set(channel.peerId, {resolve: () => {
        this.onInitChannel.delete(channel.peerId)
        resolve(channel)
      }})
      channel.send(this.msgBld.msg(INIT_CHANNEL, this.myId, channel.peerId))
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
  joinRecursively (key, options, resolve, reject, attempt) {
    this.gate.join(key, options.url, options.open)
      .then(connection => {
        if (connection) {
          this.onJoin = () => resolve()
          this.initChannel(connection)
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
            this.joinRecursively(key, options, () => resolve(), err => reject(err), attempt)
          }, options.rejoinTimeout)
        }
      })
  }

  setTopology (topology) {
    this.settings.topology = topology
    this[topologyService] = ServiceFactory.get(topology)
    this[topologyService].init(this)
  }

  /**
   * Generate random id for a `WebChannel` or a new peer.
   * @private
   * @returns {number} - Generated id
   */
  generateId () {
    do {
      const id = Math.ceil(Math.random() * MAX_ID)
      if (id === this.myId) continue
      if (this.members.includes(id)) continue
      if (this.generatedIds.has(id)) continue
      this.generatedIds.add(id)
      setTimeout(() => this.generatedIds.delete(id), ID_TIMEOUT)
      return id
    } while (true)
  }
}

export { USER_DATA }

import {provide, FULLY_CONNECTED, WEBRTC, WEBSOCKET, MESSAGE_BUILDER} from 'serviceProvider'
import Channel from 'Channel'
import WebChannelGate from 'WebChannelGate'

const msgBld = provide(MESSAGE_BUILDER)

/**
 * Maximum identifier number for {@link WebChannel#generateId} function.
 * @type {number}
 */
const MAX_ID = 4294967295

/**
 * Timout for ping *WebChannel* in milliseconds.
 * @type {number}
 */
const PING_TIMEOUT = 5000

const ID_TIMEOUT = 10000

/**
 * One of the internal message type. It's a peer message.
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

/**
 * Constant used to send a message to the server in order that
 * he can join the webcahnnel
 * @type {string}
 */
const ADD_BOT_SERVER = 'addBotServer'

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the *WebChannel* can invite another person to join
 * the *WebChannel* and he also possess enough information to be able to add it
 * preserving the current *WebChannel* structure (network topology).
 */
class WebChannel {

  /**
   * When the *WebChannel* is open, any clients should you this data to join
   * the *WebChannel*.
   * @typedef {Object} WebChannel~AccessData
   * @property {string} key - The unique key to join the *WebChannel*
   * @property {string} url - Signaling server url
   */

  /**
   * *WebChannel* constructor. *WebChannel* can be parameterized in terms of
   * network topology and connector technology (WebRTC or WebSocket. Currently
   * WebRTC is only available).
   * @param  {Object} [options] *WebChannel* configuration.
   * @param  {string} [options.topology=FULLY_CONNECTED] Defines the network
   *            topology.
   * @param  {string} [options.connector=WEBRTC] Determines the connection
   *            technology to use for build *WebChannel*.
   * @returns {WebChannel} Empty *WebChannel* without any connection.
   */
  constructor (options = {}) {
    this.defaults = {
      connector: WEBRTC,
      topology: FULLY_CONNECTED,
      signaling: 'wss://sigver-coastteam.rhcloud.com:8443'
    }
    this.settings = Object.assign({}, this.defaults, options)

    /**
     * Channels through which this peer is connected with other peers. This
     * attribute depends on the *WebChannel* topology. E. g. in fully connected
     * *WebChannel* you are connected to each other peer in the group, however
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
     // TODO: add type to doc
    this.onJoin

    /**
     * *WebChannel* topology.
     * @private
     * @type {string}
     */
    this.topology = this.settings.topology

    /**
     * An array of all peer ids except this.
     * @private
     * @type {Array}
     */
    this.members = []

    this.generatedIds = new Set()

    /**
     * @private
     * @type {number}
     */
    this.pingTime = 0

    /**
     * The *WebChannel* gate.
     * @private
     * @type {WebChannelGate}
     */
    this.gate = new WebChannelGate(closeEvt => this.onClose(closeEvt))

    /**
     * Unique identifier of this *WebChannel*. The same for all peers.
     * @readonly
     */
    this.id = this.generateId()

    /**
     * Unique peer identifier of you in this *WebChannel*. After each `join` function call
     * this id will change, because it is up to the *WebChannel* to assign it when
     * you join.
     * @readonly
     */
    this.myId = this.generateId()

    /**
     * Is the event handler called when a new peer has  joined the *WebChannel*.
     * @param {number} id - Id of the joined peer
     */
    this.onJoining = id => {}

    /**
     * Is the event handler called when a message is available on the *WebChannel*.
     * @param {number} id - Id of the peer who sent this message
     * @param {string|external:ArrayBufferView} data - Message
     * @param {boolean} isBroadcast - It is true if the message is sent via
     * [send]{@link WebChannel#send} method and false if it is sent via
     * [sendTo]{@link WebChannel#sendTo} method
     */
    this.onMessage = (id, msg, isBroadcast) => {}

    /**
     * Is the event handler called when a peer hes left the *WebChannel*.
     * @param {number} id - Id of the peer who has left
     */
    this.onLeaving = id => {}

    /**
     * Is the event handler called when the *WebChannel* has been closed.
     * @param {external:CloseEvent} id - Close event object
     */
    this.onClose = closeEvt => {}
  }

  /**
   * Enable other peers to join the *WebChannel* with your help as an
   * intermediary peer.
   * @param  {Object} [options] Any available connection service options
   * @returns {Promise} It is resolved once the *WebChannel* is open. The
   * callback function take a parameter of type {@link WebChannel~AccessData}.
   */
  open (options = {}) {
    let settings = Object.assign({}, this.settings, options)
    return this.gate.open(channel => {
      this.initChannel(channel)
        .then(channel => this.addChannel(channel))
    }, settings)
  }

  addChannel (channel) {
    let msg = msgBld.msg(INITIALIZATION, this.myId, channel.peerId, {
      manager: this.manager.id,
      wcId: this.id
    })
    channel.send(msg)
    return this.manager.add(channel)
  }

  /**
    * Add a bot server to the network with his hostname and port
    *
    * @param {string} host - The hotname or the ip of the bot server to be add
    * @param {number} port - The port of the bot server to be add
    * @return {Promise} It resolves once the bot server joined the network
    */
  addBotServer (host, port) {
    let cBuilder = provide(WEBSOCKET, {host, port, addBotServer: true})
    let url = 'ws://' + host + ':' + port
    return cBuilder.connect(url)
      .then(socket => {
        /*
          Once the connection open a message is sent to the server in order
          that he can join initiate the channel
        */
        socket.send(JSON.stringify({code: ADD_BOT_SERVER, sender: this.myId, wcId: this.id}))
        return this.initChannel(socket)
      })
      .then(channel => this.addChannel(channel))
  }

  /**
    * Allow a bot server to join the network by creating a connection
    * with the peer who asked his coming
    *
    * @param {Object} channel - The channel between the server and the pair
    * who requested the add
    * @param {number} id - The id of the peer who requested the add
    * @return {Promise} It resolves once the the server has joined the network
    */
  joinAsBot (channel, id) {
    return new Promise((resolve, reject) => {
      this.onJoin = () => resolve(this)
      this.initChannel(channel, id)// .then(channel => {
        // console.log('[DEBUG] Resolved initChannel by server')
      // })
    })
  }

  /**
   * Prevent clients to join the `WebChannel` even if they possesses a key.
   */
  close () {
    this.gate.close()
  }

  /**
   * If the *WebChannel* is open, the clients can join it through you, otherwise
   * it is not possible.
   * @returns {boolean} True if the *WebChannel* is open, false otherwise
   */
  isOpen () {
    return this.gate.isOpen()
  }

  /**
   * Get the data which should be provided to all clients who must join
   * the *WebChannel*. It is the same data which
   * {@link WebChannel#openForJoining} callback function provides.
   * @returns {WebChannel~AccessData|null} - Data to join the *WebChannel*
   * or null is the *WebChannel* is closed
   */
  getAccess () {
    return this.gate.accessData
  }

  /**
   * Join the *WebChannel*.
   * @param  {string} key - The key provided by one of the *WebChannel* members.
   * @param  {type} [options] - Any available connection service options.
   * @returns {Promise} It resolves once you became a *WebChannel* member.
   */
  join (key, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    let webSocketService = provide(WEBSOCKET)
    let wsWithSignaling
    let webRTCService = provide(this.settings.connector)
    return new Promise((resolve, reject) => {
      this.onJoin = () => resolve(this)
      webSocketService.connect(settings.signaling)
        .then(ws => {
          wsWithSignaling = ws
          return webRTCService.connectOverSignaling(ws, key)
        })
        .then(channel => {
          wsWithSignaling.onclose = null
          wsWithSignaling.close()
          return this.initChannel(channel)
        })
        .catch(reject)
    })
  }

  /**
   * Leave the *WebChannel*. No longer can receive and send messages to the group.
   */
  leave () {
    if (this.channels.size !== 0) {
      this.topology = this.settings.topology
      this.members = []
      this.pingTime = 0
      this.gate.close()
      this.manager.leave(this)
    }
  }

  /**
   * Send the message to all *WebChannel* members.
   * @param  {string|external:ArrayBufferView} data - Message
   */
  send (data) {
    if (this.channels.size !== 0) {
      msgBld.handleUserMessage(data, this.myId, null, dataChunk => {
        this.manager.broadcast(this, dataChunk)
      })
    }
  }

  /**
   * Send the message to a particular peer in the *WebChannel*.
   * @param  {number} id - Id of the recipient peer
   * @param  {string|external:ArrayBufferView} data - Message
   */
  sendTo (id, data) {
    if (this.channels.size !== 0) {
      msgBld.handleUserMessage(data, this.myId, id, dataChunk => {
        this.manager.sendTo(id, this, dataChunk)
      }, false)
    }
  }

  /**
   * Get the ping of the *WebChannel*. It is an amount in milliseconds which
   * corresponds to the longest ping to each *WebChannel* member.
   * @returns {Promise}
   */
  ping () {
    if (this.members.length !== 0 && this.pingTime === 0) {
      return new Promise((resolve, reject) => {
        if (this.pingTime === 0) {
          this.pingTime = Date.now()
          this.maxTime = 0
          this.pongNb = 0
          this.pingFinish = delay => resolve(delay)
          this.manager.broadcast(this, msgBld.msg(PING, this.myId))
          setTimeout(() => resolve(PING_TIMEOUT), PING_TIMEOUT)
        }
      })
    } else return Promise.resolve(0)
  }

  get topology () {
    return this.settings.topology
  }

  set topology (name) {
    this.settings.topology = name
    this.manager = provide(this.settings.topology)
  }

  onJoining$ (peerId) {
    this.members[this.members.length] = peerId
    this.onJoining(peerId)
  }

  onLeaving$ (peerId) {
    this.members.splice(this.members.indexOf(peerId), 1)
    this.onLeaving(peerId)
  }

  /**
   * Send a message to a service of the same peer, joining peer or any peer in
   * the *WebChannel*.
   * @private
   * @param  {string} serviceId - Service id
   * @param  {string} recepient - Identifier of recepient peer id
   * @param  {Object} [msg={}] - Message to send
   */
  sendInnerTo (recepient, serviceId, data, forward = false) {
    if (forward) {
      this.manager.sendInnerTo(recepient, this, data)
    } else {
      if (Number.isInteger(recepient)) {
        let msg = msgBld.msg(INNER_DATA, this.myId, recepient, {serviceId, data})
        this.manager.sendInnerTo(recepient, this, msg)
      } else {
        recepient.send(msgBld.msg(INNER_DATA, this.myId, recepient.peerId, {serviceId, data}))
      }
    }
  }

  sendInner (serviceId, data) {
    this.manager.broadcast(this, msgBld.msg(INNER_DATA, this.myId, null, {serviceId, data}))
  }

  /**
   * Message event handler (*WebChannel* mediator). All messages arrive here first.
   * @private
   * @param {Channel} channel - The channel the message came from
   * @param {external:ArrayBuffer} data - Message
   */
  onChannelMessage (channel, data) {
    let header = msgBld.readHeader(data)
    if (header.code === USER_DATA) {
      msgBld.readUserMessage(this, header.senderId, data, (fullData, isBroadcast) => {
        this.onMessage(header.senderId, fullData, isBroadcast)
      })
    } else {
      let msg = msgBld.readInternalMessage(data)
      switch (header.code) {
        case INITIALIZATION:
          this.topology = msg.manager
          this.myId = header.recepientId
          this.id = msg.wcId
          channel.peerId = header.senderId
          break
        case INNER_DATA:
          if (header.recepientId === 0 || this.myId === header.recepientId) {
            provide(msg.serviceId).onMessage(channel, header.senderId, header.recepientId, msg.data)
          } else this.sendInnerTo(header.recepientId, null, data, true)
          break
        case PING:
          this.manager.sendTo(header.senderId, this, msgBld.msg(PONG, this.myId))
          break
        case PONG:
          let now = Date.now()
          this.pongNb++
          this.maxTime = Math.max(this.maxTime, now - this.pingTime)
          if (this.pongNb === this.members.length) {
            this.pingFinish(this.maxTime)
            this.pingTime = 0
          }
          break
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
    if (id === -1) id = this.generateId()
    let channel = new Channel(ch, this, id)
    channel.config()
    return Promise.resolve(channel)
  }

  /**
   * Generate random id for a *WebChannel* or a new peer.
   * @private
   * @returns {number} - Generated id
   */
  generateId () {
    do {
      let id = Math.ceil(Math.random() * MAX_ID)
      if (id === this.myId) continue
      if (this.members.includes(id)) continue
      if (this.generatedIds.has(id)) continue
      this.generatedIds.add(id)
      setTimeout(() => this.generatedIds.delete(id), ID_TIMEOUT)
      return id
    } while (true)
  }
}

export default WebChannel

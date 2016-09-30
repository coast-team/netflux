import {provide, WEBRTC, WEBSOCKET, MESSAGE_BUILDER} from 'serviceProvider'
import Channel from 'Channel'
import SignalingGate from 'SignalingGate'
import {isURL} from 'helper'

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
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the *WebChannel* can invite another person to join
 * the *WebChannel* and he also possess enough information to be able to add it
 * preserving the current *WebChannel* structure (network topology).
 */
class WebChannel {

  /**
   * *WebChannel* constructor. *WebChannel* can be parameterized in terms of
   * network topology and connector technology (WebRTC or WebSocket. Currently
   * WebRTC is only available).
   * @param  {Object} [options] *WebChannel* configuration
   * @param  {string} [options.topology=FULLY_CONNECTED] Defines the network
   *            topology
   * @param  {string} [options.connector=WEBRTC] Prioritizes this connection
   *            technology
   * @returns {WebChannel} Empty *WebChannel* without any connection.
   */
  constructor (settings) {
    this.settings = settings

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
    this.onJoin = () => {}

    /**
     * *WebChannel* topology.
     * @private
     * @type {string}
     */
    this.manager = provide(this.settings.topology)
    this.msgBld = provide(MESSAGE_BUILDER)

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
     * @type {SignalingGate}
     */
    this.gate = new SignalingGate(this)

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
    this.onPeerJoin = id => {}

    /**
     * Is the event handler called when a peer hes left the *WebChannel*.
     * @param {number} id - Id of the peer who has left
     */
    this.onPeerLeave = id => {}

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
     * Is the event handler called when the *WebChannel* has been closed.
     * @param {external:CloseEvent} id - Close event object
     */
    this.onClose = closeEvt => {}
  }

  /**
   * Join the *WebChannel*.
   * @param  {string} key - The key provided by one of the *WebChannel* members.
   * @param  {type} [options] - Any available connection service options.
   * @returns {Promise} It resolves once you became a *WebChannel* member.
   */
  join (keyOrSocket, url = this.settings.signalingURL) {
    return new Promise((resolve, reject) => {
      this.onJoin = resolve
      if (keyOrSocket.constructor.name !== 'WebSocket') {
        if (isURL(url)) {
          provide(WEBSOCKET).connect(url)
            .then(ws => {
              ws.onclose = closeEvt => reject(closeEvt.reason)
              ws.onmessage = evt => {
                try {
                  let msg = JSON.parse(evt.data)
                  if ('isKeyOk' in msg) {
                    if (msg.isKeyOk) {
                      if ('useThis' in msg && msg.useThis) {
                        this.initChannel(ws).catch(reject)
                      } else {
                        provide(WEBRTC, this.settings.iceServers).connectOverSignaling(ws, keyOrSocket)
                          .then(channel => {
                            ws.onclose = null
                            ws.close()
                            return this.initChannel(channel)
                          })
                          .catch(reject)
                      }
                    } else reject(`The key "${keyOrSocket}" was not found`)
                  } else reject(`Unknown message from the server ${url}: ${evt.data}`)
                } catch (err) { reject(err.message) }
              }
              ws.send(JSON.stringify({join: keyOrSocket}))
            })
            .catch(reject)
        } else reject(`${url} is not a valid URL`)
      } else {
        this.initChannel(keyOrSocket).catch(reject)
      }
    })
  }

  invite (keyOrSocket) {
    if (typeof keyOrSocket === 'string' || keyOrSocket instanceof String) {
      if (!isURL(keyOrSocket)) {
        return Promise.reject(`${keyOrSocket} is not a valid URL`)
      }
      return provide(WEBSOCKET).connect(keyOrSocket)
        .then(ws => {
          ws.send(JSON.stringify({wcId: this.id}))
          return this.addChannel(ws)
        })
    } else if (keyOrSocket.constructor.name === 'WebSocket') {
      return this.addChannel(keyOrSocket)
    }
  }

  /**
   * Enable other peers to join the *WebChannel* with your help as an
   * intermediary peer.
   * @param  {Object} [options] Any available connection service options
   * @returns {Promise} It is resolved once the *WebChannel* is open. The
   * callback function take a parameter of type {@link SignalingGate~AccessData}.
   */
  open (options) {
    let defaultSettings = {
      url: this.settings.signalingURL,
      key: null
    }
    let settings = Object.assign({}, defaultSettings, options)
    if (isURL(settings.url)) {
      return this.gate.open(settings.url, dataCh => this.addChannel(dataCh), settings.key)
    } else {
      return Promise.reject(`${settings.url} is not a valid URL`)
    }
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
   * {@link WebChannel#open} callback function provides.
   * @returns {SignalingGate~AccessData|null} - Data to join the *WebChannel*
   * or null is the *WebChannel* is closed
   */
  getOpenData () {
    return this.gate.getOpenData()
  }

  /**
   * Leave the *WebChannel*. No longer can receive and send messages to the group.
   */
  leave () {
    if (this.channels.size !== 0) {
      this.topology = this.settings.topology
      this.members = []
      this.pingTime = 0
      // this.gate.close()
      this.manager.leave(this)
    }
  }

  /**
   * Send the message to all *WebChannel* members.
   * @param  {string|external:ArrayBufferView} data - Message
   */
  send (data) {
    if (this.channels.size !== 0) {
      this.msgBld.handleUserMessage(data, this.myId, null, dataChunk => {
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
      this.msgBld.handleUserMessage(data, this.myId, id, dataChunk => {
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
          this.manager.broadcast(this, this.msgBld.msg(PING, this.myId))
          setTimeout(() => resolve(PING_TIMEOUT), PING_TIMEOUT)
        }
      })
    } else return Promise.resolve(0)
  }

  addChannel (channel) {
    return this.initChannel(channel)
      .then(channel => {
        let msg = this.msgBld.msg(INITIALIZATION, this.myId, channel.peerId, {
          manager: this.manager.id,
          wcId: this.id
        })
        channel.send(msg)
        return this.manager.add(channel)
      })
  }

  onPeerJoin$ (peerId) {
    this.members[this.members.length] = peerId
    this.onPeerJoin(peerId)
  }

  onPeerLeave$ (peerId) {
    this.members.splice(this.members.indexOf(peerId), 1)
    this.onPeerLeave(peerId)
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
        let msg = this.msgBld.msg(INNER_DATA, this.myId, recepient, {serviceId, data})
        this.manager.sendInnerTo(recepient, this, msg)
      } else {
        recepient.send(this.msgBld.msg(INNER_DATA, this.myId, recepient.peerId, {serviceId, data}))
      }
    }
  }

  sendInner (serviceId, data) {
    this.manager.sendInner(this, this.msgBld.msg(INNER_DATA, this.myId, null, {serviceId, data}))
  }

  /**
   * Message event handler (*WebChannel* mediator). All messages arrive here first.
   * @private
   * @param {Channel} channel - The channel the message came from
   * @param {external:ArrayBuffer} data - Message
   */
  onChannelMessage (channel, data) {
    let header = this.msgBld.readHeader(data)
    if (header.code === USER_DATA) {
      this.msgBld.readUserMessage(this, header.senderId, data, (fullData, isBroadcast) => {
        this.onMessage(header.senderId, fullData, isBroadcast)
      })
    } else {
      let msg = this.msgBld.readInternalMessage(data)
      switch (header.code) {
        case INITIALIZATION:
          this.topology = msg.manager
          this.myId = header.recepientId
          this.id = msg.wcId
          channel.peerId = header.senderId
          break
        case INNER_DATA:
          if (header.recepientId === 0 || this.myId === header.recepientId) {
            this.getService(msg.serviceId).onMessage(
              channel,
              header.senderId,
              header.recepientId,
              msg.data
            )
          } else this.sendInnerTo(header.recepientId, null, data, true)
          break
        case PING:
          this.manager.sendTo(header.senderId, this, this.msgBld.msg(PONG, this.myId))
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
    let channel = new Channel(ch)
    channel.peerId = id
    channel.webChannel = this
    channel.onMessage = data => this.onChannelMessage(channel, data)
    channel.onClose = closeEvt => this.manager.onChannelClose(closeEvt, channel)
    channel.onError = evt => this.manager.onChannelError(evt, channel)
    return Promise.resolve(channel)
  }

  getService (id) {
    if (id === WEBRTC) {
      return provide(WEBRTC, this.settings.iceServers)
    }
    return provide(id)
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

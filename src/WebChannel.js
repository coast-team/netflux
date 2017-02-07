import ServiceFactory, {WEB_RTC, WEB_SOCKET, MESSAGE_BUILDER} from 'ServiceFactory'
import Channel from 'Channel'
import SignalingGate from 'SignalingGate'
import Util from 'Util'

/**
 * Maximum identifier number for {@link WebChannel#generateId} function.
 * @type {number}
 */
const MAX_ID = 2147483647

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

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the `WebChannel` and he also possess enough information to be able to add it
 * preserving the current `WebChannel` structure (network topology).
 */
class WebChannel {

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
     * `WebChannel` topology.
     * @private
     * @type {Service}
     */
    this.manager = ServiceFactory.get(this.settings.topology)

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
  }

  /**
   * Join the `WebChannel`.
   *
   * @param  {string|WebSocket} keyOrSocket The key provided by one of the `WebChannel` members or a socket
   * @param  {string} [url=this.settings.signalingURL] Server URL
   * @returns {Promise<undefined,string>} It resolves once you became a `WebChannel` member.
   */
  join (keyOrSocket, url = this.settings.signalingURL) {
    return new Promise((resolve, reject) => {
      if (keyOrSocket.constructor.name !== 'WebSocket') {
        this.gate.join(url, keyOrSocket)
          .then(res => {
            if (res.opened) {
              resolve()
            } else {
              this.onJoin = () => {
                this.gate.openExisted(res.sigCon, keyOrSocket)
                  .then(resolve)
              }
              this.initChannel(res.con)
                .catch(reject)
            }
          })
          .catch(reject)
      } else {
        this.onJoin = resolve
        this.initChannel(keyOrSocket).catch(reject)
      }
    })
  }

  /**
   * Invite a peer to join the `WebChannel`.
   *
   * @param {string|WebSocket} keyOrSocket
   *
   * @returns {Promise<undefined,string>}
   */
  invite (keyOrSocket) {
    if (typeof keyOrSocket === 'string' || keyOrSocket instanceof String) {
      if (!Util.isURL(keyOrSocket)) {
        return Promise.reject(`${keyOrSocket} is not a valid URL`)
      }
      return ServiceFactory.get(WEB_SOCKET).connect(keyOrSocket)
        .then(ws => {
          ws.send(JSON.stringify({wcId: this.id}))
          return this.addChannel(ws)
        })
    } else if (keyOrSocket.constructor.name === 'WebSocket') {
      return this.addChannel(keyOrSocket)
    } else {
      return Promise.reject(`${keyOrSocket} is not a valid URL`)
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
    if (Util.isURL(this.settings.signalingURL)) {
      if (key !== null) {
        return this.gate.open(this.settings.signalingURL, key)
      } else {
        return this.gate.open(this.settings.signalingURL)
      }
    } else {
      return Promise.reject(`${this.settings.signalingURL} is not a valid URL`)
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
      this.manager.leave(this)
    }
    if (this.isOpen()) {
      this.gate.close()
    }
  }

  /**
   * Send the message to all `WebChannel` members.
   * @param  {UserMessage} data - Message
   */
  send (data) {
    if (this.channels.size !== 0) {
      this.msgBld.handleUserMessage(data, this.myId, null, dataChunk => {
        this.manager.broadcast(this, dataChunk)
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
        this.manager.sendTo(id, this, dataChunk)
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
          this.manager.broadcast(this, this.msgBld.msg(PING, this.myId))
          setTimeout(() => resolve(PING_TIMEOUT), PING_TIMEOUT)
        }
      })
    } else return Promise.reject('No peers to ping')
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
          manager: this.manager.id,
          wcId: this.id
        })
        channel.send(msg)
        return this.manager.add(channel)
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
      this.manager.sendInnerTo(recepient, this, data)
    } else {
      if (Number.isInteger(recepient)) {
        const msg = this.msgBld.msg(INNER_DATA, this.myId, recepient, {serviceId, data})
        this.manager.sendInnerTo(recepient, this, msg)
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
    this.manager.sendInner(this, this.msgBld.msg(INNER_DATA, this.myId, null, {serviceId, data}))
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
          this.settings.topology = msg.manager
          this.manager = ServiceFactory.get(this.settings.topology)
          this.myId = header.recepientId
          this.id = msg.wcId
          channel.peerId = header.senderId
          break
        }
        case INNER_DATA: {
          if (header.recepientId === 0 || this.myId === header.recepientId) {
            this.getService(msg.serviceId).onMessage(
              channel,
              header.senderId,
              header.recepientId,
              msg.data
            )
          } else this.sendInnerTo(header.recepientId, null, data, true)
          break
        }
        case PING:
          this.manager.sendTo(header.senderId, this, this.msgBld.msg(PONG, this.myId))
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
    if (id === -1) id = this.generateId()
    const channel = new Channel(ch)
    channel.peerId = id
    channel.webChannel = this
    channel.onMessage = data => this.onChannelMessage(channel, data)
    channel.onClose = closeEvt => this.manager.onChannelClose(closeEvt, channel)
    channel.onError = evt => this.manager.onChannelError(evt, channel)
    return Promise.resolve(channel)
  }

  /**
   * @private
   * @param {MESSAGE_BUILDER|WEB_RTC|WEB_SOCKET|FULLY_CONNECTED|CHANNEL_BUILDER} id
   *
   * @returns {Service}
   */
  getService (id) {
    if (id === WEB_RTC) {
      return ServiceFactory.get(WEB_RTC, this.settings.iceServers)
    }
    return ServiceFactory.get(id)
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

export default WebChannel
export {USER_DATA}

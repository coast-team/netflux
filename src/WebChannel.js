import {provide, FULLY_CONNECTED, WEBRTC, MESSAGE_BUILDER} from './serviceProvider'
import Channel from './Channel'
import JoiningPeer from './JoiningPeer'

const msgBuilder = provide(MESSAGE_BUILDER)

const MAX_ID = 4294967295

const PING_TIMEOUT = 5000

/**
 * One of the internal message type. It's a peer message.
 * @type {int}
 */
const USER_DATA = 1

/**
 * One of the internal message type. This message should be threated by a
 * specific service class
 * @type {int}
 */
const SERVICE_DATA = 2

/**
 * One of the internal message type. Means a peer has left the WebChannel.
 * @type {int}
 */
const LEAVE = 3

/**
 * One of the internal message type. Initialization message for the joining peer.
 * @type {int}
 */

const JOIN_INIT = 4
/**
 * One of the internal message type. The message is intended for the WebChannel
 * members to notify them about the joining peer.
 * @type {int}
 */
const JOIN_NEW_MEMBER = 5

/**
 * One of the internal message type. The message is intended for the WebChannel
 * members to notify them that the joining peer has not succeed.
 * @type {int}
 */
const REMOVE_NEW_MEMBER = 6

/**
 * Constant used to build a message to be sent to a newly joining peer that he
 * has can now succesfully join Web Channel.
 * @type {int}
 */
const JOIN_FINILIZE = 7
/**
 * Constant used to build a message to be sent by the newly joining peer to all
 * peers in Web Channel to notify them that he has succesfully joined the Web
 * Channel.
 * @type {int}
 */
const JOIN_SUCCESS = 8
/**
 * @type {int}
 */
const INIT_CHANNEL_PONG = 10
/**
 * @type {int}
 */
const PING = 11
/**
 * @type {int}
 */
const PONG = 12

/**
  * Constant used to send a message to the server in order that
  * he can join the webcahnnel
  * @type {string}
  */
const ADD_BOT_SERVER = 'addBotServer'

class WebChannelGate {
  constructor (action) {
    this.door = null
    this.accessData = null
    this.action = action
  }

  getAccessData () {
    return this.accessData
  }

  isOpen () {
    return this.door !== null
  }

  setOpen (door, accessData, action) {
    this.door = door
    this.door.onclose = this.action
    this.accessData = accessData
  }

  close () {
    if (this.isOpen()) {
      this.door.close()
      this.door = null
    }
  }
}

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the *WebChannel* and he also possess enough information to be able to add it
 * preserving the current *WebChannel* structure (network topology).
 */
class WebChannel {

  /**
   * When the `WebChannel` is open, any clients should you this data to join
   * the `WebChannel`.
   *
   * @typedef {Object} WebChannel~AccessData
   * @property {string} key - The key to join the `WebChannel`
   * @property {string} url - Signaling server URL to use to join the `WebChannel`
   */

  /**
   * `WebChannel` constructor. `WebChannel` can be parameterized in terms of
   * network topology and connector technology (WebRTC or WebSocket. Currently
   * WebRTC is only available).
   *
   * @param  {Object} [options] `WebChannel` configuration.
   * @param  {string} [options.topology=FULLY_CONNECTED] Defines the network
   *            topology.
   * @param  {string} [options.connector=WEBRTC] Determines the connection
   *            technology to use for build `WebChannel`.
   * @return {WebChannel} Empty `WebChannel` without any connection.
   */
  constructor (options = {}) {
    this.defaults = {
      connector: WEBRTC,
      topology: FULLY_CONNECTED
    }
    this.settings = Object.assign({}, this.defaults, options)

    /**
     * Channels through which this peer is connected with other peers. This
     * attribute depends on the `WebChannel` topology. E. g. in fully connected
     * `WebChannel` you are connected to each other peer in the group, however
     * in the star structure this attribute contains only the connection to
     * the central peer.
     *
     * @private
     */
    this.channels = new Set()

    /**
     * This event handler is used to resolve *Promise* in `WebChannel.join`.
     *
     * @private
     */
    this.onJoin

    /** @private */
    this.joiningPeers = new Set()
    /** @private */
    this.connectWithRequests = new Map()
    /** @private */
    this.connectMeToRequests = new Map()

    this.topology = this.settings.topology

    /** @private */
    this.peerNb = 0
    /** @private */
    this.pingTime = 0

    /** @private */
    this.gate = new WebChannelGate((closeEvt) => this.onClose(closeEvt))

    /**
     * Unique identifier of this `WebChannel`. The same for all peers.
     * @readonly
     */
    this.id = this.generateId()

    /**
     * Unique peer identifier of you in this `WebChannel`. After each `join` function call
     * this id will change, because it is up to the `WebChannel` to assign it when
     * you join.
     *
     * @readonly
     */
    this.myId = this.generateId()

    /**
     * Is the event handler called when a new peer has  joined the `WebChannel`.
     *
     * @param {number} id - Id of the joined peer
     */
    this.onJoining = (id) => {}

    /**
     * Is the event handler called when a message is available on the `WebChannel`.
     *
     * @param {number} id - Id of the peer who sent this message
     * @param {string|external:ArrayBufferView} data - Message
     * @param {boolean} isBroadcast - It is true if the message is sent via
     * [send]{@link WebChannel#send} method and false if it is sent via
     * [sendTo]{@link WebChannel#sendTo} method
     */
    this.onMessage = (id, msg, isBroadcast) => {}

    /**
     * Is the event handler called when a peer hes left the `WebChannel`.
     *
     * @param {number} id - Id of the peer who has left
     */
    this.onLeaving = (id) => {}

    /**
     * Is the event handler called when the `WebChannel` has been closed.
     *
     * @param {external:CloseEvent} id - Close event object
     */
    this.onClose = (closeEvt) => {}
  }

  /**
   * Enable other peers to join the `WebChannel` with your help as an
   * intermediary peer.
   *
   * @param  {Object} [options] Any available connection service options
   * @return {PromiseWebChannel~AccessData} It is resolved once the `WebChannel`
   * is open. The callback function take a parameter of type {@link WebChannel~AccessData}.
   */
  openForJoining (options = {}) {
    let settings = Object.assign({}, this.settings, options)

    let cBuilder = provide(settings.connector, settings)
    return cBuilder.open(this.generateKey(), (channel) => {
      this.initChannel(channel, false)
        .then((channel) => this.addChannel(channel))
    }).then((data) => {
      let accessData = {key: data.key, url: data.url}
      this.gate.setOpen(data.socket, accessData)
      return accessData
    })
  }

  /**
    * Add a channel to the current peer network according to the topology
    *
    * @param {Object} channel - Channel which needs to be add in the topology
    * @return {Promise} It resolves once the channel is add
    */
  addChannel (channel) {
    let jp = this.addJoiningPeer(channel.peerId, this.myId, channel)
    this.manager.broadcast(this, msgBuilder.msg(
      JOIN_NEW_MEMBER, {id: channel.peerId, intermediaryId: this.myId})
    )
    channel.send(msgBuilder.msg(JOIN_INIT, {
      manager: this.settings.topology,
      id: channel.peerId,
      intermediaryId: this.myId})
    )
    return this.manager.add(channel)
      .then(() => {
        channel.send(msgBuilder.msg(JOIN_FINILIZE))
        // console.log('[DEBUG] Resolved manager.add(channel)')
      })
      .catch((msg) => {
        // console.log('[DEBUG] Catched manager.add(channel): ', msg)
        this.manager.broadcast(this, msgBuilder.msg(
          REMOVE_NEW_MEMBER, {id: channel.peerId})
        )
        this.removeJoiningPeer(jp.id)
      })
  }

  /**
    * Add a bot server to the network with his hostname and port
    *
    * @param {string} host - The hotname or the ip of the bot server to be add
    * @param {number} port - The port of the bot server to be add
    * @return {Promise} It resolves once the bot server joined the network
    */
  addBotServer (host, port) {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined') {
        let socket
        try {
          socket = new window.WebSocket('ws://' + host + ':' + port)
        } catch (err) {
          reject(err.message)
        }
        socket.onopen = () => {
          /*
            After opening the WebSocket with the server, a message is sent
            to him in order that it can join the webchannel
          */
          socket.send(JSON.stringify({code: ADD_BOT_SERVER, sender: this.myId}))
          this.initChannel(socket, false).then((channel) => {
            // console.log('[DEBUG] Resolved initChannel addBotServer')
            this.addChannel(channel).then(() => {
              // console.log('[RESOLVED] Resolved addChannel in addBotServer')
              resolve()
            })
          })
        }
        socket.onclose = () => {
          reject('Connection with the WebSocket server closed')
        }
      } else reject('Only browser client can add a bot server')
    })
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
      this.initChannel(channel, true, id)// .then((channel) => {
        // console.log('[DEBUG] Resolved initChannel by server')
      // })
    })
  }

  /**
   * Prevent clients to join the `WebChannel` even if they possesses a key.
   */
  closeForJoining () {
    this.gate.close()
  }

  /**
   * If the `WebChannel` is open, the clients can join it through you, otherwise
   * it is not possible.
   *
   * @returns {boolean} True if the `WebChannel` is open, false otherwise
   */
  isOpen () {
    return this.gate.isOpen()
  }

  /**
   * Join the `WebChannel`.
   *
   * @param  {string} key - The key provided by one of the `WebChannel` members.
   * @param  {type} [options] - Any available connection service options.
   * @return {Promise} It resolves once you became a `WebChannel` member.
   */
  join (key, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    let cBuilder = provide(settings.connector, settings)
    return new Promise((resolve, reject) => {
      this.onJoin = () => resolve(this)
      cBuilder.join(key)
        .then((channel) => this.initChannel(channel, true))
        .catch(reject)
    })
  }

  /**
   * Leave the `WebChannel`. No longer can receive and send messages to the group.
   *
   */
  leave () {
    if (this.channels.size !== 0) {
      this.manager.broadcast(this, msgBuilder.msg(LEAVE, {id: this.myId}))
      this.topology = this.settings.topology
      this.channels.forEach((c) => {
        c.close()
      })
      this.channels.clear()
      this.gate.close()
    }
  }

  /**
   * Send the message to all `WebChannel` members.
   *
   * @param  {string|external:ArrayBufferView} data - Message
   */
  send (data) {
    if (this.channels.size !== 0) {
      msgBuilder.handleUserMessage(data, this.myId, null, (dataChunk) => {
        this.manager.broadcast(this, dataChunk)
      })
    }
  }

  /**
   * Send the message to a particular peer in the `WebChannel`.
   *
   * @param  {number} id - Id of the recipient peer
   * @param  {string|external:ArrayBufferView} data - Message
   */
  sendTo (id, data) {
    if (this.channels.size !== 0) {
      msgBuilder.handleUserMessage(data, this.myId, id, (dataChunk) => {
        this.manager.sendTo(id, this, dataChunk)
      }, false)
    }
  }

  /**
   * Get the data which should be provided to all clients who must join
   * the `WebChannel`. It is the same data which
   * {@link WebChannel#openForJoining} callback function provides.
   *
   * @returns {WebChannel~AccessData|null} - Data to join the `WebChannel`
   * or null is the `WebChannel` is closed
   */
  getAccess () {
    return this.gate.getAccessData()
  }

  /**
   * Get the ping of the `WebChannel`. It is an amount in milliseconds which
   * corresponds to the longest ping to each `WebChannel` member.
   *
   * @returns {Promise}
   */
  ping () {
    return new Promise((resolve, reject) => {
      if (this.pingTime === 0) {
        this.pingTime = Date.now()
        this.maxTime = 0
        this.pongNb = 0
        this.pingFinish = (delay) => { resolve(delay) }
        this.manager.broadcast(this, msgBuilder.msg(PING, {senderId: this.myId}))
        setTimeout(() => { resolve(PING_TIMEOUT) }, PING_TIMEOUT)
      }
    })
  }

  /**
   * // TODO: add doc
   *
   */
  get topology () {
    return this.settings.topology
  }

  /**
   * Send a message to a service of the same peer, joining peer or any peer in
   * the Web Channel).
   *
   * @private
   * @param  {string} serviceName - Service name.
   * @param  {string} recepient - Identifier of recepient peer id.
   * @param  {Object} [msg={}] - Message to send.
   */
  sendSrvMsg (serviceName, recepient, msg = {}, channel = null) {
    // console.log('[DEBUG] sendSrvMsg (serviceName, recepient, msg = {}, channel = null) (',
    // serviceName, ', ', recepient, ', ', msg, ', ', channel, ')')
    let fullMsg = msgBuilder.msg(
      SERVICE_DATA, {serviceName, recepient, data: Object.assign({}, msg)}
    )
    if (channel !== null) {
      channel.send(fullMsg)
      return
    }
    if (recepient === this.myId) {
      this.onChannelMessage(null, fullMsg)
    } else {
      // If this function caller is a peer who is joining
      if (this.isJoining()) {
        this.getJoiningPeer(this.myId)
          .intermediaryChannel
          .send(fullMsg)
      } else {
        // If the recepient is a joining peer
        if (this.hasJoiningPeer(recepient)) {
          let jp = this.getJoiningPeer(recepient)
          // If I am an intermediary peer for recepient
          if (jp.intermediaryId === this.myId) {
            jp.intermediaryChannel.send(fullMsg)
          // If not, then send this message to the recepient's intermediary peer
          } else {
            this.manager.sendTo(jp.intermediaryId, this, fullMsg)
          }
        // If the recepient is a member of webChannel
        } else {
          this.manager.sendTo(recepient, this, fullMsg)
        }
      }
    }
  }

  /**
   * // TODO: add doc
   *
   * @private
   */
  onChannelMessage (channel, data) {
    let header = msgBuilder.readHeader(data)
    // console.log('[DEBUG] {onChannelMessage} header: ', header)
    if (header.code === USER_DATA) {
      msgBuilder.readUserMessage(this.id, header.senderId, data, (fullData, isBroadcast) => {
        this.onMessage(header.senderId, fullData, isBroadcast)
      })
    } else {
      let msg = msgBuilder.readInternalMessage(data)
      switch (header.code) {
        case LEAVE:
          for (let c of this.channels) {
            if (c.peerId === msg.id) {
              c.close()
              this.channels.delete(c)
            }
          }
          this.peerNb--
          this.onLeaving(msg.id)
          break
        case SERVICE_DATA:
          if (this.myId === msg.recepient) {
            provide(msg.serviceName, this.settings).onMessage(this, channel, msg.data)
          } else {
            this.sendSrvMsg(msg.serviceName, msg.recepient, msg.data)
          }
          break
        case JOIN_INIT:
          this.topology = msg.manager
          this.myId = msg.id
          channel.peerId = msg.intermediaryId
          this.addJoiningPeer(msg.id, msg.intermediaryId, channel)
          break
        case JOIN_NEW_MEMBER:
          this.addJoiningPeer(msg.id, msg.intermediaryId)
          break
        case REMOVE_NEW_MEMBER:
          this.removeJoiningPeer(msg.id)
          break
        case JOIN_FINILIZE:
          this.joinSuccess(this.myId)
          // console.log(this.myId + ' JOINED SUCCESSFULLY')
          this.manager.broadcast(this, msgBuilder.msg(JOIN_SUCCESS, {id: this.myId}))
          this.onJoin()
          break
        case JOIN_SUCCESS:
          // console.log(this.myId + ' JOIN_SUCCESS from ' + msg.id)
          this.joinSuccess(msg.id)
          this.peerNb++
          this.onJoining(msg.id)
          break
        case INIT_CHANNEL_PONG:
          channel.onPong()
          delete channel.onPong
          break
        case PING:
          this.manager.sendTo(msg.senderId, this, msgBuilder.msg(PONG))
          break
        case PONG:
          let now = Date.now()
          this.pongNb++
          this.maxTime = Math.max(this.maxTime, now - this.pingTime)
          if (this.pongNb === this.peerNb) {
            this.pingFinish(this.maxTime)
            this.pingTime = 0
          }
          break
      }
    }
  }

  /**
   * // TODO: add doc
   *
   * @private
   */
  onChannelError (evt) {
    console.log('DATA_CHANNEL ERROR: ', evt)
  }

  /**
   * // TODO: add doc
   *
   * @private
   */
  onChannelClose (evt) {
    console.log('DATA_CHANNEL CLOSE: ', evt)
  }

  /**
   * // TODO: add doc
   *
   * @private
   */
  set topology (name) {
    this.settings.topology = name
    this.manager = provide(this.settings.topology)
  }

  /**
   * // TODO: add doc
   *
   * @private
   */
  initChannel (ch, isInitiator, id = -1) {
    // console.log('[DEBUG] initChannel (ch, isInitiator, id) (ch, ', isInitiator, ', ', id, ')')
    return new Promise((resolve, reject) => {
      if (id === -1) { id = this.generateId() }
      let channel = new Channel(ch, this, id)
      // TODO: treat the case when the 'ping' or 'pong' message has not been received
      if (isInitiator) {
        channel.config()
        channel.onPong = () => resolve(channel)
        // console.log('[DEBUG] send ping')
        ch.send('ping')
      } else {
        ch.onmessage = (msgEvt) => {
          if (msgEvt.data === 'ping') {
            channel.config()
            // console.log('[DEBUG] send pong')
            channel.send(msgBuilder.msg(INIT_CHANNEL_PONG))
            resolve(channel)
          }
        }
      }
    })
  }

  /**
   * joinSuccess - description
   *
   * @private
   * @param  {type} id description
   * @return {type}    description
   */
  joinSuccess (id) {
    let jp = this.getJoiningPeer(id)
    jp.channelsToAdd.forEach((c) => {
      this.channels.add(c)
    })
    // TODO: handle channels which should be closed & removed
    // this.joiningPeers.delete(jp)
  }

  /**
   * TODO: add doc
   *
   * @private
   * @param  {type} id description
   */
  getJoiningPeer (id) {
    // if (this.myId !== id) {
    //   console.log('Me ' + this.myId + ' is looking for ' + id)
    // }
    for (let jp of this.joiningPeers) {
      if (jp.id === id) {
        return jp
      }
    }
    throw new Error('Peer ' + this.myId + ' could not find the joining peer ' + id)
  }

  /**
   * TODO: add doc
   *
   * @private
   */
  getJoiningPeers () {
    return this.joiningPeers
  }

  /**
   * TODO: add doc
   *
   * @private
   * @param  {type} jp description
   * @return {type}    description
   */
  addJoiningPeer (peerId, intermediaryId, intermediaryChannel = null) {
    // if (this.myId !== peerId) {
    //   console.log('Me ' + this.myId + ' is adding: ' + peerId + ' where intermediaryId is ' + intermediaryId + ' and the channel is ' + (intermediaryChannel !== null))
    // }
    let jp = new JoiningPeer(peerId, intermediaryId, intermediaryChannel)
    if (this.hasJoiningPeer(peerId)) {
      throw new Error('Joining peer already exists!')
    }
    this.joiningPeers.add(jp)
    return jp
  }

  /**
   * TODO: add doc
   *
   * @private
   * @param  {type} id description
   * @return {type}    description
   */
  removeJoiningPeer (id) {
    if (this.hasJoiningPeer(id)) {
      this.joiningPeers.delete(this.getJoiningPeer(id))
    }
  }

  /**
   * TODO: add doc
   *
   * @private
   * @return {type}  description
   */
  isJoining () {
    for (let jp of this.joiningPeers) {
      if (jp.id === this.myId) {
        return true
      }
    }
    return false
  }

  /**
   * TODO: add doc
   *
   * @private
   * @param  {type} id description
   * @return {type}    description
   */
  hasJoiningPeer (id) {
    for (let jp of this.joiningPeers) {
      if (jp.id === id) {
        return true
      }
    }
    return false
  }

  /**
   * TODO: add doc
   *
   * @private
   * @return {type}  description
   */
  generateKey () {
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

  /**
   * TODO: add doc
   *
   * @private
   * @return {type}  description
   */
  generateId () {
    let id
    do {
      id = Math.ceil(Math.random() * MAX_ID)
      for (let c of this.channels) {
        if (id === c.peerId) continue
      }
      if (this.hasJoiningPeer(id)) continue
      if (id === this.myId) continue
      break
    } while (true)
    return id
  }
}

export {WebChannel, USER_DATA}

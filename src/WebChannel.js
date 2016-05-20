import provide, {FULLY_CONNECTED, WEBRTC, MESSAGE_FORMATTER} from './serviceProvider'
import Channel from './Channel'
import JoiningPeer from './JoiningPeer'

const formatter = provide(MESSAGE_FORMATTER)

const MAX_ID = 4294967295

/**
 * Constant used to build a message designated to API user.
 * @type {int}
 */
export const USER_DATA = 0

/**
 * Constant used to build a message designated to a specific service.
 * @type {int}
 */
const SERVICE_DATA = 1
/**
 * Constant used to build a message that a user has left Web Channel.
 * @type {int}
 */
const LEAVE = 2
/**
 * Constant used to build a message to be sent to a newly joining peer.
 * @type {int}
 */
const JOIN_INIT = 3
/**
 * Constant used to build a message to be sent to all peers in Web Channel to
 * notify them about a new peer who is about to join the Web Channel.
 * @type {int}
 */
const JOIN_NEW_MEMBER = 4
/**
 * Constant used to build a message to be sent to all peers in Web Channel to
 * notify them that the new peer who should join the Web Channel, refuse to join.
 * @type {int}
 */
const REMOVE_NEW_MEMBER = 5
/**
 * Constant used to build a message to be sent to a newly joining peer that he
 * has can now succesfully join Web Channel.
 * @type {int}
 */
const JOIN_FINILIZE = 6
/**
 * Constant used to build a message to be sent by the newly joining peer to all
 * peers in Web Channel to notify them that he has succesfully joined the Web
 * Channel.
 * @type {int}
 */
const JOIN_SUCCESS = 7
/**
 * @type {int}
 */
const INIT_CHANNEL_PONG = 9

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each peer can send/receive broadcast as well as personal
 * messages. Every peer in the `WebChannel` can invite another person to join
 * the *WebChannel* and he also possess enough information to be able to add it
 * preserving the current *WebChannel* structure (network topology).
 */
class WebChannel {

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
    this.topology = this.settings.topology

    // Public attributes

    /**
     * Unique identifier of this `WebChannel`. The same for all peers.
     * @readonly
     */
    this.id = this.generateId()

    /**
     * Unique peer identifier in this `WebChannel`. After each `join` function call
     * this id will change, because it is up to the `WebChannel` to assign it when
     * you join.
     *
     * @readonly
     */
    this.myId = this.generateId()

    this.onJoining = (id) => {}
    this.onMessage = (id, msg) => {}
    this.onLeaving = (id) => {}
  }

  /** Leave `WebChannel`. No longer can receive and send messages to the group. */
  leave () {
    if (this.channels.size !== 0) {
      this.manager.broadcast(this, formatter.msg(LEAVE, {id: this.myId}))
      this.topology = this.settings.topology
      this.channels.forEach((c) => {
        c.close()
      })
      this.channels.clear()
    }
  }

  /**
   * Send broadcast message.
   *
   * @param  {string} data Message
   */
  send (data) {
    if (this.channels.size !== 0) {
      formatter.handleUserMessage(data, this.myId, null, (dataChunk) => {
        this.manager.broadcast(this, dataChunk)
      })
    }
  }

  /**
   * Send the message to a particular peer.
   *
   * @param  {type} id Peer id of the recipient peer
   * @param  {type} data Message
   */
  sendTo (id, data) {
    if (this.channels.size !== 0) {
      formatter.handleUserMessage(data, this.myId, id, (dataChunk) => {
        this.manager.sendTo(id, this, dataChunk)
      })
    }
  }

  /**
   * Enable other peers to join the `WebChannel` with your help as an intermediary
   * peer.
   *
   * @param  {Object} [options] Any available connection service options.
   * @return {string} The key required by other peer to join the `WebChannel`.
   */
  openForJoining (options = {}) {
    let settings = Object.assign({}, this.settings, options)

    let cBuilder = provide(settings.connector, settings)
    return cBuilder.open(this.generateKey(), (channel) => {
      this.initChannel(channel, false)
        .then((channel) => {
          let jp = new JoiningPeer(channel.peerId, this.myId)
          jp.intermediaryChannel = channel
          this.joiningPeers.add(jp)
          channel.send(formatter.msg(JOIN_INIT, {
            manager: this.settings.topology,
            id: channel.peerId,
            intermediaryId: this.myId})
          )
          this.manager.broadcast(this, formatter.msg(
            JOIN_NEW_MEMBER, {id: channel.peerId, intermediaryId: this.myId})
          )
          this.manager.add(channel)
            .then(() => channel.send(formatter.msg(JOIN_FINILIZE)))
            .catch((msg) => {
              this.manager.broadcast(this, formatter(
                REMOVE_NEW_MEMBER, {id: channel.peerId})
              )
              this.removeJoiningPeer(jp.id)
            })
        })
    }).then((data) => {
      this.webRTCOpen = data.socket
      return {key: data.key, url: data.url}
    })
  }

  /**
   * Prevent other peers to join the `WebChannel` even if they have a key.
   */
  closeForJoining () {
    if (Reflect.has(this, 'webRTCOpen')) {
      this.webRTCOpen.close()
    }
  }

  /**
   * Join the `WebChannel`.
   *
   * @param  {string} key The key provided by a `WebChannel` member.
   * @param  {type} [options] Any available connection service options.
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
   *
   *
   * @private
   * @return {type}  description
   */
  isInviting () {}

  /**
   * has - description
   *
   * @private
   * @param  {type} peerId description
   * @return {type}        description
   */
  has (peerId) {
    for (let c of this.channels) {
      if (c.peerId === peerId) {
        return true
      }
    }
    return false
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
    let fullMsg = formatter.msg(
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

  onChannelMessage (channel, data) {
    let header = formatter.readHeader(data)
    if (header.code === USER_DATA) {
      formatter.readUserMessage(this.id, header.senderId, data, (fullData) => {
        this.onMessage(header.senderId, fullData)
      })
    } else {
      let msg = formatter.readInternalMessage(data)
      switch (header.code) {
        case LEAVE:
          for (let c of this.channels) {
            if (c.peerId === msg.id) {
              c.close()
              this.channels.delete(c)
            }
          }
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
          let jp = new JoiningPeer(this.myId, channel.peerId)
          jp.intermediaryChannel = channel
          this.addJoiningPeer(jp)
          break
        case JOIN_NEW_MEMBER:
          this.addJoiningPeer(new JoiningPeer(msg.id, msg.intermediaryId))
          break
        case REMOVE_NEW_MEMBER:
          this.removeJoiningPeer(msg.id)
          break
        case JOIN_FINILIZE:
          this.joinSuccess(this.myId)
          this.manager.broadcast(this, formatter.msg(JOIN_SUCCESS, {id: this.myId}))
          this.onJoin()
          break
        case JOIN_SUCCESS:
          this.joinSuccess(msg.id)
          this.onJoining(msg.id)
          break
        case INIT_CHANNEL_PONG:
          channel.onPong()
          delete channel.onPong
          break
      }
    }
  }

  onChannelError (evt) {
    console.log('DATA_CHANNEL ERROR: ', evt)
  }

  onChannelClose (evt) {
    console.log('DATA_CHANNEL CLOSE: ', evt)
  }

  set topology (name) {
    this.settings.topology = name
    this.manager = provide(this.settings.topology)
  }

  get topology () {
    return this.settings.topology
  }

  initChannel (ch, isInitiator, id = -1) {
    return new Promise((resolve, reject) => {
      if (id === -1) { id = this.generateId() }
      let channel = new Channel(ch, this, id)
      // TODO: treat the case when the 'ping' or 'pong' message has not been received
      if (isInitiator) {
        channel.config()
        channel.onPong = () => resolve(channel)
        ch.send('ping')
      } else {
        ch.onmessage = (msgEvt) => {
          if (msgEvt.data === 'ping') {
            channel.config()
            channel.send(formatter.msg(INIT_CHANNEL_PONG))
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
      this.joiningPeers.delete(jp)
    })
  }

  /**
   * getJoiningPeer - description
   *
   * @private
   * @param  {type} id description
   * @return {type}    description
   */
  getJoiningPeer (id) {
    for (let jp of this.joiningPeers) {
      if (jp.id === id) {
        return jp
      }
    }
    throw new Error('Joining peer not found!')
  }

  /**
   * addJoiningPeer - description
   *
   * @private
   * @param  {type} jp description
   * @return {type}    description
   */
  addJoiningPeer (jp) {
    if (this.hasJoiningPeer(jp.id)) {
      throw new Error('Joining peer already exists!')
    }
    this.joiningPeers.add(jp)
  }

  /**
   * removeJoiningPeer - description
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
   * isJoining - description
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
   * hasJoiningPeer - description
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
   * generateKey - description
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

export {WebChannel}

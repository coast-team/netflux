import * as cs from './constants'
import * as services from './services'
import JoiningPeer from './JoiningPeer'

/**
 * This class is an API starting point. It represents a group of collaborators
 * also called peers. Each member of the group can send/receive broadcast
 * as well as personal messages. Every peer in the group can invite another
 * person to join the group and he is able to add it respecting the current
 * group structure (network topology).
 */
class WebChannel {

  /**
   * Creates `WebChannel`.
   *
   * @param  {Object} options `WebChannel` configuration.
   * @param  {string} options.topology = FULLY_CONNECTED Defines the network
   *            topology.
   * @param  {string} options.connector = WEBRTC Determines which connection
   *            service to use to build `WebChannel`.
   * @return {WebChannel} Empty `WebChannel` without any connection.
   */
  constructor (options = {}) {
    this.defaults = {
      connector: services.WEBRTC,
      topology: services.FULLY_CONNECTED
    }
    this.settings = Object.assign({}, this.defaults, options)

    // Public attributes

    /** Unique identifier of this `WebChannel`. The same for all peers. */
    this.id = this.generateId()

    /** Unique peer identifier in this `WebChannel`. */
    this.myId = this.generateId()

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
    this.connections = new Map()

    /** @private */
    this.proxy = services.get(services.CHANNEL_PROXY)
    /** @private */
    this.topology = this.settings.topology
  }

  /**
   * This event handler is called when a new member has joined the `WebChannel`.
   *
   * @param  {string} id - Peer id.
   */
  onJoining (id) {}

  /**
   * This event handler is called when a `WebChannel` member has left.
   *
   * @param  {string} id - Peer id.
   */
  onLeaving (id) { }

  /** Leave `WebChannel`. No longer can receive and send messages to the group. */
  leave () {
    this.manager.broadcast(this, this.proxy.msg(cs.LEAVE,
      {id: this.myId}
    ))
  }

  /**
   * Send broadcast message.
   *
   * @param  {string} data Message
   */
  send (data) {
    this.manager.broadcast(this, this.proxy.msg(
      cs.USER_DATA,
      {id: this.myId, data}
    ))
  }

  /**
   * Send message to a particular peer.
   *
   * @param  {type} id Peer id of the recipient.
   * @param  {type} data Message
   */
  sendTo (id, data) {
    this.manager.sendTo(id, this, this.proxy.msg(
      cs.USER_DATA,
      {id: this.myId, data}
    ))
  }

  /**
   * Enable other peers to join the `WebChannel` with your help as an intermediary
   * peer.
   *
   * @param  {Object} options = {} Any available connection service options.
   * @return {string} The key required by other peer to join the `WebChannel`.
   */
  openForJoining (options = {}) {
    let settings = Object.assign({}, this.settings, options)

    let cBuilder = services.get(settings.connector, settings)
    let data = cBuilder.open(this, (channel) => {
      this.initChannel(channel)
      let jp = new JoiningPeer(channel.peerId, this.myId)
      jp.intermediaryChannel = channel
      this.joiningPeers.add(jp)
      channel.send(this.proxy.msg(cs.JOIN_INIT,
        {manager: this.settings.topology,
        id: channel.peerId,
        intermediaryId: this.myId}
      ))
      this.manager.broadcast(this, this.proxy.msg(cs.JOIN_NEW_MEMBER,
        {id: channel.peerId, intermediaryId: this.myId}
      ))
      this.manager.add(channel)
        .then(() => {
          channel.send(this.proxy.msg(cs.JOIN_FINILIZE))
        })
        .catch(() => {
          // TODO: implement JOIN_FAIL
        })
    })
    return data.key
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
   * @param  {type} options = {} Any available connection service options.
   * @return {Promise} Is resolve once you became a `WebChannel` member.
   */
  join (key, options = {}) {
    let settings = Object.assign({}, this.settings, options)

    let cBuilder = services.get(settings.connector, settings)
    return new Promise((resolve, reject) => {
      cBuilder
        .join(key)
        .then((channel) => {
          this.initChannel(channel)
          this.onJoin = () => { resolve(this) }
        })
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
   * sendSrvMsg - description
   *
   * @private
   * @param  {type} serviceName description
   * @param  {type} recepient   description
   * @param  {type} msg = {}    description
   * @return {type}             description
   */
  sendSrvMsg (serviceName, recepient, msg = {}) {
    let completeMsg = {serviceName, recepient, data: Object.assign({}, msg)}
    let stringifiedMsg = this.proxy.msg(cs.SERVICE_DATA, completeMsg)
    if (recepient === this.myId) {
      this.proxy.onSrvMsg(this, completeMsg)
    } else {
      // If this function caller is a peer who is joining
      if (this.isJoining()) {
        this.getJoiningPeer(this.myId).intermediaryChannel.send(stringifiedMsg)
      } else {
        // If the recepient is a joining peer
        if (this.hasJoiningPeer(recepient)) {
          let jp = this.getJoiningPeer(recepient)
          // If I am an intermediary peer for recepient
          if (jp.intermediaryId === this.myId) {
            jp.intermediaryChannel.send(stringifiedMsg)
          // If not, then send this message to the recepient's intermediary peer
          } else {
            this.manager.sendTo(jp.intermediaryId, this, stringifiedMsg)
          }
        // If the recepient is a member of webChannel
        } else {
          this.manager.sendTo(recepient, this, stringifiedMsg)
        }
      }
    }
  }

  /**
   * set - description
   *
   * @private
   * @param  {type} name description
   * @return {type}      description
   */
  set topology (name) {
    this.settings.topology = name
    this.manager = services.get(this.settings.topology)
  }

  /**
   * get - description
   *
   * @private
   * @return {type}  description
   */
  get topology () {
    return this.settings.topology
  }

  /**
   * initChannel - description
   *
   * @private
   * @param  {type} channel description
   * @param  {type} id = '' description
   * @return {type}         description
   */
  initChannel (channel, id = '') {
    channel.webChannel = this
    channel.onmessage = this.proxy.onMsg
    if (id !== '') {
      channel.peerId = id
    } else {
      channel.peerId = this.generateId()
    }
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
   * generateId - description
   *
   * @private
   * @return {type}  description
   */
  generateId () {
    const MIN_LENGTH = 2
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

export default WebChannel

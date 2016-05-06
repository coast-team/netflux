import * as serviceProvider from './serviceProvider'
import { Channel, JOIN_NEW_MEMBER, LEAVE, USER_DATA, JOIN_INIT, JOIN_FINILIZE, REMOVE_NEW_MEMBER, SERVICE_DATA, INIT_CHANNEL_PONG } from './Channel'
import JoiningPeer from './JoiningPeer'

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
      connector: serviceProvider.WEBRTC,
      topology: serviceProvider.FULLY_CONNECTED
    }
    this.settings = Object.assign({}, this.defaults, options)

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
  onLeaving (id) {}

  /**
   * On message event handler.
   *
   * @param  {string} id  - Peer id the message came from.
   * @param  {string} msg - Message
   */
  onMessage (id, msg) {}

  /** Leave `WebChannel`. No longer can receive and send messages to the group. */
  leave () {
    this.manager.broadcast(this, LEAVE, {id: this.myId})
  }

  /**
   * Send broadcast message.
   *
   * @param  {string} data Message
   */
  send (data) {
    this.manager.broadcast(this, USER_DATA, data)
  }

  /**
   * Send the message to a particular peer.
   *
   * @param  {type} id Peer id of the recipient peer
   * @param  {type} data Message
   */
  sendTo (id, data) {
    this.manager.sendTo(id, this, USER_DATA, {id: this.myId, data})
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

    let cBuilder = serviceProvider.get(settings.connector, settings)
    let key = this.id + this.myId
    return cBuilder.open(key, (channel) => {
      this.initChannel(channel, false)
        .then((channel) => {
          let jp = new JoiningPeer(channel.peerId, this.myId)
          jp.intermediaryChannel = channel
          this.joiningPeers.add(jp)
          channel.send(JOIN_INIT, {
            manager: this.settings.topology,
            id: channel.peerId,
            intermediaryId: this.myId}
          )
          this.manager.broadcast(this, JOIN_NEW_MEMBER, {
            id: channel.peerId,
            intermediaryId: this.myId}
          )
          this.manager.add(channel)
            .then(() => channel.send(JOIN_FINILIZE))
            .catch((msg) => {
              this.manager.broadcast(this, REMOVE_NEW_MEMBER, {id: channel.peerId})
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

    let cBuilder = serviceProvider.get(settings.connector, settings)
    return new Promise((resolve, reject) => {
      cBuilder.join(key)
        .then((channel) => {
          this.onJoin = () => resolve(this)
          return this.initChannel(channel, true)
        })
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
  sendSrvMsg (serviceName, recepient, msg = {}) {
    let completeMsg = {serviceName, recepient, data: Object.assign({}, msg)}
    if (recepient === this.myId) {
      serviceProvider.get(msg.serviceName, this.settings).onMessage(this, null, msg.data)
    } else {
      // If this function caller is a peer who is joining
      if (this.isJoining()) {
        let ch = this.getJoiningPeer(this.myId).intermediaryChannel
        if (ch.readyState !== 'closed') {
          ch.send(SERVICE_DATA, completeMsg)
        }
      } else {
        // If the recepient is a joining peer
        if (this.hasJoiningPeer(recepient)) {
          let jp = this.getJoiningPeer(recepient)
          // If I am an intermediary peer for recepient
          if (jp.intermediaryId === this.myId && jp.intermediaryChannel.readyState !== 'closed') {
            jp.intermediaryChannel.send(SERVICE_DATA, completeMsg)
          // If not, then send this message to the recepient's intermediary peer
          } else {
            this.manager.sendTo(jp.intermediaryId, this, SERVICE_DATA, completeMsg)
          }
        // If the recepient is a member of webChannel
        } else {
          this.manager.sendTo(recepient, this, SERVICE_DATA, completeMsg)
        }
      }
    }
  }

  set topology (name) {
    this.settings.topology = name
    this.manager = serviceProvider.get(this.settings.topology)
  }

  get topology () {
    return this.settings.topology
  }

  initChannel (ch, isInitiator, id = this.generateId()) {
    return new Promise((resolve, reject) => {
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
            channel.send(INIT_CHANNEL_PONG)
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

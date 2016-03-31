(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.nf = global.nf || {})));
}(this, function (exports) { 'use strict';

  // API user's message
  const USER_DATA = 0

  // Internal message to a specific Service
  const SERVICE_DATA = 1

  // Internal messages
  const LEAVE = 8
  const JOIN_INIT = 3
  const JOIN_NEW_MEMBER = 6
  const REMOVE_NEW_MEMBER = 9
  const JOIN_FINILIZE = 5
  const JOIN_SUCCESS = 4
  const THIS_CHANNEL_TO_JOINING_PEER = 7

  /**
   * Interface for every service.
   * @interface
   */
  class ServiceInterface {
    get name () {
      return this.constructor.name
    }

    onMessage (webChannel, msg) {
      throw new Error('Must be implemented by subclass!')
    }
  }

  /**
   * Web Channel Manager module - start point for all connection services. Composed of:
   * - Constants to identify the request type sent by this peer's service to
   *   the same service of another peer.
   * - Interface which each web channel manager should extends.
   * @module webChannelManager
   */

  /**
   * Connection service of the peer who received a message of this type should
   * establish connection with one or several peers.
   */
  const CONNECT_WITH = 1
  const CONNECT_WITH_FEEDBACK = 2
  const CONNECT_WITH_TIMEOUT = 1000
  const ADD_INTERMEDIARY_CHANNEL = 4

  /**
   * Interface for all web channel manager services. Its standalone
   * instance is useless.
   * @interface
   * @extends ServiceInterface
   */
  class Interface extends ServiceInterface {

    onMessage (webChannel, msg) {
      let cBuilder = get(webChannel.settings.connector, webChannel.settings)
      switch (msg.code) {
        case CONNECT_WITH:
          msg.peers = this.reUseIntermediaryChannelIfPossible(webChannel, msg.jpId, msg.peers)
          cBuilder
            .connectMeToMany(webChannel, msg.peers)
            .then((result) => {
              result.channels.forEach((c) => {
                webChannel.initChannel(c, c.peerId)
                webChannel.getJoiningPeer(msg.jpId).toAddList(c)
                c.send(webChannel.proxy.msg(THIS_CHANNEL_TO_JOINING_PEER,
                  {id: msg.jpId, toBeAdded: true}
                ))
              })
              console.log('connectMeToMany result: ', result)
              webChannel.sendSrvMsg(this.name, msg.sender,
                {code: CONNECT_WITH_FEEDBACK, id: webChannel.myId, failed: result.failed}
              )
            })
            .catch((err) => {
              console.log('connectMeToMany FAILED, ', err)
            })
          break
        case CONNECT_WITH_FEEDBACK:
          webChannel.connectWithRequests.get(msg.id)(true)
          break
        case ADD_INTERMEDIARY_CHANNEL:
          let jp = webChannel.getJoiningPeer(msg.jpId)
          jp.toAddList(jp.intermediaryChannel)
          break
      }
    }

    connectWith (webChannel, id, jpId, peers) {
      webChannel.sendSrvMsg(this.name, id,
        {code: CONNECT_WITH, jpId: jpId,
          sender: webChannel.myId, peers}
      )
      return new Promise((resolve, reject) => {
        webChannel.connectWithRequests.set(id, (isDone) => {
          if (isDone) {
            console.log('CONNECT WITH RESOLVED')
            resolve()
          } else {
            console.log('CONNECT WITH REJECTED')
            reject()
          }
        })
        setTimeout(() => {
          reject('CONNECT_WITH_TIMEOUT')
        }, this.calculateConnectWithTimeout(peers.length))
      })
    }

    calculateConnectWithTimeout (nbPeers) {
      if (nbPeers > 0) {
        return CONNECT_WITH_TIMEOUT + Math.log10(nbPeers)
      } else {
        return CONNECT_WITH_TIMEOUT
      }
    }

    reUseIntermediaryChannelIfPossible (webChannel, jpId, ids) {
      let idToRemove = null
      let jp
      if (webChannel.isJoining()) {
        jp = webChannel.getJoiningPeer(jpId)
        if (ids.indexOf(jp.intermediaryId) !== -1) {
          idToRemove = jp.intermediaryId
        }
      } else {
        if (ids.indexOf(jpId) !== -1) {
          jp = webChannel.getJoiningPeer(jpId)
          if (jp.intermediaryChannel !== null) {
            idToRemove = jpId
          }
        }
      }
      if (idToRemove !== null) {
        jp.toAddList(jp.intermediaryChannel)
        webChannel.sendSrvMsg(this.name, idToRemove, {
          code: ADD_INTERMEDIARY_CHANNEL, jpId
        })
        ids.splice(ids.indexOf(idToRemove), 1)
      }
      return ids
    }

    add (webChannel, data) {
      throw new Error('Must be implemented by subclass!')
    }

    broadcast (webChannel, data) {
      throw new Error('Must be implemented by subclass!')
    }

    sendTo (id, webChannel, data) {
      throw new Error('Must be implemented by subclass!')
    }

    leave (webChannel) {
      throw new Error('Must be implemented by subclass!')
    }
  }

  /**
   * Fully connected web channel manager. Implements fully connected topology
   * network, when each peer is connected to each other.
   *
   * @extends webChannelManager~Interface
   */
  class FullyConnectedService extends Interface {

    add (ch) {
      let wCh = ch.webChannel
      let peers = [wCh.myId]
      wCh.channels.forEach(ch => { peers[peers.length] = ch.peerId })
      wCh.joiningPeers.forEach(jp => {
        if (ch.peerId !== jp.id) {
          peers[peers.length] = jp.id
        }
      })
      return this.connectWith(wCh, ch.peerId, ch.peerId, peers)
    }

    broadcast (webChannel, data) {
      for (let c of webChannel.channels) {
        if (c.readyState !== 'closed') {
          c.send(data)
        }
      }
    }

    sendTo (id, webChannel, data) {
      for (let c of webChannel.channels) {
        if (c.peerId === id) {
          if (c.readyState !== 'closed') {
            c.send(data)
          }
          return
        }
      }
    }

    leave (webChannel) {
    }

  }

  /**
   * Channel Builder module - start point for all connection services. Composed of
   * an Interface which each channel builder service should extend.
   * @module channelBuilder
   */

  /**
   * Interface for all channel builder services. Its standalone instance is useless.
   * @interface
   * @extends ServiceInterface
   */
  class Interface$1 extends ServiceInterface {
    /**
     * Sends a message to `peerExecutor.id` asking him to establish a connection
     * with `peers`. This function is used to add a new peer to the `webChannel`.
     *
     * For exemple: A, B, C constitute the `webChannel`. N1 and N2 are not the
     * `webChannel` members and they are about to join it. N1 is connected to A.
     * Thus A is the intermediary peer for communicate with N1. N2 is connected
     * to C thereby C is the intermediary peer for N2.
     *
     * N1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A<br />
     * +------->+<br />
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br />
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br />
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-----------+<------+<br />
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;N2<br />
     *
     *  Here are possible use cases:
     *
     * 1. A asks C to connect with N1
     * 2. A asks B to connect with N1
     * 3. B asks A to connect with N1
     * 4. B asks C to connect with N1
     * 5. B asks C to connect with A
     * 6. A asks N1 to connect with B
     * 7. A asks N1 to connect with C
     * 8. B asks N1 to connect with C
     * 9. A asks N1 to connect with N2
     * 10. B asks N2 to connect with N1
     *
     * @param  {Object} peerExecutor The peer who must establish connection with `peers`.
     * @param  {string} peerExecutor.id The `peerExecutor`'s id.
     * @param  {string} [peerExecutor.intermediaryId] The id of the peer in the `webChannel`
     *            who knows the `peerExecutor` which is not yet a member of the `webChannel`.
     * @param  {WebChannel} webChannel - `webChannel` which has this function caller as member.
     * @param  {Object[]} peers An array of peers with whom the `peerExecutor` must
     *           establish a connection.
     * @param  {string} peers[].id - The peer's id.
     * @param  {string} [peers[].intermediaryId] - the id of an intermediary peer
     *           to communicate with this partner (as for `peerExecutor`).
     *
     * @return {Promise} Once `peerExecutor` established all required connections,
     *           the promise is resolved, otherwise it is rejected.
     */
    connectMeToMany (webChannel, ids) {
      throw new Error('Must be implemented by subclass!')
    }

    connectMeToOne (webChannel, id) {
      throw new Error('Must be implemented by subclass!')
    }

    /**
     * This callback type is `onChannelCallback`.
     *
     * @callback onChannelCallback
     * @param {Channel} channel A new channel.
     */

    /**
     * Enables other clients to establish a connection with you.
     *
     * @abstract
     * @param {onChannelCallback} onChannel Callback function to execute once the
     *          connection is established.
     * @param {Object} [options] Any other options which depend on the implementation.
     * @return {Promise} Once resolved, provide an Object with `key` attribute
     *           to be passed to {@link connector#join} function. It is rejected
     *           if an error occured.
     */
    open (onChannel, options = {}) {
      throw new Error('Must be implemented by subclass!')
    }

    /**
     * Connects you with the peer who provided the `key`.
     *
     * @abstract
     * @param  {type} key A key obtained from a peer.
     * @param  {type} options = {} Any other options which depend on the
     *           implementation.
     * @return {Promise} It is resolved when the connection is established,
     *           otherwise it is rejected.
     */
    join (key, options = {}) {
      throw new Error('Must be implemented by subclass!')
    }
  }

  const CONNECTION_CREATION_TIMEOUT = 4000

  /**
   * Service class responsible to establish connections between peers via `RTCDataChannel`.
   * @extends {@link channelBuilder#Interface}
   */
  class WebRTCService extends Interface$1 {

    constructor (options = {}) {
      super()
      this.defaults = {
        signaling: 'ws://sigver-coastteam.rhcloud.com:8000',
        iceServers: [
          {urls: 'stun:23.21.150.121'},
          {urls: 'stun:stun.l.google.com:19302'},
          {urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}
        ]
      }
      this.settings = Object.assign({}, this.defaults, options)

      // Declare WebRTCService related global(window) constructors
      this.RTCPeerConnection =
        window.RTCPeerConnection ||
        window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.msRTCPeerConnection

      this.RTCIceCandidate =
        window.RTCIceCandidate ||
        window.mozRTCIceCandidate ||
        window.RTCIceCandidate ||
        window.msRTCIceCandidate

      this.RTCSessionDescription =
        window.RTCSessionDescription ||
        window.mozRTCSessionDescription ||
        window.webkitRTCSessionDescription ||
        window.msRTCSessionDescription
    }

    open (webChannel, onChannel, options = {}) {
      let key = webChannel.id + webChannel.myId
      let settings = Object.assign({}, this.settings, options)
      // Connection array, because several connections may be establishing
      // at the same time
      let connections = []

      // Connect to the signaling server
      let socket = new window.WebSocket(settings.signaling)

      // Send a message to signaling server: ready to receive offer
      socket.onopen = () => {
        webChannel.webRTCOpen = socket
        socket.send(this.toStr({key}))
      }
      socket.onmessage = (e) => {
        let msg = JSON.parse(e.data)
        if (!Reflect.has(msg, 'id') || !Reflect.has(msg, 'data')) {
          throw new Error('Incorrect message format from the signaling server.')
        }

        // On SDP offer: add connection to the array, prepare answer and send it back
        if (Reflect.has(msg.data, 'offer')) {
          connections[connections.length] = this.createConnectionAndAnswer(
              candidate => socket.send(this.toStr({id: msg.id, data: {candidate}})),
              answer => socket.send(this.toStr({id: msg.id, data: {answer}})),
              onChannel,
              msg.data.offer
            )
        // On Ice Candidate
        } else if (Reflect.has(msg.data, 'candidate')) {
          connections[msg.id].addIceCandidate(this.createCandidate(msg.data.candidate))
        }
      }
      socket.onerror = (e) => {
        throw new Error(`Connection to the signaling server ${settings.signaling} failed: ${e.message}.`)
      }
      socket.onclose = (e) => {
        console.log('On open socket with signaling server is closed: ', e)
        delete webChannel.webRTCOpen
      }
      return {key, signaling: settings.signaling}
    }

    join (key, options = {}) {
      let settings = Object.assign({}, this.settings, options)
      return new Promise((resolve, reject) => {
        let connection

        // Connect to the signaling server
        let socket = new window.WebSocket(settings.signaling)
        socket.onopen = () => {
          // Prepare and send offer
          connection = this.createConnectionAndOffer(
            candidate => socket.send(this.toStr({data: {candidate}})),
            offer => socket.send(this.toStr({join: key, data: {offer}})),
            channel => {
              channel.connection = connection
              resolve(channel)
            },
            key
          )
        }
        socket.onmessage = (e) => {
          let msg = JSON.parse(e.data)

          // Check message format
          if (!Reflect.has(msg, 'data')) { reject() }

          // If received an answer to the previously sent offer
          if (Reflect.has(msg.data, 'answer')) {
            let sd = this.createSDP(msg.data.answer)
            connection.setRemoteDescription(sd, () => {}, reject)
          // If received an Ice candidate
          } else if (Reflect.has(msg.data, 'candidate')) {
            connection.addIceCandidate(this.createCandidate(msg.data.candidate))
          } else { reject() }
        }
        socket.onerror = (e) => {
          reject(`Signaling server socket error: ${e.message}`)
        }
        socket.onclose = (e) => {
          console.log('Socket is closed: ', e)
        }
      })
    }

    connectMeToMany (webChannel, ids) {
      return new Promise((resolve, reject) => {
        let counter = 0
        let result = {channels: [], failed: []}
        if (ids.length === 0) {
          resolve(result)
        } else {
          for (let id of ids) {
            this.connectMeToOne(webChannel, id)
              .then((channel) => {
                counter++
                result.channels.push(channel)
                if (counter === ids.length) {
                  resolve(result)
                }
              })
              .catch((err) => {
                counter++
                result.failed.push({id, err})
                if (counter === ids.length) {
                  resolve(result)
                }
              })
          }
        }
      })
    }

    connectMeToOne (webChannel, id) {
      return new Promise((resolve, reject) => {
        let sender = webChannel.myId
        let connection = this.createConnectionAndOffer(
          candidate => webChannel.sendSrvMsg(this.name, id, {sender, candidate}),
          offer => {
            webChannel.connections.set(id, connection)
            webChannel.sendSrvMsg(this.name, id, {sender, offer})
          },
          channel => {
            channel.connection = connection
            channel.peerId = id
            resolve(channel)
          },
          id
        )
        setTimeout(reject, CONNECTION_CREATION_TIMEOUT, 'Timeout')
      })
    }

    onMessage (webChannel, msg) {
      let connections = webChannel.connections
      if (Reflect.has(msg, 'offer')) {
        // TODO: add try/catch. On exception remove connection from webChannel.connections
        connections.set(msg.sender,
          this.createConnectionAndAnswer(
            candidate => webChannel.sendSrvMsg(this.name, msg.sender,
              {sender: webChannel.myId, candidate}),
            answer => webChannel.sendSrvMsg(this.name, msg.sender,
              {sender: webChannel.myId, answer}),
            channel => {
              webChannel.initChannel(channel, msg.sender)
              webChannel.connections.delete(channel.peerId)
            },
            msg.offer
          )
        )
        console.log(msg.sender + ' create a NEW CONNECTION')
      } else if (connections.has(msg.sender)) {
        let connection = connections.get(msg.sender)
        if (Reflect.has(msg, 'answer')) {
          let sd = this.createSDP(msg.answer)
          connection.setRemoteDescription(sd, () => {}, () => {})
        } else if (Reflect.has(msg, 'candidate') && connection) {
          connection.addIceCandidate(this.createCandidate(msg.candidate))
        }
      }
    }

    createConnectionAndOffer (candidateCB, sdpCB, channelCB, key) {
      let connection = this.initConnection(candidateCB)
      let dc = connection.createDataChannel(key)
      dc.onopen = () => channelCB(dc)
      connection.createOffer(offer => {
        connection.setLocalDescription(offer, () => {
          sdpCB(connection.localDescription.toJSON())
        }, (err) => { throw new Error(`Could not set local description: ${err}`) })
      }, (err) => { throw new Error(`Could not create offer: ${err}`) })
      return connection
    }

    createConnectionAndAnswer (candidateCB, sdpCB, channelCB, offer) {
      let connection = this.initConnection(candidateCB)
      connection.ondatachannel = e => {
        e.channel.connection = connection
        e.channel.onopen = () => channelCB(e.channel)
      }
      connection.setRemoteDescription(this.createSDP(offer), () => {
        connection.createAnswer(answer => {
          connection.setLocalDescription(answer, () => {
            sdpCB(connection.localDescription.toJSON())
          }, (err) => { throw new Error(`Could not set local description: ${err}`) })
        }, (err) => { throw new Error(`Could not create answer: ${err}`) })
      }, (err) => { throw new Error(`Could not set remote description: ${err}`) })
      return connection
    }

    initConnection (candidateCB) {
      let connection = new this.RTCPeerConnection({iceServers: this.settings.iceServers})

      connection.onicecandidate = (e) => {
        if (e.candidate !== null) {
          let candidate = {
            candidate: e.candidate.candidate,
            sdpMLineIndex: e.candidate.sdpMLineIndex
          }
          candidateCB(candidate)
        }
      }
      return connection
    }

    createCandidate (candidate) {
      return new this.RTCIceCandidate(candidate)
    }

    createSDP (sdp) {
      return Object.assign(new this.RTCSessionDescription(), sdp)
    }

    randomKey () {
      const MIN_LENGTH = 10
      const DELTA_LENGTH = 10
      const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH)

      for (let i = 0; i < length; i++) {
        result += MASK[Math.round(Math.random() * (MASK.length - 1))]
      }
      return result
    }

    toStr (msg) { return JSON.stringify(msg) }
  }

  class JoiningPeer {
    constructor (id, intermediaryId) {
      this.id = id
      this.intermediaryId = intermediaryId
      this.intermediaryChannel = null
      this.channelsToAdd = []
      this.channelsToRemove = []
    }

    toAddList (channel) {
      this.channelsToAdd[this.channelsToAdd.length] = channel
    }

    toRemoveList (channel) {
      this.channelsToAdd[this.channelsToAdd.length] = channel
    }

  }

  /**
   * Class responsible of sent/received message format via channels.
   */
  class ChannelProxyService extends ServiceInterface {

    onMsg (e) {
      let msg = JSON.parse(e.data)
      let channel = e.currentTarget
      let webChannel = channel.webChannel
      let jp
      switch (msg.code) {
        case USER_DATA:
          webChannel.onMessage(msg.id, msg.data)
          break
        case LEAVE:
          webChannel.onLeaving(msg.id)
          for (let c of webChannel.channels) {
            if (c.peerId === msg.id) {
              webChannel.channels.delete(c)
            }
          }
          break
        case SERVICE_DATA:
          if (webChannel.myId === msg.recepient) {
            webChannel.proxy.onSrvMsg(webChannel, msg)
          } else {
            webChannel.sendSrvMsg(msg.serviceName, msg.recepient, msg.data)
          }
          break
        case JOIN_INIT:
          webChannel.topology = msg.manager
          webChannel.myId = msg.id
          channel.peerId = msg.intermediaryId
          jp = new JoiningPeer(msg.id, msg.intermediaryId)
          jp.intermediaryChannel = channel
          webChannel.addJoiningPeer(jp)
          break
        case JOIN_NEW_MEMBER:
          webChannel.addJoiningPeer(new JoiningPeer(msg.id, msg.intermediaryId))
          break
        case REMOVE_NEW_MEMBER:
          webChannel.removeJoiningPeer(msg.id)
          break
        case JOIN_FINILIZE:
          webChannel.joinSuccess(webChannel.myId)
          let nextMsg = webChannel.proxy.msg(JOIN_SUCCESS, {id: webChannel.myId})
          webChannel.manager.broadcast(webChannel, nextMsg)
          webChannel.onJoin()
          break
        case JOIN_SUCCESS:
          webChannel.joinSuccess(msg.id)
          webChannel.onJoining(msg.id)
          break
        case THIS_CHANNEL_TO_JOINING_PEER:
          if (webChannel.hasJoiningPeer(msg.id)) {
            jp = webChannel.getJoiningPeer(msg.id)
          } else {
            jp = new JoiningPeer(msg.id)
            webChannel.addJoiningPeer(jp)
          }
          if (msg.toBeAdded) {
            jp.toAddList(channel)
          } else {
            jp.toRemoveList(channel)
          }
          break
      }
    }

    onClose () {
      console.log('DATA_CHANNEL CLOSE: ')
    }

    onError (err) {
      console.log('DATA_CHANNEL ERROR: ', err)
    }

    onSrvMsg (webChannel, msg) {
      get(msg.serviceName, webChannel.settings).onMessage(webChannel, msg.data)
    }

    msg (code, data = {}) {
      let msg = Object.assign({code}, data)
      return JSON.stringify(msg)
    }
  }

  // Service names
  const CHANNEL_PROXY = 'ChannelProxyService'
  const WEBRTC$1 = 'WebRTCService'
  const FULLY_CONNECTED$1 = 'FullyConnectedService'

  let services = new Map()

  function get (code, options = {}) {
    if (services.has(code)) {
      return services.get(code)
    }
    let service
    switch (code) {
      case WEBRTC$1:
        return new WebRTCService(options)
      case FULLY_CONNECTED$1:
        service = new FullyConnectedService()
        services.set(code, service)
        return service
      case CHANNEL_PROXY:
        service = new ChannelProxyService()
        services.set(code, service)
        return service
    }
  }

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
        connector: WEBRTC$1,
        topology: FULLY_CONNECTED$1
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
      this.proxy = get(CHANNEL_PROXY)
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
      this.manager.broadcast(this, this.proxy.msg(LEAVE,
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
        USER_DATA,
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
        USER_DATA,
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

      let cBuilder = get(settings.connector, settings)
      try {
        let data = cBuilder.open(this, (channel) => {
          console.log('NEW PEER')
          this.initChannel(channel)
          let jp = new JoiningPeer(channel.peerId, this.myId)
          jp.intermediaryChannel = channel
          this.joiningPeers.add(jp)
          channel.send(this.proxy.msg(JOIN_INIT,
            {manager: this.settings.topology,
            id: channel.peerId,
            intermediaryId: this.myId}
          ))
          console.log('BEFORE BROADCAST')
          this.manager.broadcast(this, this.proxy.msg(JOIN_NEW_MEMBER,
            {id: channel.peerId, intermediaryId: this.myId}
          ))
          console.log('AFTER BROADCAST')
          this.manager.add(channel)
            .then(() => {
              channel.send(this.proxy.msg(JOIN_FINILIZE))
            })
            .catch((msg) => {
              console.log(`Adding peer ${channel.peerId} failed: ${msg}`)
              this.manager.broadcast(this, this.proxy.msg(REMOVE_NEW_MEMBER,
                {id: channel.peerId}
              ))
              this.removeJoiningPeer(jp.id)
            })
        })
        return data.key
      } catch (e) {
        console.log('WebChannel open error: ', e)
      }
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

      let cBuilder = get(settings.connector, settings)
      return new Promise((resolve, reject) => {
        cBuilder
          .join(key)
          .then((channel) => {
            this.initChannel(channel)
            console.log('JOIN channel established')
            this.onJoin = () => { resolve(this) }
          })
          .catch((msg) => {
            console.log(msg)
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
      let stringifiedMsg = this.proxy.msg(SERVICE_DATA, completeMsg)
      if (recepient === this.myId) {
        this.proxy.onSrvMsg(this, completeMsg)
      } else {
        // If this function caller is a peer who is joining
        if (this.isJoining()) {
          let ch = this.getJoiningPeer(this.myId).intermediaryChannel
          if (ch.readyState !== 'closed') {
            ch.send(stringifiedMsg)
          }
        } else {
          // If the recepient is a joining peer
          if (this.hasJoiningPeer(recepient)) {
            let jp = this.getJoiningPeer(recepient)
            // If I am an intermediary peer for recepient
            if (jp.intermediaryId === this.myId && jp.intermediaryChannel.readyState !== 'closed') {
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
      this.manager = get(this.settings.topology)
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
      channel.onerror = this.proxy.onError
      channel.onclose = this.proxy.onClose
      if (id !== '') {
        channel.peerId = id
      } else {
        channel.peerId = this.generateId()
      }
      channel.connection.oniceconnectionstatechange = () => {
        console.log('STATE FOR ' + channel.peerId + ' CHANGED TO: ', channel.connection.iceConnectionState)
        if (channel.connection.iceConnectionState === 'disconnected') {
          this.channels.delete(channel)
          this.onLeaving(channel.peerId)
        }
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

  const WEBRTC = WEBRTC$1
  const FULLY_CONNECTED = FULLY_CONNECTED$1

  exports.WEBRTC = WEBRTC;
  exports.FULLY_CONNECTED = FULLY_CONNECTED;
  exports.WebChannel = WebChannel;

}));
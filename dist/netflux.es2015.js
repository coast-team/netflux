(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.nf = global.nf || {})));
}(this, function (exports) { 'use strict';

  /**
   * Service module includes {@link module:channelBuilder},
   * {@link module:webChannelManager} and {@link module:channelProxy} modules.
   * Services are substitutable stateless objects. Each service is identified by
   * its class name and can receive messages via `WebChannel` sent by another
   * service.
   *
   * @module service
   * @see module:channelBuilder
   * @see module:webChannelManager
   * @see module:channelProxy
   */

  /**
   * Each service must implement this interface.
   *
   * @interface
   */
  class Interface$1 {

    /**
     * Service name which corresponds to its class name.
     *
     * @return {string} - name
     */
    get name () {
      return this.constructor.name
    }

    /**
     * On message event handler.
     *
     * @abstract
     * @param  {WebChannel} wc - Web Channel from which the message is arrived.
     * @param  {string} msg - Message in stringified JSON format.
     */
    onMessage (wc, msg) {
      throw new Error('Must be implemented by subclass!')
    }
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
   * Proxy module for configure channel event handlers and any message sent via
   * a channel should be build here in order to be understand by the recepient
   * peer.
   * @module channelProxy
   */

   /**
    * Constant used to build a message designated to API user.
    * @type {int}
    */
  const USER_DATA = 0

  /**
   * Constant used to build a message designated to a specific service.
   * @type {int}
   */
  const SERVICE_DATA = 1
  /**
   * Constant used to build a message that a user has left Web Channel.
   * @type {int}
   */
  const LEAVE = 8
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
  const JOIN_NEW_MEMBER = 6
  /**
   * Constant used to build a message to be sent to all peers in Web Channel to
   * notify them that the new peer who should join the Web Channel, refuse to join.
   * @type {int}
   */
  const REMOVE_NEW_MEMBER = 9
  /**
   * Constant used to build a message to be sent to a newly joining peer that he
   * has can now succesfully join Web Channel.
   * @type {int}
   */
  const JOIN_FINILIZE = 5
  /**
   * Constant used to build a message to be sent by the newly joining peer to all
   * peers in Web Channel to notify them that he has succesfully joined the Web
   * Channel.
   * @type {int}
   */
  const JOIN_SUCCESS = 4
  /**
   * @type {int}
   */
  const THIS_CHANNEL_TO_JOINING_PEER = 7

  /**
   * This is a special service class for {@link ChannelInterface}. It mostly
   * contains event handlers (e.g. *onmessage*, *onclose* etc.) to configure
   * a newly created channel. Thus be careful to use `this` in handlers, as
   * it will refer to the instance of `ChannelInterface` and not to the
   * instance of `ChannelProxyService`.
   */
  class ChannelProxyService extends Interface$1 {

    /**
     * On message event handler.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent}
     *
     * @param  {MessageEvent} msgEvt - Message event
     */
    onMsg (msgEvt) {
      let msg = JSON.parse(msgEvt.data)
      let ch = msgEvt.currentTarget
      let wc = ch.webChannel
      let jp
      switch (msg.code) {
        case USER_DATA:
          wc.onMessage(msg.id, msg.data)
          break
        case LEAVE:
          wc.onLeaving(msg.id)
          for (let c of wc.channels) {
            if (c.peerId === msg.id) {
              wc.channels.delete(c)
            }
          }
          break
        case SERVICE_DATA:
          if (wc.myId === msg.recepient) {
            wc.proxy.onSrvMsg(wc, msg)
          } else {
            wc.sendSrvMsg(msg.serviceName, msg.recepient, msg.data)
          }
          break
        case JOIN_INIT:
          wc.topology = msg.manager
          wc.myId = msg.id
          ch.peerId = msg.intermediaryId
          jp = new JoiningPeer(msg.id, msg.intermediaryId)
          jp.intermediaryChannel = ch
          wc.addJoiningPeer(jp)
          break
        case JOIN_NEW_MEMBER:
          wc.addJoiningPeer(new JoiningPeer(msg.id, msg.intermediaryId))
          break
        case REMOVE_NEW_MEMBER:
          wc.removeJoiningPeer(msg.id)
          break
        case JOIN_FINILIZE:
          wc.joinSuccess(wc.myId)
          let nextMsg = wc.proxy.msg(JOIN_SUCCESS, {id: wc.myId})
          wc.manager.broadcast(wc, nextMsg)
          wc.onJoin()
          break
        case JOIN_SUCCESS:
          wc.joinSuccess(msg.id)
          wc.onJoining(msg.id)
          break
        case THIS_CHANNEL_TO_JOINING_PEER:
          if (wc.hasJoiningPeer(msg.id)) {
            jp = wc.getJoiningPeer(msg.id)
          } else {
            jp = new JoiningPeer(msg.id)
            wc.addJoiningPeer(jp)
          }
          if (msg.toBeAdded) {
            jp.toAddList(ch)
          } else {
            jp.toRemoveList(ch)
          }
          break
      }
    }

    /**
     * On channel close event handler.
     * - For `RTCDataChannel` the type of `evt` is `Event`
     * - For `WebSocket`, the type of `evt` is `CloseEvent`.
     * @see [Event doc on MDN]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
     * @see [CloseEvent doc on MDN]{@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent}
     *
     * @param  {Event} evt - Close event.
     */
    onClose (evt) {
      console.log('DATA_CHANNEL CLOSE: ', evt)
    }

    /**
     * On error event handler.
     * @see [Event doc on MDN]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
     *
     * @param  {Event} evt - Error event.
     */
    onError (evt) {
      console.log('DATA_CHANNEL ERROR: ', evt)
    }

    /**
     * When the message is designated for a service. This is not an event handler
     * for a channel. The main difference with the `SERVICE_DATA` message arriving
     * for `onMessage` is that here the message could be sent by the peer to
     * himself.
     *
     * @param  {WebChannel} wc - Web Channel.
     * @param  {Object} msg - Message.
     */
    onSrvMsg (wc, msg) {
      get(msg.serviceName, wc.settings).onMessage(wc, msg.data)
    }

    /**
     * Message builder.
     *
     * @param  {int} code - One of the constant values in {@link constans}.
     * @param  {Object} [data={}] - Data to be send.
     * @return {string} - Data in stringified JSON format.
     */
    msg (code, data = {}) {
      let msg = Object.assign({code}, data)
      return JSON.stringify(msg)
    }
  }

  /**
   * Web Channel Manager module is a submodule of {@link module:service} and the
   * main component of any Web Channel. It is responsible to preserve Web Channel
   * structure intact (i.e. all peers have the same vision of the Web Channel).
   * Among its duties are:
   *
   * - Add a new peer into Web Channel.
   * - Remove a peer from Web Channel.
   * - Send a broadcast message.
   * - Send a message to a particular peer.
   *
   * @module webChannelManager
   * @see FullyConnectedService
   */

  /**
   * Connection service of the peer who received a message of this type should
   * establish connection with one or several peers.
   */
  const CONNECT_WITH = 1
  const CONNECT_WITH_FEEDBACK = 2
  const CONNECT_WITH_TIMEOUT = 4000
  const ADD_INTERMEDIARY_CHANNEL = 4

  /**
   * Each Web Channel Manager Service must implement this interface.
   * @interface
   * @extends module:service~Interface
   */
  class Interface extends Interface$1 {
    onMessage (wc, msg) {
      let cBuilder = get(wc.settings.connector, wc.settings)
      switch (msg.code) {
        case CONNECT_WITH:
          msg.peers = this.reUseIntermediaryChannelIfPossible(wc, msg.jpId, msg.peers)
          cBuilder
            .connectMeToMany(wc, msg.peers)
            .then(result => {
              result.channels.forEach(c => {
                wc.initChannel(c, c.peerId)
                wc.getJoiningPeer(msg.jpId).toAddList(c)
                c.send(wc.proxy.msg(THIS_CHANNEL_TO_JOINING_PEER,
                  {id: msg.jpId, toBeAdded: true}
                ))
              })
              wc.sendSrvMsg(this.name, msg.sender,
                {code: CONNECT_WITH_FEEDBACK, id: wc.myId, failed: result.failed}
              )
            })
            .catch(err => {
              console.log('connectMeToMany FAILED, ', err)
            })
          break
        case CONNECT_WITH_FEEDBACK:
          wc.connectWithRequests.get(msg.id)(true)
          break
        case ADD_INTERMEDIARY_CHANNEL:
          let jp = wc.getJoiningPeer(msg.jpId)
          jp.toAddList(jp.intermediaryChannel)
          break
      }
    }

    /**
     * Send a request to a peer asking him to establish a connection with some
     * peers. This function is used when a new peer is joining Web Channel.
     * The request can be sent to the peer who is joining as well as other peers
     * who are already members of Web Channel.
     *
     * @param  {WebChannel} wc - The Web Channel.
     * @param  {string} id - Id of the peer who will receive this request.
     * @param  {string} jpId - Joining peer id (it is possible that `id`=`jpId`).
     * @param  {string[]} peers - Ids of peers with whom `id` peer must established
  *              connections.
     * @return {Promise} - Is resolved once some of the connections could be established. It is rejected when an error occured.
     */
    connectWith (wc, id, jpId, peers) {
      wc.sendSrvMsg(this.name, id,
        {code: CONNECT_WITH, jpId: jpId,
          sender: wc.myId, peers}
      )
      return new Promise((resolve, reject) => {
        wc.connectWithRequests.set(id, isDone => {
          if (isDone) {
            resolve()
          } else {
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

    /**
     * Adds a new peer into Web Channel.
     *
     * @abstract
     * @param  {ChannelInterface} ch - Channel to be added (it should has
     * the `webChannel` property).
     * @return {Promise} - Resolved once the channel has been succesfully added,
     * rejected otherwise.
     */
    add (ch) {
      throw new Error('Must be implemented by subclass!')
    }

    /**
     * Send a message to all peers in Web Channel.
     *
     * @abstract
     * @param  {WebChannel} wc - Web Channel where the message will be propagated.
     * @param  {string} data - Data in stringified JSON format to be send.
     */
    broadcast (wc, data) {
      throw new Error('Must be implemented by subclass!')
    }

    /**
     * Send a message to a particular peer in Web Channel.
     *
     * @abstract
     * @param  {string} id - Peer id.
     * @param  {WebChannel} wc - Web Channel where the message will be propagated.
     * @param  {string} data - Data in stringified JSON format to be send.
     */
    sendTo (id, wc, data) {
      throw new Error('Must be implemented by subclass!')
    }

    /**
     * Leave Web Channel.
     *
     * @abstract
     * @param  {WebChannel} wc - Web Channel to leave.
     */
    leave (wc) {
      throw new Error('Must be implemented by subclass!')
    }
  }

  /**
   * Fully connected web channel manager. Implements fully connected topology
   * network, when each peer is connected to each other.
   *
   * @extends module:webChannelManager~Interface
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
   * Channel Builder module is responsible to create a connection between two
   * peers.
   * @module channelBuilder
   * @see ChannelInterface
   */

  /**
   * Interface to be implemented by each connection service.
   * @interface
   * @extends module:service~Interface
   */
  class Interface$2 extends Interface$1 {
    /**
     * Callback function for resolved Promise state returned by
     * {@link module:channelBuilder~Interface#connectMeToMany} function.
     *
     * @callback module:channelBuilder~Interface~connectMeToManyCallback
     * @param {Object} result - Result object
     * @param {ChannelInterface[]} result.channels - Channels which are
     * succesfully created.
     * @param {string[]} result.failed - Identifiers of peers with whom the
     * connection could not be established.
     */

     /**
      * On channel callback for {@link module:channelBuilder~Interface#open}
      * function.
      *
      * @callback module:channelBuilder~Interface~onChannelCallback
      * @param {ChannelInterface} channel - A new channel.
      */

    /**
     * Establish a connection between you and several peers. It is also possible
     * to connect with a peer who is about to join the Web Channel.
     *
     * @abstract
     * @param  {WebChannel} wc - Web Channel through which the connections will be
     * established.
     * @param  {string[]} ids Peers identifiers with whom it establishes
     * connections.
     * @return {Promise} - Is always resolved. The callback function type is
     * {@link module:channelBuilder~Interface~connectMeToManyCallback}.
     */
    connectMeToMany (wc, ids) {
      throw new Error('Must be implemented by subclass!')
    }

    /**
     * Establish a connection between you and another peer (including
     * joining peer).
     *
     * @abstract
     * @param  {WebChannel} wc - Web Channel through which the connection will be
     * established.
     * @param  {string} id - Peer id with whom the connection will be established.
     * @return {Promise} - Resolved once the connection has been established,
     * rejected otherwise.
     */
    connectMeToOne (wc, id) {
      throw new Error('Must be implemented by subclass!')
    }

    /**
     * Enables other clients to establish a connection with you.
     *
     * @abstract
     * @param {module:channelBuilder~Interface~onChannelCallback} onChannel -
     * Callback function to execute once the connection is established.
     * @param {Object} [options] - Any other options which depend on the implementation.
     * @return {Promise} - Once resolved, provide an Object with `key` attribute
     *           to be passed to {@link connector#join} function. It is rejected
     *           if an error occured.
     */
    open (onChannel, options) {
      throw new Error('Must be implemented by subclass!')
    }

    /**
     * Connects you with the peer who provided the `key`.
     *
     * @abstract
     * @param  {string} key - A key obtained from a peer.
     * @param  {Object} [options] Any other options which depend on the
     * implementation.
     * @return {Promise} It is resolved when the connection is established,
     * otherwise it is rejected.
     */
    join (key, options) {
      throw new Error('Must be implemented by subclass!')
    }
  }

  const CONNECTION_CREATION_TIMEOUT = 2000

  /**
   * Error which might occur during interaction with signaling server.
   *
   * @see [Error]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error}
   * @extends Error
   */
  class SignalingError extends Error {
    constructor (msg, evt = null) {
      super(msg)
      this.name = 'SignalingError'
      this.evt = evt
    }
  }

  /**
   * Service class responsible to establish connections between peers via
   * `RTCDataChannel`.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection}
   * @extends module:channelBuilder~Interface
   */
  class WebRTCService extends Interface$2 {

    /**
     * WebRTCService constructor.
     *
     * @param  {Object} [options] - This service options.
     * @param  {Object} [options.signaling='wws://sigver-coastteam.rhcloud.com:8000'] -
     * Signaling server URL.
     * @param  {Object[]} [options.iceServers=[{urls: 'stun:23.21.150.121'},{urls: 'stun:stun.l.google.com:19302'},{urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}]] - WebRTC options to setup which STUN
     * and TURN servers to be used.
     */
    constructor (options = {}) {
      super()
      this.defaults = {
        signaling: 'wws://sigver-coastteam.rhcloud.com:8000',
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
        window.webkitRTCPeerConnection

      this.RTCIceCandidate =
        window.RTCIceCandidate ||
        window.mozRTCIceCandidate ||
        window.RTCIceCandidate

      this.RTCSessionDescription =
        window.RTCSessionDescription ||
        window.mozRTCSessionDescription ||
        window.webkitRTCSessionDescription
    }

    open (key, onChannel, options = {}) {
      let settings = Object.assign({}, this.settings, options)
      // Connection array, because several connections may be establishing
      // at the same time
      let connections = []

      try {
        // Connect to the signaling server
        let socket = new window.WebSocket(settings.signaling)

        // Send a message to signaling server: ready to receive offer
        socket.onopen = () => { socket.send(this.toStr({key})) }
        socket.onmessage = evt => {
          let msg = JSON.parse(evt.data)
          if (!Reflect.has(msg, 'id') || !Reflect.has(msg, 'data')) {
            // throw new SignalingError(err.name + ': ' + err.message)
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
        socket.onerror = evt => {
          throw new SignalingError(`error occured on the socket with signaling server ${settings.signaling}`)
        }
        socket.onclose = closeEvt => {
          // 1000 corresponds to CLOSE_NORMAL: Normal closure; the connection
          // successfully completed whatever purpose for which it was created.
          if (closeEvt.code !== 1000) {
            throw new SignalingError(`connection with signaling server
            ${settings.signaling} has been closed abnormally.
            CloseEvent code: ${closeEvt.code}. Reason: ${closeEvt.reason}`)
          }
        }
        return {key, socket, signaling: settings.signaling}
      } catch (err) {
        throw new SignalingError(err.name + ': ' + err.message)
      }
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
        socket.onerror = e => {
          reject(`Signaling server socket error: ${e.message}`)
        }
        socket.onclose = e => {
          if (e.code !== 1000) { reject(e.reason) }
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
              .then(channel => {
                counter++
                result.channels.push(channel)
                if (counter === ids.length) {
                  resolve(result)
                }
              })
              .catch(err => {
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

  /**
   * Service Provider module is a helper module for {@link module:service}. It is
   * responsible to instantiate all services. This module must be used to get
   * any service instance.
   * @module serviceProvider
   */

  /**
   * Constant used to get an instance of {@link ChannelProxyService}.
   * @type {string}
   */
  const CHANNEL_PROXY = 'ChannelProxyService'

  /**
   * Constant used to get an instance of {@link WebRTCService}.
   * @type {string}
   */
  const WEBRTC$1 = 'WebRTCService'

  /**
   * Constant used to get an instance of {@link FullyConnectedService}.
   * @type {string}
   */
  const FULLY_CONNECTED$1 = 'FullyConnectedService'

  const services = new Map()

  /**
   * Provides the service instance specified by `name`.
   *
   * @param  {(module:serviceProvider.CHANNEL_PROXY|
   *          module:serviceProvider.WEBRTC|
   *          module:serviceProvider.FULLY_CONNECTED)} name - The service name.
   * @param  {Object} [options] - Any options that the service accepts.
   * @return {module:service~Interface} - Service instance.
   */
  function get (name, options = {}) {
    if (services.has(name)) {
      return services.get(name)
    }
    let service
    switch (name) {
      case WEBRTC$1:
        return new WebRTCService(options)
      case FULLY_CONNECTED$1:
        service = new FullyConnectedService()
        services.set(name, service)
        return service
      case CHANNEL_PROXY:
        service = new ChannelProxyService()
        services.set(name, service)
        return service
      default:
        return null
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
        connector: WEBRTC$1,
        topology: FULLY_CONNECTED$1
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

    /**
     * On message event handler.
     *
     * @param  {string} id  - Peer id the message came from.
     * @param  {string} msg - Message
     */
    onMessage (id, msg) {}

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
     * Send the message to a particular peer.
     *
     * @param  {type} id Peer id of the recipient peer
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
     * @param  {Object} [options] Any available connection service options.
     * @return {string} The key required by other peer to join the `WebChannel`.
     */
    openForJoining (options = {}) {
      let settings = Object.assign({}, this.settings, options)

      let cBuilder = get(settings.connector, settings)
      let key = this.id + this.myId
      try {
        let data = cBuilder.open(key, channel => {
          this.initChannel(channel)
          let jp = new JoiningPeer(channel.peerId, this.myId)
          jp.intermediaryChannel = channel
          this.joiningPeers.add(jp)
          channel.send(this.proxy.msg(JOIN_INIT,
            {manager: this.settings.topology,
            id: channel.peerId,
            intermediaryId: this.myId}
          ))
          this.manager.broadcast(this, this.proxy.msg(JOIN_NEW_MEMBER,
            {id: channel.peerId, intermediaryId: this.myId}
          ))
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
        this.webRTCOpen = data.socket
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
     * @param  {type} [options] Any available connection service options.
     * @return {Promise} It resolves once you became a `WebChannel` member.
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
          .catch(reason => reject(reason))
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

    set topology (name) {
      this.settings.topology = name
      this.manager = get(this.settings.topology)
    }

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

  const WEBRTC = WEBRTC$1
  const FULLY_CONNECTED = FULLY_CONNECTED$1

  exports.WEBRTC = WEBRTC;
  exports.FULLY_CONNECTED = FULLY_CONNECTED;
  exports.WebChannel = WebChannel;

}));
const signaling = 'ws://localhost:8000'

/**
 * Service module includes {@link module:channelBuilder},
 * {@link module:webChannelManager} and {@link module:messageBuilder}.
 * Services are substitutable stateless objects. Each service is identified by
 * its class name and some of them can receive messages via `WebChannel` sent
 * by another service.
 *
 * @module service
 * @see module:channelBuilder
 * @see module:webChannelManager
 * @see module:messageBuilder
 */

/**
 * Each service must implement this interface.
 * @interface
 */
class ServiceInterface {

  /**
   * Service name which corresponds to its class name.
   * @return {string} - Name
   */
  get name () {
    return this.constructor.name
  }
}

/**
 * Channel Builder module is responsible to create a connection between two
 * peers.
 * @module channelBuilder
 * @see Channel
 */

/**
 * On channel callback for {@link module:channelBuilder~ChannelBuilderInterface#open}
 * function.
 *
 * @callback module:channelBuilder~onChannelCallback
 * @param {Channel} channel - A new channel.
 */

/**
 * Call back to initialize the channel. It should be executed on both peer
 * sides during connection establishment to assure that both channels would be
 * ready to be used in the web channel.
 *
 * @callback module:channelBuilder~initChannel
 * @param {Channel} ch - Channel.
 * @param {string} id - Unique channel identifier.
 */

/**
 * Interface to be implemented by each connection service.
 *
 * @interface
 * @extends module:service~ServiceInterface
 */
class ChannelBuilderInterface extends ServiceInterface {

  constructor () {
    super()
  }

  /**
   * Enables other clients to establish a connection with you.
   *
   * @abstract
   * @param {string} key - The unique identifier which has to be passed to the
   * peers who need to connect to you.
   * @param {module:channelBuilder~ChannelBuilderInterface~onChannelCallback} onChannel - Callback
   * function to execute once the connection has been established.
   * @param {Object} [options] - Any other options which depend on the service implementation.
   * @return {Promise} - Once resolved, provide an Object with `key` and `url`
   * attributes to be passed to {@link module:channelBuilder~ChannelBuilderInterface#join} function.
   * It is rejected if an error occured.
   */
  open (key, onChannel, options) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Connects you with the peer who provided the `key`.
   *
   * @abstract
   * @param  {string} key - A key obtained from the peer who executed
   * {@link module:channelBuilder~ChannelBuilderInterface#open} function.
   * @param  {Object} [options] Any other options which depend on the implementation.
   * @return {Promise} It is resolved when the connection is established, otherwise it is rejected.
   */
  join (key, options) {
    throw new Error('Must be implemented by subclass!')
  }

  /**
   * Establish a connection between you and another peer (including joining peer) via web channel.
   *
   * @abstract
   * @param  {WebChannel} wc - Web Channel through which the connection will be established.
   * @param  {string} id - Peer id with whom you will be connected.
   * @return {Promise} - Resolved once the connection has been established, rejected otherwise.
   */
  connectMeTo (wc, id) {
    throw new Error('Must be implemented by subclass!')
  }
}

let WebSocket;
let WebRTC;
try {
  WebRTC = require('wrtc')
  WebSocket = require('ws')
} catch(e) {
  console.log('require not done')
}

let RTCPeerConnection;
let RTCIceCandidate;
if (WebRTC) {
  RTCPeerConnection = WebRTC.RTCPeerConnection
  RTCIceCandidate = WebRTC.RTCIceCandidate
} else {
  RTCPeerConnection = window.RTCPeerConnection
  RTCIceCandidate = window.RTCIceCandidate
  WebSocket = window.WebSocket
}

/**
 * Ice candidate event handler.
 *
 * @callback WebRTCService~onCandidate
 * @param {external:RTCPeerConnectionIceEvent} evt - Event.
 */

/**
 * Session description event handler.
 *
 * @callback WebRTCService~onSDP
 * @param {external:RTCPeerConnectionIceEvent} evt - Event.
 */

/**
 * Data channel event handler.
 *
 * @callback WebRTCService~onChannel
 * @param {external:RTCPeerConnectionIceEvent} evt - Event.
 */

/**
 * The goal of this class is to prevent the error when adding an ice candidate
 * before the remote description has been set.
 */
class RTCPendingConnections {
  constructor () {
    this.connections = new Map()
  }

  /**
   * Prepares pending connection for the specified peer only if it has not been added already.
   *
   * @param  {string} id - Peer id
   */
  add (id) {
    if (!this.connections.has(id)) {
      let pc = null
      let obj = {promise: null}
      obj.promise = new Promise((resolve, reject) => {
        Object.defineProperty(obj, 'pc', {
          get: () => pc,
          set: (value) => {
            pc = value
            resolve()
          }
        })
        setTimeout(reject, CONNECT_TIMEOUT, 'timeout')
      })
      this.connections.set(id, obj)
    }
  }

  /**
   * Remove a pending connection from the Map. Usually when the connection has already
   * been established and there is now interest to hold this reference.
   *
   * @param  {string} id - Peer id.
   */
  remove (id) {
    this.connections.delete(id)
  }

  /**
   * Returns RTCPeerConnection object for the provided peer id.
   *
   * @param  {string} id - Peer id.
   * @return {external:RTCPeerConnection} - Peer connection.
   */
  getPC (id) {
    return this.connections.get(id).pc
  }

  /**
   * Updates RTCPeerConnection reference for the provided peer id.
   *
   * @param  {string} id - Peer id.
   * @param  {external:RTCPeerConnection} pc - Peer connection.
   */
  setPC (id, pc) {
    this.connections.get(id).pc = pc
  }

  /**
   * When the remote description is set, it will add the ice candidate to the
   * peer connection of the specified peer.
   *
   * @param  {string} id - Peer id.
   * @param  {external:RTCIceCandidate} candidate - Ice candidate.
   * @return {Promise} - Resolved once the ice candidate has been succesfully added.
   */
  addIceCandidate (id, candidate) {
    let obj = this.connections.get(id)
    return obj.promise.then(() => {
      return obj.pc.addIceCandidate(candidate)
    })
  }
}

const CONNECT_TIMEOUT = 2000
const connectionsByWC = new Map()

/**
 * Service class responsible to establish connections between peers via
 * `RTCDataChannel`.
 *
 * @see {@link external:RTCPeerConnection}
 * @extends module:channelBuilder~ChannelBuilderInterface
 */
class WebRTCService extends ChannelBuilderInterface {

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
      signaling: 'ws://sigver-coastteam.rhcloud.com:8000',
      iceServers: [
        {urls: 'stun:turn01.uswest.xirsys.com'}
      ]
    }
    this.settings = Object.assign({}, this.defaults, options)
  }

  open (key, onChannel, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    return new Promise((resolve, reject) => {
      let connections = new RTCPendingConnections()
      let socket
      try {
          socket = new WebSocket(settings.signaling)

          // Timeout for node (otherwise it will loop forever if incorrect address)
          if (socket.readyState === WebSocket.CONNECTING) {
            setTimeout(() => {
              if (socket.readyState === WebSocket.CONNECTING ||
                  socket.readyState === WebSocket.CLOSING ||
                  socket.readyState === WebSocket.CLOSED) {
                reject('Node Timeout reached')
              }
            }, 3000)
          } else if (socket.readyState === WebSocket.CLOSING ||
            socket.readyState === WebSocket.CLOSED) {
            reject('Socked closed on open')
          }
      } catch (err) {
        reject(err.message)
      }
      // Send a message to signaling server: ready to receive offer
      socket.onopen = () => {
        try {
          socket.send(JSON.stringify({key}))
        } catch (err) {
          reject(err.message)
        }
        // TODO: find a better solution than setTimeout. This is for the case when the key already exists and thus the server will close the socket, but it will close it after this function resolves the Promise.
        setTimeout(resolve, 100, {key, url: settings.signaling, socket})
      }
      socket.onmessage = (evt) => {
        let msg = JSON.parse(evt.data)
        if (!('id' in msg) || !('data' in msg)) {
          console.error('Unknown message from the signaling server: ' + evt.data)
          socket.close()
          return
        }
        connections.add(msg.id)
        if ('offer' in msg.data) {
          this.createPeerConnectionAndAnswer(
              (candidate) => socket.send(JSON.stringify({id: msg.id, data: {candidate}})),
              (answer) => socket.send(JSON.stringify({id: msg.id, data: {answer}})),
              onChannel,
              msg.data.offer
            ).then((pc) => connections.setPC(msg.id, pc))
            .catch((err) => {
              console.error(`Answer generation failed: ${err.message}`)
            })
        } else if ('candidate' in msg.data) {
          connections.addIceCandidate(msg.id, new RTCIceCandidate(msg.data.candidate))
            .catch((err) => {
              console.log(msg.data.candidate.candidate)
              console.log(msg.data.candidate.sdpMLineIndex)
              console.log(msg.data.candidate.sdpMid)
              console.error(`Adding ice candidate failed: ${err.message}`)
            })
        }
      }
      socket.onclose = (closeEvt) => {
        if (closeEvt.code !== 1000) {
          console.error(`Socket with signaling server ${settings.signaling} has been closed with code ${closeEvt.code}: ${closeEvt.reason}`)
          reject(closeEvt.reason)
        }
      }
    })
  }

  join (key, options = {}) {
    let settings = Object.assign({}, this.settings, options)
    return new Promise((resolve, reject) => {
      let pc
      // Connect to the signaling server
      let socket = new WebSocket(settings.signaling)
      // Timeout for node (otherwise it will loop forever if incorrect address)
      if (socket.readyState === WebSocket.CONNECTING) {
        setTimeout(() => {
          if (socket.readyState === WebSocket.CONNECTING ||
              socket.readyState === WebSocket.CLOSING ||
              socket.readyState === WebSocket.CLOSED) {
            reject('Node Timeout reached')
          }
        }, 3000)
      } else if (socket.readyState === WebSocket.CLOSING ||
        socket.readyState === WebSocket.CLOSED) {
        reject('Socked closed on open')
      }
      socket.onopen = () => {
        // Prepare and send offer
        this.createPeerConnectionAndOffer(
            (candidate) => socket.send(JSON.stringify({data: {candidate}})),
            (offer) => socket.send(JSON.stringify({join: key, data: {offer}})),
            resolve
          )
          .then((peerConnection) => { pc = peerConnection })
          .catch(reject)
      }
      socket.onmessage = (evt) => {
        try {
          let msg = JSON.parse(evt.data)
          // Check message format
          if (!('data' in msg)) {
            reject(`Unknown message from the signaling server: ${evt.data}`)
          }

          if ('answer' in msg.data) {
            pc.setRemoteDescription(msg.data.answer)
              .catch((err) => {
                console.error(`Set answer: ${err.message}`)
                reject(err)
              })
          } else if ('candidate' in msg.data) {
            pc.addIceCandidate(new RTCIceCandidate(msg.data.candidate))
              .catch((evt) => {
                // This exception does not reject the current Promise, because
                // still the connection may be established even without one or
                // several candidates
                console.error(`Add ICE candidate: ${evt.message}`)
              })
          } else {
            reject(`Unknown message from the signaling server: ${evt.data}`)
          }
        } catch (err) {
          reject(err.message)
        }
      }
      socket.onerror = (evt) => {
        reject('WebSocket with signaling server error: ' + evt.message)
      }
      socket.onclose = (closeEvt) => {
        if (closeEvt.code !== 1000) {
          reject(`Socket with signaling server ${settings.signaling} has been closed with code ${closeEvt.code}: ${closeEvt.reason}`)
        }
      }
    })
  }

  connectMeTo (wc, id) {
    return new Promise((resolve, reject) => {
      let sender = wc.myId
      let connections = this.getPendingConnections(wc)
      connections.add(id)
      this.createPeerConnectionAndOffer(
        (candidate) => wc.sendSrvMsg(this.name, id, {sender, candidate}),
        (offer) => wc.sendSrvMsg(this.name, id, {sender, offer}),
        (channel) => {
          connections.remove(id)
          resolve(channel)
        }
      ).then((pc) => connections.setPC(id, pc))
      setTimeout(reject, CONNECT_TIMEOUT, 'connectMeTo timeout')
    })
  }

  onMessage (wc, channel, msg) {
    let connections = this.getPendingConnections(wc)
    connections.add(msg.sender)
    if ('offer' in msg) {
      this.createPeerConnectionAndAnswer(
        (candidate) => wc.sendSrvMsg(this.name, msg.sender,
          {sender: wc.myId, candidate}),
        (answer) => wc.sendSrvMsg(this.name, msg.sender,
          {sender: wc.myId, answer}),
        (channel) => {
          wc.initChannel(channel, false, msg.sender)
          connections.remove(channel.peerId)
        },
        msg.offer
      ).then((pc) => {
        connections.setPC(msg.sender, pc)
      })
    } if ('answer' in msg) {
      connections.getPC(msg.sender)
        .setRemoteDescription(msg.answer)
        .catch((err) => console.error(`Set answer: ${err.message}`))
    } else if ('candidate' in msg) {
      connections.addIceCandidate(msg.sender, new RTCIceCandidate(msg.candidate))
        .catch((err) => { console.error(`Add ICE candidate: ${err.message}`) })
    }
  }

  /**
   * Creates a peer connection and generates an SDP offer.
   *
   * @param  {WebRTCService~onCandidate} onCandidate - Ice candidate event handler.
   * @param  {WebRTCService~onSDP} sendOffer - Session description event handler.
   * @param  {WebRTCService~onChannel} onChannel - Handler event when the data channel is ready.
   * @return {Promise} - Resolved when the offer has been succesfully created,
   * set as local description and sent to the peer.
   */
  createPeerConnectionAndOffer (onCandidate, sendOffer, onChannel) {
    let pc = this.createPeerConnection(onCandidate)
    let dc = pc.createDataChannel(null)
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected') {
        dc.onclose(new CloseEvent(pc.iceConnectionState))
      }
    }
    dc.onopen = (evt) => onChannel(dc)
    return pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        let test = {type: pc.localDescription.type, sdp: pc.localDescription.sdp}
        let anothertest = JSON.parse(JSON.stringify(pc.localDescription))
        // console.log(pc.localDescription.toJSON())
        // console.log(pc.localDescription)
        // console.log('-------')
        // console.log('stringified')
        // console.log(anothertest)
        // console.log('-------')
        sendOffer(anothertest)
        return pc
      })
  }

  /**
   * Creates a peer connection and generates an SDP answer.
   *
   * @param  {WebRTCService~onCandidate} onCandidate - Ice candidate event handler.
   * @param  {WebRTCService~onSDP} sendOffer - Session description event handler.
   * @param  {WebRTCService~onChannel} onChannel - Handler event when the data channel is ready.
   * @param  {Object} offer - Offer received from a peer.
   * @return {Promise} - Resolved when the offer has been succesfully created,
   * set as local description and sent to the peer.
   */
  createPeerConnectionAndAnswer (onCandidate, sendAnswer, onChannel, offer) {
    let pc = this.createPeerConnection(onCandidate)
    pc.ondatachannel = (dcEvt) => {
      let dc = dcEvt.channel
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected') {
          dc.onclose(new CloseEvent(pc.iceConnectionState))
        }
      }
      dc.onopen = (evt) => onChannel(dc)
    }
    // console.log('offer')
    // console.log(offer)
    // console.log('-------')
    // console.log('offer')
    // console.log(offer.sdp)
    // console.log('-------')
    return pc.setRemoteDescription(offer)
      .then(() => pc.createAnswer())
      .then((answer) => pc.setLocalDescription(answer))
      .then(() => {
        let test = {type: pc.localDescription.type, sdp: pc.localDescription.sdp}
        let anothertest = JSON.parse(JSON.stringify(pc.localDescription))
        // console.log('answer : test')
        // console.log(test)
        // console.log('-------')
        // console.log('answer : test')
        // console.log(test.sdp)
        // console.log('-------')
        // sendAnswer(pc.localDescription.toJSON())
        sendAnswer(anothertest)
        return pc
      })
      .catch((err) => {
        console.error(`Set offer & generate answer: ${err.message}`)
      })
  }

  /**
   * Creates an instance of `RTCPeerConnection` and sets `onicecandidate` event handler.
   *
   * @private
   * @param  {WebRTCService~onCandidate} onCandidate - Ice
   * candidate event handler.
   * @return {external:RTCPeerConnection} - Peer connection.
   */
  createPeerConnection (onCandidate) {
    let pc = new RTCPeerConnection({iceServers: this.settings.iceServers})
    pc.onicecandidate = (evt) => {
      if (evt.candidate !== null) {
        let candidate = {
          candidate: evt.candidate.candidate,
          sdpMid: evt.candidate.sdpMid,
          sdpMLineIndex: evt.candidate.sdpMLineIndex
        }
        onCandidate(candidate)
      }
    }
    return pc
  }

  getPendingConnections (wc) {
    if (connectionsByWC.has(wc.id)) {
      return connectionsByWC.get(wc.id)
    } else {
      let connections = new RTCPendingConnections()
      connectionsByWC.set(wc.id, connections)
      return connections
    }
  }
}

// const signaling = 'ws://sigver-coastteam.rhcloud.com:8000'

function randKey () {
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

describe('WebRTCService ->', () => {
  let webRTCService = new WebRTCService({signaling})

  // it('Open: should succeed and return the provided key', (done) => {
  //   let key = randKey()
  //   console.log("\n\nI'm 1")
  //   webRTCService.open(key, () => {})
  //     .then((data) => {
  //       expect(data.key).toBeDefined()
  //       expect(data.url).toBeDefined()
  //       expect(data.key).toEqual(key)
  //       done()
  //     })
  //     .catch((reason) => {
  //       console.log('Error: ' + reason)
  //       done.fail(reason)
  //     })
  // })

  // it('Open: should fail because of the wrong URL', (done) => {
  //   console.log("\n\nI'm 2")
  //   webRTCService.open(randKey(), () => {}, {
  //     signaling: 'https://github.com:8100/coast-team/netflux'
  //   }).then((data) => { done.fail() })
  //     .catch(done)
  // })

  it('Open: should fail because the provided key is already opened', (done) => {
    let key = randKey()
    console.log("\n\nI'm 3")
    webRTCService.open(key, () => {})
      .then((data) => {
        webRTCService.open(key, () => {})
          .then((reason) => {
            console.log('FAILED -----> ', reason)//JSON.stringify(reason))
            done.fail(reason)
          })
          .catch(done)
      })
      .catch(done.fail)
  })

  // it('Join: dataChannel should open', (done) => {
  //   console.log("\n\nI'm 4")
  //   webRTCService.open(randKey(), () => {})
  //     .then((data) => {
  //       webRTCService.join(data.key).then(done).catch(done.fail)
  //     })
  // })

  it('Join: should fail because of the wrong key', (done) => {
    console.log("\n\nI'm 5")
    webRTCService.open(randKey(), () => {})
      .then((data) => {
        webRTCService.join(randKey()).then(done.fail).catch(done)
      })
  })

  // it('Join: should fail because of the wrong URL', (done) => {
  //   console.log("\n\nI'm 6")
  //   webRTCService.open(randKey(), () => {}).then((data) => {
  //     webRTCService.join(randKey(), {
  //       signaling: 'https://github.com:8100/coast-team/netflux'
  //     }).then(done.fail).catch(done)
  //   })
  // })

  // it('Open & Join: should detect disconnected peer', (done) => {
  //   console.log("\n\nI'm 7")
  //   webRTCService.open(randKey(), (channel) => {
  //     channel.onclose = (closeEvt) => done()
  //     channel.onerror = done.fail
  //   })
  //     .then((data) => {
  //       webRTCService.join(data.key)
  //         .then((channel) => {
  //           channel.onerror = done.fail
  //           setTimeout(() => { channel.close() }, 500)
  //         })
  //         .catch(done.fail)
  //     })
  //     .catch(done.fail)
  // })

  // it('Open & Join: should open 1 dataChannel and exchange messages between 2 peers', (done) => {
  //   console.log("\n\nI'm 8")
  //   const masterPeerMsg = 'Hello! Here is master'
  //   const peerMsg = 'Hi, I am a peer'
  //   webRTCService.open(randKey(), (channel) => {
  //     channel.onmessage = (event) => {
  //       expect(event.data).toEqual(peerMsg)
  //       channel.close()
  //     }
  //     channel.onerror = done.fail
  //     channel.send(masterPeerMsg)
  //   })
  //     .then((data) => {
  //       webRTCService.join(data.key)
  //         .then((channel) => {
  //           channel.onmessage = (event) => {
  //             expect(event.data).toEqual(masterPeerMsg)
  //             channel.send(peerMsg)
  //           }
  //           channel.onclose = done
  //           channel.onerror = done.fail
  //         })
  //         .catch(done.fail)
  //     })
  //     .catch(done.fail)
  // })

  // it('Open & Join: should open 2 dataChannels and exchange messages between 3 peers', (done) => {
  //   console.log("\n\nI'm 9")
  //   const masterPeerMsg = 'Do or do not, there is no try'
  //   const peerMsg1 = 'Hi, I am a peer #1'
  //   const peerMsg2 = 'Hi, I am a peer #2'
  //   let limit = 0

  //   // PEER MASTER
  //   webRTCService.open(randKey(), (channel) => {
  //     channel.onmessage = (event) => {
  //       expect(event.data).toMatch(/Hi, I am a peer #/)
  //       channel.close()
  //       if (++limit === 2) { done() }
  //     }
  //     channel.onerror = done.fail
  //     channel.send(masterPeerMsg)
  //   })
  //     .then((data) => {
  //       // PEER #1
  //       webRTCService.join(data.key)
  //         .then((channel) => {
  //           channel.onmessage = (event) => {
  //             expect(event.data).toEqual(masterPeerMsg)
  //             channel.send(peerMsg1)
  //           }
  //           channel.onerror = done.fail
  //         })
  //         .catch(done.fail)

  //       // PEER #2
  //       webRTCService.join(data.key)
  //         .then((channel) => {
  //           channel.onmessage = (event) => {
  //             expect(event.data).toEqual(masterPeerMsg)
  //             channel.send(peerMsg2)
  //           }
  //           channel.onerror = done.fail
  //         })
  //         .catch(done.fail)
  //     })
  //     .catch(done.fail)
  // })
})
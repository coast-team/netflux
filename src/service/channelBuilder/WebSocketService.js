import {ChannelBuilderInterface} from './channelBuilder'

const CONNECT_TIMEOUT = 2000
const NEW_CHANNEL = 'newChannel'

class WebSocketService extends ChannelBuilderInterface {

  constructor (options = {}) {
    super()
    this.defaults = {
      signaling: 'ws://localhost:8000',
      iceServers: [
        {urls: 'stun:23.21.150.121'},
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'turn:numb.viagenie.ca', credential: 'webrtcdemo', username: 'louis%40mozilla.com'}
      ]
    }
    this.settings = Object.assign({}, this.defaults, options)
    this.toConnect = false
  }

  /**
   * Enables other clients to establish a connection with you.
   *
   * @abstract
   * @param {string} key - The unique identifier which has to be passed to the
   * peers who need to connect to you.
   * @param {module:channelBuilder~Interface~onChannelCallback} onChannel - Callback
   * function to execute once the connection has been established.
   * @param {Object} [options] - Any other options which depend on the service implementation.
   * @return {Promise} - Once resolved, provide an Object with `key` and `url`
   * attributes to be passed to {@link module:channelBuilder~Interface#join} function.
   * It is rejected if an error occured.
   */
  open (key, onChannel, options) {
    throw new Error('[TODO] {WebSocketService} open (key, onChannel, options)')
  }

  /**
   * Connects you with the peer who provided the `key`.
   *
   * @abstract
   * @param  {string} key - A key obtained from the peer who executed
   * {@link module:channelBuilder~Interface#open} function.
   * @param  {Object} [options] Any other options which depend on the implementation.
   * @return {Promise} It is resolved when the connection is established, otherwise it is rejected.
   */
  join (key, options) {
    throw new Error('[TODO] {WebSocketService} join (key, options)')
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
    // console.log('[DEBUG] connectMeTo (wc, id) (wc, ', id, ')')
    return new Promise((resolve, reject) => {
      let host = this.settings.host
      let port = this.settings.port
      let socket
      try {
        socket = new window.WebSocket('ws://' + host + ':' + port)
      } catch (err) {
        reject(err.message)
      }
      socket.onopen = () => {
        socket.send(JSON.stringify({code: NEW_CHANNEL, sender: wc.myId, wcId: wc.id,
          which_connector_asked: this.settings.which_connector_asked}))
        resolve(socket)
      }
      socket.onclose = () => {
        reject('Connection with the WebSocket server closed')
      }
      setTimeout(reject, CONNECT_TIMEOUT, 'Timeout')
    })
  }

  onMessage (wc, channel, msg) {
    throw new Error('[TODO] {WebSocketService} connectMeTo (wc, id) [Resolves promises]')
  }
}

export default WebSocketService

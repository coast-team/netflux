import * as Rx from 'node_modules/rxjs/Rx'

import ServiceFactory, {WEB_RTC, WEB_SOCKET, EVENT_SOURCE} from 'ServiceFactory'
import Util from 'Util'
const WebSocket = Util.require(Util.WEB_SOCKET)

/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
class SignalingGate {
  /**
   * @param {WebChannel} wc
   * @param {function(ch: RTCDataChannel)} onChannel
   */
  constructor (wc, onChannel) {
    /**
     * @type {WebChannel}
     */
    this.webChannel = wc
    /**
     * Signaling server url.
     * @private
     * @type {string}
     */
    this.url = null
    /**
     * Key related to the `url`.
     * @private
     * @type {string}
     */
    this.key = null
    /**
     * Connection with the signaling server.
     * @private
     * @type {external:WebSocket|external:ws/WebSocket|external:EventSource}
     */
    this.con = null

    this.onChannel = onChannel
  }

  /**
   * Open the gate.
   *
   * @param {string} url Signaling server url
   * @param {string} [key = this.generateKey()]
   * @returns {Promise<OpenData, string>}
   */
  open (url, key = this.generateKey(), signalingSubject) {
    return new Promise((resolve, reject) => {
      console.log('Open METHOD key is ' + key)
      const signaling = signalingSubject || this.createSubject(url)
      let subs = signaling.filter(msg => 'first' in msg)
        .subscribe(
          msg => {
            console.log('Open subs msg: ', msg)
            this.con = signaling
            this.key = key
            this.url = url.endsWith('/') ? url.substr(0, url.length - 1) : url
            resolve({url: this.url, key})
          },
          err => reject(err),
          () => {
            this.key = null
            this.con = null
            this.url = null
            this.webChannel.onClose()
          }
        )
      ServiceFactory.get(WEB_RTC, this.webChannel.settings.iceServers)
        .listenFromSignaling(signaling, con => this.onChannel(con))
      console.log('Is closed: ' + subs.closed)
      signaling.next(JSON.stringify({open: key}))
    })
  }

  join (url, key, shouldOpen = true) {
    console.log('JOIN METHOD')
    return new Promise((resolve, reject) => {
      const signaling = this.createSubject(url)
      const subs = signaling.filter(msg => 'first' in msg)
        .subscribe(
          msg => {
            console.log('Join msg -----------------------------------', msg)
            if (msg.first) {
              console.log('Join unsubscribe with key = ' + key)
              // subs.unsubscribe()
              this.open(url, key)
                .then(() => resolve({first: true}))
                .catch(reject)
            } else {
              if ('useThis' in msg) {
                if (msg.useThis) {
                  resolve({first: false, con: signaling})
                } else {
                  reject(new Error(`Open a gate with bot server is not possible`))
                }
              } else {
                ServiceFactory.get(WEB_RTC, this.webChannel.settings.iceServers)
                  .connectOverSignaling(signaling, key)
                  .then(dc => {
                    subs.unsubscribe()
                    resolve({first: false, con: dc, sigCon: signaling})
                  })
                  .catch(reject)
              }
            }
          },
          err => reject(err),
          () => reject(new Error(`WebSocket closed with ${url}`))
        )
      signaling.next(JSON.stringify({join: key}))
    })
  }

  /**
   * Check if the door is opened or closed.
   *
   * @returns {boolean} - Returns true if the door is opened and false if it is
   * closed
   */
  isOpen () {
    return this.con !== null
  }

  /**
   * Get open data.
   *
   * @returns {OpenData|null} Open data if the door is open and null otherwise
   */
  getOpenData () {
    if (this.isOpen()) {
      return {
        url: this.url,
        key: this.key
      }
    }
    return null
  }

  /**
   * Close the door if it is open and do nothing if it is closed already.
   */
  close () {
    if (this.isOpen()) {
      this.con.socket.close(1000)
      this.key = null
      this.con = null
      this.url = null
      this.webChannel.onClose()
    }
  }

  /**
   * Get the connection service for signaling server.
   *
   * @private
   * @param {string} url Signaling server url
   *
   * @returns {Service}
   */
  getConnectionService (url) {
    if (Util.isURL(url)) {
      if (url.search(/^wss?/) !== -1) {
        return ServiceFactory.get(WEB_SOCKET)
      } else {
        return ServiceFactory.get(EVENT_SOURCE)
      }
    } else {
      throw new Error(`${url} is not a valid URL`)
    }
  }

  createSubject (url) {
    if (Util.isURL(url) && url.search(/^wss?/) !== -1) {
      return Rx.Observable.webSocket({
        url,
        WebSocketCtor: WebSocket
      })
    } else {
      throw new Error(`${url} is not a valid URL`)
    }
  }

  /**
   * Generate random key which will be used to join the `WebChannel`.
   *
   * @private
   * @returns {string} - Generated key
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
}

export default SignalingGate

import ServiceFactory, {WEB_RTC, WEB_SOCKET, EVENT_SOURCE} from 'ServiceFactory'
import Util from 'Util'

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
    this.stream = null

    this.onChannel = onChannel
  }

  /**
   * Open the gate.
   *
   * @param {string} url Signaling server url
   * @param {string} [key = this.generateKey()]
   * @returns {Promise<OpenData, string>}
   */
  open (url, key = this.generateKey(), signaling) {
    if (signaling) {
      return this.listenOnOpen(url, key, signaling)
    } else {
      return this.getConnectionService(url)
        .subject(url)
        .then(signaling => this.listenOnOpen(url, key, signaling))
    }
  }

  listenOnOpen (url, key, signaling) {
    return new Promise((resolve, reject) => {
      signaling.filter(msg => 'first' in msg || 'ping' in msg)
        .subscribe(
          msg => {
            if (msg.first) {
              this.stream = signaling
              this.key = key
              this.url = url.endsWith('/') ? url.substr(0, url.length - 1) : url
              resolve({url: this.url, key})
            } else if (msg.ping) {
              signaling.send(JSON.stringify({pong: true}))
            }
          },
          err => {
            this.onClose()
            reject(err)
          },
          () => {
            this.onClose()
            reject(new Error(''))
          }
        )
      ServiceFactory.get(WEB_RTC, this.webChannel.settings.iceServers)
        .listenFromSignaling(signaling, channel => this.onChannel(channel))
      signaling.send(JSON.stringify({open: key}))
    })
  }

  join (key, url, shouldOpen) {
    return new Promise((resolve, reject) => {
      this.getConnectionService(url)
        .subject(url)
        .then(signaling => {
          const subs = signaling.filter(msg => 'first' in msg)
            .subscribe(
              msg => {
                if (msg.first) {
                  subs.unsubscribe()
                  if (shouldOpen) {
                    this.open(url, key, signaling)
                      .then(() => resolve())
                      .catch(err => reject(err))
                  } else {
                    signaling.close(1000)
                    resolve()
                  }
                } else {
                  if ('useThis' in msg) {
                    if (msg.useThis) {
                      subs.unsubscribe()
                      resolve(signaling.socket)
                    } else {
                      signaling.error(new Error(`Failed to join via ${url}: uncorrect bot server response`))
                    }
                  } else {
                    ServiceFactory.get(WEB_RTC, this.webChannel.settings.iceServers)
                      .connectOverSignaling(signaling, key)
                      .then(dc => {
                        subs.unsubscribe()
                        if (shouldOpen) {
                          this.open(url, key, signaling)
                            .then(() => resolve(dc))
                            .catch(err => reject(err))
                        } else {
                          signaling.close(1000)
                          resolve(dc)
                        }
                      })
                      .catch(err => {
                        signaling.close(1000)
                        signaling.error(err)
                      })
                  }
                }
              },
              err => reject(err)
            )
          signaling.send(JSON.stringify({join: key}))
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Check if the door is opened or closed.
   *
   * @returns {boolean} - Returns true if the door is opened and false if it is
   * closed
   */
  isOpen () {
    return this.stream !== null
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
      this.stream.close(1000)
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
    }
    throw new Error(`${url} is not a valid URL`)
  }

  onClose () {
    if (this.isOpen()) {
      this.key = null
      this.stream = null
      this.url = null
      this.webChannel.onClose()
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

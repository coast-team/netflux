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
  open (url, key = this.generateKey()) {
    return new Promise((resolve, reject) => {
      this.getConnectionService(url)
        .connect(url)
        .then(sigCon => {
          sigCon.onclose = closeEvt => reject(new Error(closeEvt.reason))
          sigCon.onerror = err => reject(err)
          sigCon.onmessage = evt => {
            try {
              const msg = JSON.parse(evt.data)
              if ('opened' in msg) {
                if (msg.opened) {
                  resolve(this.listenOnOpen(sigCon, key))
                } else reject(new Error(`Could not open with ${key}`))
              } else reject(new Error(`Unknown message from ${url}: ${evt.data}`))
            } catch (err) { reject(err) }
          }
          sigCon.send(JSON.stringify({open: key}))
        })
        .catch(err => { reject(err) })
    })
  }

  /**
   * Open the gate when the connection with the signaling server exists already.
   *
   * @param {WebSocket|RichEventSource} sigCon Connection with the signaling
   * @param {string} key
   * @returns {Promise<OpenData, string>}
   */
  openExisted (sigCon, key) {
    return new Promise((resolve, reject) => {
      sigCon.onclose = closeEvt => reject(new Error(closeEvt.reason))
      sigCon.onerror = err => reject(err)
      sigCon.onmessage = evt => {
        try {
          const msg = JSON.parse(evt.data)
          if ('opened' in msg) {
            if (msg.opened) {
              resolve(this.listenOnOpen(sigCon, key))
            } else reject(new Error(`Could not open with ${key}`))
          } else reject(new Error(`Unknown message from ${sigCon.url}: ${evt.data}`))
        } catch (err) { reject(err) }
      }
      sigCon.send(JSON.stringify({open: key}))
    })
  }

  join (url, key) {
    return new Promise((resolve, reject) => {
      this.getConnectionService(url)
        .connect(url)
        .then(sigCon => {
          sigCon.onclose = closeEvt => reject(closeEvt.reason)
          sigCon.onerror = err => reject(err.message)
          sigCon.onmessage = evt => {
            try {
              const msg = JSON.parse(evt.data)
              if ('opened' in msg) {
                if (!msg.opened) {
                  if ('useThis' in msg) {
                    if (msg.useThis) {
                      resolve({opened: false, con: sigCon})
                    } else {
                      reject(new Error(`Open a gate with bot server is not possible`))
                    }
                  } else {
                    ServiceFactory.get(WEB_RTC, this.webChannel.settings.iceServers)
                      .connectOverSignaling(sigCon, key)
                      .then(dc => resolve({opened: false, con: dc, sigCon}))
                      .catch(reject)
                  }
                } else {
                  this.listenOnOpen(sigCon, key)
                  resolve({opened: true, sigCon})
                }
              } else reject(new Error(`Unknown message from ${url}: ${evt.data}`))
            } catch (err) { reject(err) }
          }
          sigCon.send(JSON.stringify({join: key}))
        })
        .catch(reject)
    })
  }

  /**
   * Check if the door is opened or closed.
   *
   * @returns {boolean} - Returns true if the door is opened and false if it is
   * closed
   */
  isOpen () {
    return this.con !== null && this.con.readyState === this.con.OPEN
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
      this.con.close()
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

  listenOnOpen (sigCon, key) {
    ServiceFactory.get(WEB_RTC, this.webChannel.settings.iceServers)
      .listenFromSignaling(sigCon, con => this.onChannel(con))
    this.con = sigCon
    this.con.onclose = closeEvt => {
      this.key = null
      this.con = null
      this.url = null
      this.webChannel.onClose(closeEvt)
    }
    this.key = key
    if (sigCon.url.endsWith('/')) {
      this.url = sigCon.url.substr(0, sigCon.url.length - 1)
    } else {
      this.url = sigCon.url
    }
    return {url: this.url, key}
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

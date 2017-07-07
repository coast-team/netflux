/**
 * This class represents a door of the `WebChannel` for the current peer. If the door
 * is open, then clients can join the `WebChannel` through this peer. There are as
 * many doors as peers in the `WebChannel` and each of them can be closed or opened.
 */
export class SignalingGate {
  /**
   * @param {WebChannel} wc
   * @param {function(ch: RTCDataChannel)} onChannel
   */
  constructor (wc, onChannel) {
    /**
     * @type {WebChannel}
     */
    this.wc = wc
    /**
     * Signaling server url.
     * @private
     * @type {string}
     */
    this.url = undefined
    /**
     * Key related to the `url`.
     * @private
     * @type {string}
     */
    this.key = undefined
    /**
     * Connection with the signaling server.
     * @private
     * @type {external:WebSocket|external:ws/WebSocket|external:EventSource}
     */
    this.stream = undefined

    this.onChannel = onChannel
  }

  /**
   * Open the gate.
   *
   * @param {string} url Signaling server url
   * @param {string} [key = this.generateKey()]
   * @param {Object} signaling
   * @returns {Promise<OpenData, string>}
   */
  open (url, key = this.generateKey(), signaling) {
    if (signaling) {
      return this.listenOnOpen(url, key, signaling)
    } else {
      return this.wc.webSocketSvc.connectToSignaling(url)
        .then(signaling => {
          signaling.filter(msg => 'ping' in msg)
            .subscribe(() => signaling.send(JSON.stringify({pong: true})))
          return this.listenOnOpen(url, key, signaling)
        })
    }
  }

  listenOnOpen (url, key, signaling) {
    return new Promise((resolve, reject) => {
      signaling.filter(msg => 'first' in msg)
        .subscribe(
          msg => {
            if (msg.first) {
              this.stream = signaling
              this.key = key
              this.url = url.endsWith('/') ? url.substr(0, url.length - 1) : url
              resolve({url: this.url, key})
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
      this.wc.webRTCSvc.channelsFromSignaling(signaling)
        .subscribe(ch => this.onChannel(ch))
      signaling.send(JSON.stringify({open: key}))
    })
  }

  join (key, url, shouldOpen) {
    return new Promise((resolve, reject) => {
      this.wc.webSocketSvc.connectToSignaling(url)
        .then(signaling => {
          signaling.filter(msg => 'ping' in msg)
            .subscribe(() => signaling.send(JSON.stringify({pong: true})))
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
                  this.wc.webRTCSvc.connectOverSignaling(signaling)
                    .then(ch => {
                      subs.unsubscribe()
                      if (shouldOpen) {
                        this.open(url, key, signaling)
                          .then(() => resolve(ch))
                          .catch(err => reject(err))
                      } else {
                        signaling.close(1000)
                        resolve(ch)
                      }
                    })
                    .catch(err => {
                      signaling.close(1000)
                      signaling.error(err)
                    })
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
    return this.stream !== undefined
  }

  /**
   * Get open data.
   *
   * @returns {OpenData|undefined} Open data if the door is open and null otherwise
   */
  getOpenData () {
    if (this.isOpen()) {
      return {
        url: this.url,
        key: this.key
      }
    }
    return undefined
  }

  /**
   * Close the door if it is open and do nothing if it is closed already.
   */
  close () {
    if (this.isOpen()) {
      this.stream.close(1000)
    }
  }

  onClose () {
    if (this.isOpen()) {
      this.key = undefined
      this.stream = undefined
      this.url = undefined
      this.wc.onClose()
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

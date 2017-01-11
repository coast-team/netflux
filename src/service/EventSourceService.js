import Util from 'Util'
import Service from 'service/Service'
const EventSource = Util.requireLib(Util.EVENT_SOURCE_LIB)

const CONNECT_TIMEOUT = 2000
const CLOSE_AFTER_RECONNECT_TIMEOUT = 6000

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
class EventSourceService extends Service {

  /**
   * Creates EventSource object.
   *
   * @param {string} url - Server url
   * @returns {Promise<EventSource, string>} It is resolved once the WebSocket has been created and rejected otherwise
   */
  connect (url) {
    return new Promise((resolve, reject) => {
      try {
        let reconnectTimeout = null
        const res = new RichEventSource(url)
        res.onerror = err => {
          reconnectTimeout = setTimeout(() => {
            res.close()
          }, CLOSE_AFTER_RECONNECT_TIMEOUT)
          reject(err.message)
        }
        res.onopen = () => {
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
          }
        }
        res.addEventListener('auth', evtMsg => {
          this.auth = evtMsg.data
          resolve(res)
        })
        // Timeout if "auth" event has not been received.
        setTimeout(() => {
          reject(`Authentication event has not been received from ${url} within ${CONNECT_TIMEOUT}ms`)
        }, CONNECT_TIMEOUT)
      } catch (err) {
        reject(err.message)
      }
    })
  }
}

class RichEventSource extends EventSource.constructor {

  constructor (url) {
    super(url)
    this.auth = ''
    this.onclose = () => {}
  }

  close () {
    this.onclose()
    super.close()
  }

  send (str) {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', super.url, true)

    xhr.onload = function () {
      if (this.status !== 200) {
        this.onerror(new Error(this.statusText))
      }
    }

    xhr.onerror = err => this.onerror(new Error(err.message))
    xhr.send(`${this.auth}@${str}`)
  }
}

export default EventSourceService

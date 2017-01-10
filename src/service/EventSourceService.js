import Util from 'Util'
import Service from 'service/Service'
const EventSource = Util.requireLib(Util.EVENT_SOURCE_LIB)

const CONNECT_TIMEOUT = 2000

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
        const es = new EventSource(url)
        es.onerror = err => reject(err.message)
        es.addEventListener('auth', evtMsg => {
          es.send = function (str) {
            const xhr = new XMLHttpRequest()
            xhr.open('POST', url, true)

            xhr.onload = function () {
              if (this.status !== 200) {
                es.onerror(new Error(this.statusText))
              }
            }

            xhr.onerror = err => es.onerror(new Error(err.message))
            xhr.send(`${evtMsg.data}@${str}`)
          }
          resolve(es)
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

export default EventSourceService

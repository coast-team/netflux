import { Util } from 'Util'
import { Service } from 'service/Service'

const EventSource = Util.require(Util.EVENT_SOURCE)
const fetch = Util.require(Util.FETCH)
const CloseEvent = Util.require(Util.CLOSE_EVENT)

const CONNECT_TIMEOUT = 5000

/**
 * Service class responsible to establish connections between peers via
 * `WebSocket`.
 */
export class EventSourceBuilder extends Service {
  /**
   * Creates RichEventSource object.
   *
   * @param {string} url - Server url
   * @returns {Promise<EventSource, string>} It is resolved once the WebSocket has been created and rejected otherwise
   */
  connect (url) {
    return new Promise((resolve, reject) => {
      try {
        const res = new RichEventSource(url)
        res.onopen = () => resolve(res)
        res.onerror = err => reject(err.message)
        // Timeout if "auth" event has not been received.
        setTimeout(() => {
          reject(new Error(`Authentication event has not been received from ${url} within ${CONNECT_TIMEOUT}ms`))
        }, CONNECT_TIMEOUT)
      } catch (err) {
        reject(err.message)
      }
    })
  }
}

class RichEventSource {
  constructor (url) {
    this.auth = ''
    this._onopen = () => {}
    this._onerror = () => {}
    this._onclose = () => {}
    this.es = new EventSource(url)
    this.es.addEventListener('auth', evtMsg => {
      this.auth = evtMsg.data
      this._onopen()
    })
    this.es.addEventListener('close', evtMsg => {
      const data = JSON.parse(evtMsg.data)
      this.es.close()
      this._onclose(new CloseEvent('close', {
        wasClean: true,
        code: data.code,
        reason: data.reason
      }))
    })
    this.es.onerror = this._onerror
  }

  get CONNECTING () { return this.es.OPEN !== undefined ? this.es.OPEN : 0 }
  get OPEN () { return this.es.OPEN !== undefined ? this.es.OPEN : 1 }
  get CLOSED () { return this.es.OPEN !== undefined ? this.es.OPEN : 2 }
  get url () { return this.es.url }
  get readyState () { return this.es.readyState }

  get onopen () { return this._onopen }
  set onopen (cb) { this._onopen = cb }

  get onmessage () { return this.es.onmessage }
  set onmessage (cb) { this.es.onmessage = cb }

  get onclose () { return this._onclose }
  set onclose (cb) { this._onclose = cb }

  get onerror () { return this._onerror }
  set onerror (cb) { this._onerror = cb }

  close () {
    this.es.close()
    this._onclose(new CloseEvent('close', {wasClean: true, code: 1000}))
  }

  send (str = '') {
    fetch(this.url, { method: 'POST', body: `${this.auth}@${str}` })
      .then(response => {
        if (response.status !== 200) {
          this._onerror(new Error(response.status + ': ' + response.statusText))
        }
      })
      .catch(err => this._onerror(err))
  }
}

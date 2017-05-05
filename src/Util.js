const NodeCloseEvent = class CloseEvent {
  constructor (name, options = {}) {
    this.name = name
    this.wasClean = options.wasClean || false
    this.code = options.code || 0
    this.reason = options.reason || ''
  }
}

/**
 * Utility class contains some helper static methods.
 */
export class Util {
  /**
   * Check execution environment.
   *
   * @returns {boolean} Description
   */
  static isBrowser () {
    if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.title === 'node')) {
      return false
    }
    return true
  }

  /**
   * Check whether the channel is a socket.
   *
   * @param {WebSocket|RTCDataChannel} channel
   *
   * @returns {boolean}
   */
  static isSocket (channel) {
    return channel.constructor.name === 'WebSocket'
  }

  /**
   * Check whether the string is a valid URL.
   *
   * @param {string} str
   *
   * @returns {type} Description
   */
  static isURL (str) {
    const regex =
      '^' +
        // protocol identifier
        '(?:wss|ws)://' +
        // Host name/IP
        '[^\\s]+' +
        // port number
        '(?::\\d{2,5})?' +
      '$'

    return (new RegExp(regex, 'i')).test(str)
  }

  static get WEB_RTC () { return 1 }
  static get WEB_SOCKET () { return 2 }
  static get TEXT_ENCODING () { return 3 }
  static get EVENT_SOURCE () { return 4 }
  static get FETCH () { return 5 }
  static get CLOSE_EVENT () { return 6 }

  static require (libConst) {
    try {
      switch (libConst) {
        case Util.WEB_RTC: return WEB_RTC_MODULE
        case Util.WEB_SOCKET: return WEB_SOCKET_MODULE
        case Util.TEXT_ENCODING: return TEXT_ENCODING_MODULE
        case Util.EVENT_SOURCE: return EVENT_SOURCE_MODULE
        case Util.FETCH: return FETCH_MODULE
        case Util.CLOSE_EVENT: return Util.isBrowser() ? window.CloseEvent : NodeCloseEvent
        default:
          console.error(`${libConst} is unknown library`)
          return undefined
      }
    } catch (err) {
      console.error(err.message)
      return undefined
    }
  }
}

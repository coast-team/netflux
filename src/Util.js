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
class Util {

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
    let regex =
      '^' +
      // protocol identifier
      '(?:(?:wss|ws|http|https)://)' +
      // user:pass authentication
      '(?:\\S+(?::\\S*)?@)?' +
      '(?:'

    const tld = '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))?'

    regex +=
        // IP address dotted notation octets
        // excludes loopback network 0.0.0.0
        // excludes reserved space >= 224.0.0.0
        // excludes network & broacast addresses
        // (first & last IP address of each class)
        '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
        '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
        '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
      '|' +
        // host name
        '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
        // domain name
        '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
        tld +
      ')' +
      // port number
      '(?::\\d{2,5})?' +
      // resource path
      '(?:[/?#]\\S*)?' +
    '$'

    if (!(new RegExp(regex, 'i')).exec(str)) return false
    return true
  }

  static require (module) {
    try {
      return require(module)
    } catch (err) {
      console.error(`${module} could not be found: ${err}`)
      return undefined
    }
  }

  static get WEB_RTC_LIB () { return 1 }
  static get WEB_SOCKET_LIB () { return 2 }
  static get TEXT_ENCODING_LIB () { return 3 }
  static get EVENT_SOURCE_LIB () { return 4 }
  static get FETCH () { return 5 }
  static get CLOSE_EVENT () { return 6 }

  static requireLib (libConst) {
    switch (libConst) {
      case Util.WEB_RTC_LIB:
        return Util.isBrowser() ? window : Util.require('wrtc')
      case Util.WEB_SOCKET_LIB:
        return Util.isBrowser() ? window.WebSocket : Util.require('ws')
      case Util.TEXT_ENCODING_LIB:
        return Util.isBrowser() ? window : Util.require('text-encoding')
      case Util.EVENT_SOURCE_LIB:
        return Util.isBrowser() ? window.EventSource : Util.require('eventsource')
      case Util.FETCH:
        return Util.isBrowser() ? window.fetch : Util.require('node-fetch')
      case Util.CLOSE_EVENT:
        return Util.isBrowser() ? window.CloseEvent : NodeCloseEvent
      default:
        console.error(`${libConst} is unknown lib constant. See Util`)
        return undefined
    }
  }
}

export default Util

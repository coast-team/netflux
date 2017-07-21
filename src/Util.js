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
}

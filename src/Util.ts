/**
 * Utility class contains some helper static methods.
 */
export class Util {
  /**
   * Check execution environment.
   */
  static isBrowser (): boolean {
    if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.title === 'node')) {
      return false
    }
    return true
  }

  /**
   * Check whether the channel is a socket.
   */
  static isSocket (channel: WebSocket | RTCDataChannel): boolean {
    return channel.constructor.name === 'WebSocket'
  }

  /**
   * Check whether the string is a valid URL.
   */
  static isURL (str: string): boolean {
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

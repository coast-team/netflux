import { Channel } from './Channel'

/**
 * Equals to true in any browser.
 */
export const isBrowser = (typeof window === 'undefined') ? false : true

/**
 * Check whether the string is a valid URL.
 */
export function isURL (str: string): boolean {
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

/**
 * Equals to true in Firefox and false elsewhere.
 * Thanks to https://github.com/lancedikson/bowser
 */
export const isFirefox = (
    isBrowser &&
    navigator !== undefined &&
    navigator.userAgent !== undefined &&
    /firefox|iceweasel|fxios/i.test(navigator.userAgent)
  ) ? true : false

/**
 * Generate random key which will be used to join the network.
 */
export function generateKey (): string {
  const mask = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const length = 20 // Should be less then MAX_KEY_LENGTH value
  const values = new Uint32Array(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += mask[values[i] % mask.length]
  }
  return result
}

export const MAX_KEY_LENGTH = 512

export interface MessageI {
  senderId: number,
  recipientId: number,
  isService: boolean,
  content: Uint8Array
}

export interface ServiceMessageEncoded {
  channel: Channel,
  senderId: number,
  recipientId: number,
  id: number,
  timestamp: number,
  content: Uint8Array
}

export interface ServiceMessageDecoded {
  channel: Channel,
  senderId: number,
  recipientId: number,
  timestamp: number,
  msg: any
}

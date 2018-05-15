import { Observable } from 'rxjs'

/**
 * Equals to true in any browser.
 */
export const isBrowser = typeof global.window === 'undefined' ? false : true

export function isOnline() {
  return isBrowser ? global.navigator.onLine : true
}
export function isVisible() {
  return isBrowser ? global.document.visibilityState === 'visible' : true
}

/**
 * Check whether the string is a valid URL.
 */
export function isURL(str: string): boolean {
  const regex =
    '^' +
    // protocol identifier
    '(?:wss|ws)://' +
    // Host name/IP
    '[^\\s]+' +
    // port number
    '(?::\\d{2,5})?' +
    '$'

  return new RegExp(regex, 'i').test(str)
}

/**
 * Generate random key which will be used to join the network.
 */
export function generateKey(): string {
  const mask = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const length = 42 // Should be less then MAX_KEY_LENGTH value
  const values = randNumbers(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += mask[values[i] % mask.length]
  }
  return result
}

export function generateId(exclude: number[] = []): number {
  const id = randNumbers()[0]
  if (exclude.includes(id)) {
    return generateId(exclude)
  }
  return id
}

const MAX_KEY_LENGTH = 512

export function validateKey(key: string): boolean {
  if (typeof key !== 'string') {
    throw new Error(`The key type "${typeof key}" is not a "string"`)
  } else if (key === '') {
    throw new Error('The key is an empty string')
  } else if (key.length > MAX_KEY_LENGTH) {
    throw new Error(
      `The key length of ${key.length} exceeds the maximum of ${MAX_KEY_LENGTH} characters`
    )
  }
  return true
}

export function extractHostnameAndPort(url: string) {
  return url.split('/')[2]
}

function randNumbers(length: number = 1): number[] | Uint32Array {
  let res
  if (isBrowser) {
    res = new Uint32Array(length)
    global.crypto.getRandomValues(res)
  } else {
    res = []
    const bytes = global.cryptoNode.randomBytes(4 * length)
    for (let i = 0; i < bytes.length; i += 4) {
      res[res.length] = bytes.readUInt32BE(i, true)
    }
  }
  return res
}

export function equal(array1: number[], array2: number[]) {
  return (
    array1 !== undefined &&
    array2 !== undefined &&
    array1.length === array2.length &&
    array1.every((v) => array2.includes(v))
  )
}

/**
 * Indicates whether WebSocket is supported by the environment.
 */
export function isWebSocketSupported() {
  return !!global.WebSocket
}

/**
 * Indicates whether WebRTC & RTCDataChannel is supported by the environment.
 */
export function isWebRTCSupported() {
  return !!global.RTCPeerConnection && 'createDataChannel' in global.RTCPeerConnection.prototype
}

export * from './util.log'

export interface IStream<OutMsg, InMsg> {
  readonly STREAM_ID: number
  messageFromStream: Observable<InMsg>
  sendOverStream: (msg: OutMsg, id?: number) => void
}

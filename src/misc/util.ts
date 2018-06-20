import { Observable } from 'rxjs'
import { env } from './env'

export const MIN_ID = 2147483648

/**
 * Equals to true in any browser.
 */
export const isBrowser = typeof window === 'undefined' ? false : true

export function isOnline() {
  return isBrowser ? navigator.onLine : true
}
export function isVisible() {
  return isBrowser ? document.visibilityState === 'visible' : true
}

/**
 * Check whether the string is a valid URL.
 */
export function validateWebSocketURL(url: string) {
  const regex = /^(wss|ws):\/\/((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])|(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]))(:[0-9]{1,5})?(\/.*)?$/
  if (!new RegExp(regex, 'i').test(url)) {
    throw new Error(`Invalid URL: ${url}`)
  }
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
  let id = randNumbers()[0]
  if (id < MIN_ID) {
    id += MIN_ID
  }
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
    env.crypto.getRandomValues(res)
  } else {
    res = []
    const bytes = env.cryptoNode.randomBytes(4 * length)
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
  return !!env.WebSocket
}

/**
 * Indicates whether WebRTC & RTCDataChannel is supported by the environment.
 */
export function isWebRTCSupported() {
  return !!env.RTCPeerConnection && 'createDataChannel' in env.RTCPeerConnection.prototype
}

export * from './util.log'

export interface IStream<OutMsg, InMsg> {
  readonly STREAM_ID: number
  messageFromStream: Observable<InMsg>
  sendOverStream: (msg: OutMsg, id?: number) => void
}

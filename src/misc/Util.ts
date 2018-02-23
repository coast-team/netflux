import { Channel } from '../Channel'

/**
 * Equals to true in any browser.
 */
export const isBrowser = (typeof global.window === 'undefined') ? false : true

export function isOnline () {
  return isBrowser ? global.window.navigator.onLine : true
}
export function isVisible () {
  return isBrowser ? global.window.document.visibilityState === 'visible' : true
}

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
 * Generate random key which will be used to join the network.
 */
export function generateKey (): string {
  const mask = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const length = 42 // Should be less then MAX_KEY_LENGTH value
  const values = randNumbers(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += mask[values[i] % mask.length]
  }
  return result
}

export function randNumbers (length: number = 1): number[] {
  let res
  if (isBrowser) {
    res = new Uint32Array(length)
    global.crypto.getRandomValues(res)
  } else {
    res = []
    const bytes = (crypto as any).randomBytes(4 * length)
    for (let i = 0; i < bytes.length; i += 4) {
      res[res.length] = bytes.readUInt32BE(i, true)
    }
  }
  return res
}

export function equal (array1: number[], array2: number[]) {
  return array1 !== undefined && array2 !== undefined
  && array1.length === array2.length
  && array1.every((v) => array2.includes(v))
}

export const MAX_KEY_LENGTH = 512
const netfluxCSS = 'background-color: #FFCA28; padding: 0 3px'
const debugCSS = 'background-color: #b3ba2e; padding: 0 3px'
const signalingStateCSS = 'background-color: #9FA8DA; padding: 0 2px'
const webGroupStateCSS = 'background-color: #EF9A9A; padding: 0 2px'

export interface ILog {
  info: (msg: string, ...rest: any[]) => void,
  signalingState: (msg: string, id: number) => void,
  webGroupState: (msg: string, id: number) => void,
  debug: (msg: string, ...rest: any[]) => void
}

const log: ILog = {
  info: () => {},
  signalingState: () => {},
  webGroupState: () => {},
  debug: () => {},
}

export enum LogLevel { DEBUG, INFO, OFF }

export let logLevel: LogLevel = LogLevel.OFF

export function setLogLevel (level: LogLevel) {
  logLevel = level
  if (level <= LogLevel.INFO) {
    log.info = (msg: string, ...rest: any[]): void => {
      if (rest.length === 0) {
        console.info(`%cNETFLUX INFO%c: ${msg}`, netfluxCSS, '')
      } else {
        console.info(`%cNETFLUX INFO%c: ${msg}`, netfluxCSS, '', ...rest)
      }
    }
    log.signalingState = (msg: string, id: number): void => {
      console.info(`%cNETFLUX ${id} INFO%c: Signaling: %c${msg}%c`, netfluxCSS, '', signalingStateCSS, '')
    }
    log.webGroupState = (msg: string, id: number): void => {
      console.info(`%cNETFLUX ${id} INFO%c: WebGroup: %c${msg}%c`, netfluxCSS, '', webGroupStateCSS, '')
    }
  }
  if (level <= LogLevel.DEBUG) {
    log.debug = (msg: string, ...rest: any[]) => {
      if (rest.length === 0) {
        console.info(`%cNETFLUX DEBUG%c: ${msg}`, debugCSS, '')
      } else {
        console.info(`%cNETFLUX DEBUG%c: ${msg}`, debugCSS, '', ...rest)
      }
    }
  }
}

export { log }

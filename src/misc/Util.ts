import { Channel } from '../service/Channel'

/**
 * Equals to true in any browser.
 */
export const isBrowser = (typeof global.window === 'undefined') ? false : true

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

export const MAX_KEY_LENGTH = 512
const netfluxCSS = 'background-color: #FFCA28; padding: 0 3px'
const debugCSS = 'background-color: #b3ba2e; padding: 0 3px'
const signalingStateCSS = 'background-color: #9FA8DA; padding: 0 2px'
const webGroupStateCSS = 'background-color: #EF9A9A; padding: 0 2px'
let log

export function enableLog (isDebug: boolean, level = 'info') {
  if (isDebug) {
    if (!['info', 'debug'].includes(level)) {
      throw new Error(`Unsupported value for log level: ${level}. Possible values are: "debug" or "info"`)
    }
    log = {
      info: (msg: string, ...rest: any[]): void => {
        if (rest.length === 0) {
          console.info(`%cNETFLUX%c: ${msg}`, netfluxCSS, '')
        } else {
          console.info(`%cNETFLUX%c: ${msg}`, netfluxCSS, '', ...rest)
        }
      },
      signalingState: (msg: string): void => {
        console.info(`%cNETFLUX%c: Signaling: %c${msg}%c`, netfluxCSS, '', signalingStateCSS, '')
      },
      webGroupState: (msg: string): void => {
        console.info(`%cNETFLUX%c: WebGroup: %c${msg}%c`, netfluxCSS, '', webGroupStateCSS, '')
      },
    }
    if (level === 'debug') {
      log.debug = (msg: string, ...rest: any[]) => {
        if (rest.length === 0) {
          console.info(`%cNETFLUX DEBUG%c: ${msg}`, debugCSS, '')
        } else {
          console.info(`%cNETFLUX DEBUG%c: "%o" ${msg}`, debugCSS, '', ...rest)
        }
      }
    } else {
      log.debug = () => {}
    }
  } else {
    log = {
      info: () => {},
      debug: () => {},
      signalingState: () => {},
      webGroupState: () => {},
    }
  }
}
enableLog(false)

export { log }

/**
 * Equals to true in any browser.
 */
export const isBrowser = typeof global.window === 'undefined' ? false : true

export function isOnline() {
  return isBrowser ? global.window.navigator.onLine : true
}
export function isVisible() {
  return isBrowser ? global.window.document.visibilityState === 'visible' : true
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

export function randNumbers(length: number = 1): number[] | Uint32Array {
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

export const MAX_KEY_LENGTH = 512
const netfluxCSS = 'background-color: #FFCA28; padding: 0 3px'
const debugCSS = 'background-color: #b3ba2e; padding: 0 3px'
const webrtcCSS = 'background-color: #CE93D8; padding: 0 3px'
const channelCSS = 'background-color: #90CAF9; padding: 0 3px'
const topologyCSS = 'background-color: #26A69A; padding: 0 3px'
const signalingCSS = 'background-color: #66BB6A; padding: 0 3px'
const channelBuilderCSS = 'background-color: #F57C00; padding: 0 3px'
const signalingStateCSS = 'background-color: #9FA8DA; padding: 0 2px'
const webGroupStateCSS = 'background-color: #EF9A9A; padding: 0 2px'

export interface ILog {
  webgroup: (msg: string, ...rest: any[]) => void
  signalingState: (msg: string, id: number) => void
  webGroupState: (msg: string, id: number) => void
  webrtc: (msg: string, ...rest: any[]) => void
  channel: (msg: string, ...rest: any[]) => void
  topology: (msg: string, ...rest: any[]) => void
  signaling: (msg: string, ...rest: any[]) => void
  channelBuilder: (msg: string, ...rest: any[]) => void
  debug: (msg: string, ...rest: any[]) => void
}

const log: ILog = {
  webgroup: () => {},
  signalingState: () => {},
  webGroupState: () => {},
  webrtc: () => {},
  channel: () => {},
  topology: () => {},
  signaling: () => {},
  channelBuilder: () => {},
  debug: () => {},
}

export enum LogLevel {
  DEBUG,
  WEB_GROUP,
  WEBRTC,
  CHANNEL,
  TOPOLOGY,
  SIGNALING,
  CHANNEL_BUILDER,
}

export let logLevels: LogLevel[] = []

export function setLogLevel(levels: LogLevel[]) {
  logLevels = levels
  if (logLevels.includes(LogLevel.WEB_GROUP)) {
    log.webgroup = (msg: string, ...rest: any[]): void => {
      if (rest.length === 0) {
        console.info(`%cNETFLUX WebGroup%c: ${msg}`, netfluxCSS, '')
      } else {
        console.info(`%cNETFLUX WebGroup%c: ${msg}`, netfluxCSS, '', ...rest)
      }
    }
    log.signalingState = (msg: string, id: number): void => {
      console.info(
        `%cNETFLUX ${id} WebGroup%c: Signaling: %c${msg}%c`,
        netfluxCSS,
        '',
        signalingStateCSS,
        ''
      )
    }
    log.webGroupState = (msg: string, id: number): void => {
      console.info(
        `%cNETFLUX ${id} WebGroup%c: WebGroup: %c${msg}%c`,
        netfluxCSS,
        '',
        webGroupStateCSS,
        ''
      )
    }
  } else {
    log.webgroup = () => {}
    log.signalingState = () => {}
    log.webGroupState = () => {}
  }

  // WebRTCBuilder logs
  if (logLevels.includes(LogLevel.WEBRTC)) {
    log.webrtc = (msg: string, ...rest: any[]) => {
      if (rest.length === 0) {
        console.info(`%cNETFLUX WebRTC%c: ${msg}`, webrtcCSS, '')
      } else {
        console.info(`%cNETFLUX WebRTC%c: ${msg}`, webrtcCSS, '', ...rest)
      }
    }
  } else {
    log.webrtc = () => {}
  }

  // Channel logs
  if (logLevels.includes(LogLevel.CHANNEL)) {
    log.channel = (msg: string, ...rest: any[]) => {
      if (rest.length === 0) {
        console.info(`%cNETFLUX Channel%c: ${msg}`, channelCSS, '')
      } else {
        console.info(`%cNETFLUX Channel%c: ${msg}`, channelCSS, '', ...rest)
      }
    }
  } else {
    log.channel = () => {}
  }

  // Topology logs
  if (logLevels.includes(LogLevel.TOPOLOGY)) {
    log.topology = (msg: string, ...rest: any[]) => {
      if (rest.length === 0) {
        console.info(`%cNETFLUX Topology%c: ${msg}`, topologyCSS, '')
      } else {
        console.info(`%cNETFLUX Topology%c: ${msg}`, topologyCSS, '', ...rest)
      }
    }
  } else {
    log.topology = () => {}
  }

  // Signaling logs
  if (logLevels.includes(LogLevel.SIGNALING)) {
    log.signaling = (msg: string, ...rest: any[]) => {
      if (rest.length === 0) {
        console.info(`%cNETFLUX Signaling%c: ${msg}`, signalingCSS, '')
      } else {
        console.info(`%cNETFLUX Signaling%c: ${msg}`, signalingCSS, '', ...rest)
      }
    }
  } else {
    log.signaling = () => {}
  }

  // ChannelBuilder logs
  if (logLevels.includes(LogLevel.CHANNEL_BUILDER)) {
    log.channelBuilder = (msg: string, ...rest: any[]) => {
      if (rest.length === 0) {
        console.info(`%cNETFLUX ChannelBuilder%c: ${msg}`, channelBuilderCSS, '')
      } else {
        console.info(`%cNETFLUX ChannelBuilder%c: ${msg}`, channelBuilderCSS, '', ...rest)
      }
    }
  } else {
    log.channelBuilder = () => {}
  }

  // Logs for current DEBUG
  if (logLevels.includes(LogLevel.DEBUG)) {
    log.debug = (msg: string, ...rest: any[]) => {
      if (rest.length === 0) {
        console.info(`%cNETFLUX Debug%c: ${msg}`, debugCSS, '')
      } else {
        console.info(`%cNETFLUX Debug%c: ${msg}`, debugCSS, '', ...rest)
      }
    }
  } else {
    log.debug = () => {}
  }
}

export { log }

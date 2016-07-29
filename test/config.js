export const signaling = 'ws://localhost:8000'
// const signaling = 'wss://sigver-coastteam.rhcloud.com:8443'
// const signaling = 'ws://sigver-coastteam.rhcloud.com:8000'
export const MSG_NUMBER = 10

export function randString () {
  const MIN_LENGTH = 1
  const MAX_LENGTH = 3700 // To limit message  size to less than 16kb (4 bytes per character)
  const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  const length = MIN_LENGTH + Math.ceil(Math.random() * (MAX_LENGTH - MIN_LENGTH))

  for (let i = 0; i < length; i++) {
    result += MASK[Math.round(Math.random() * (MASK.length - 1))]
  }
  return result
}

export function randArrayBuffer (minLength = 8, maxLength = 16000) {
  const length = minLength + 8 * Math.ceil(Math.random() * ((maxLength - minLength) / 8))
  let buffer = new ArrayBuffer(length)
  let bufferUint8 = new Uint8Array(buffer)

  for (let i = 0; i < length; i++) {
    bufferUint8[i] = Math.round(Math.random() * 255)
  }
  return buffer
}

export function randKey () {
  const MIN_LENGTH = 5
  const DELTA_LENGTH = 0
  const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH)

  for (let i = 0; i < length; i++) {
    result += MASK[Math.round(Math.random() * (MASK.length - 1))]
  }
  return result
}

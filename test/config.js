// Main signaling server for all tests
export const signaling = 'ws://localhost:8000'
// const signaling = 'wss://sigver-coastteam.rhcloud.com:8443'
// const signaling = 'ws://sigver-coastteam.rhcloud.com:8000'
// Used to test send/receive a lot of messages
export const MSG_NUMBER = 100

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

export function isEqual (ta1, ta2) {
  let t1 = (ta1 instanceof ArrayBuffer) ? new Uint8Array(ta1) : ta1
  let t2 = (ta2 instanceof ArrayBuffer) ? new Uint8Array(ta2) : ta2
  t1 = (ta1 instanceof DataView) ? new Uint8Array(ta1.buffer) : ta1
  t2 = (ta2 instanceof DataView) ? new Uint8Array(ta1.buffer) : ta2

  // this is necessary for NodeJS, as there is a bug in NodeJS when treating string as an array
  if (typeof ta1 === 'string' && typeof ta2 === 'string') {
    return ta1 === ta2
  } else {
    if (t1.size !== t2.size) return false
    for (let i in t1) if (t1[i] !== t2[i]) return false
    return true
  }
}

export function allMessagesAreSentAndReceived (groups, instance, isBroadcast = true) {
  return Promise.all(groups.map(
    group => new Promise((resolve, reject) => {
      let tab = new Map()
      for (let g of groups) if (g.wc.myId !== group.wc.myId) tab.set(g.wc.myId, g.msg)
      group.wc.onMessage = (id, msg, isBroadcast) => {
        expect(isBroadcast).toEqual(isBroadcast)
        if (typeof msg === 'string') expect(instance).toEqual(String)
        else expect(msg instanceof instance).toBeTruthy()
        expect(tab.has(id)).toBeTruthy()
        expect(isEqual(msg, tab.get(id))).toBeTruthy()
        tab.delete(id)
        if (tab.size === 0) resolve()
      }
    })
  ))
}

export class TestGroup {
  constructor (wc, msg) {
    this.wc = wc
    this.msg = msg
  }
}

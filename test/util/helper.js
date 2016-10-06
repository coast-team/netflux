import Util from 'src/Util'

// Main signaling server for all tests
const SIGNALING_URL = 'ws://localhost:8000'
const BOT = 'ws://localhost:9000'
const CHROME_WC_ID = 11111
const FIREFOX_WC_ID = 11111
// const SIGNALING_URL = 'wss://sigver-coastteam.rhcloud.com:8443'
// const signaling = 'ws://sigver-coastteam.rhcloud.com:8000'
// Used to test send/receive a lot of messages
const MSG_NUMBER = 100

const LEAVE_CODE = 1

const INSTANCES = [
  String,
  ArrayBuffer,
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array
]

function randData (Instance) {
  let res
  if (Instance === String) {
    res = randStr()
  } else {
    const lengthBuf = 64 + 64 * Math.ceil(Math.random() * 100)
    let buffer = new ArrayBuffer(lengthBuf)
    if (Instance === ArrayBuffer) return buffer
    else if ([Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array].includes(Instance)) {
      res = new Instance(buffer)
      let sign = -1
      for (let i in res) {
        res[i] = Math.round(Math.random() * 255) * sign
        sign *= sign
      }
    } else if ([Float32Array, Float64Array].includes(Instance)) {
      res = new Instance(buffer)
      let sign = -1
      for (let i in res) {
        res[i] = Math.random() * 255 * sign
        sign *= sign
      }
    }
  }
  return res
}

function randKey () {
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

function isEqual (msg1, msg2, Instance) {
  if (Instance === String) return msg1 === msg2
  else {
    if (msg1.byteLength !== msg2.byteLength) return false
    if (Instance === ArrayBuffer) {
      msg1 = new Int8Array(msg1)
      msg2 = new Int8Array(msg2)
    }
    for (let i in msg1) if (msg1[i] !== msg2[i]) return false
    return true
  }
}

function allMessagesAreSentAndReceived (groups, Instance, isBroadcast = true) {
  return Promise.all(groups.map(
    group => new Promise((resolve, reject) => {
      let tab = new Map()
      for (let g of groups) if (g.wc.myId !== group.wc.myId) tab.set(g.wc.myId, g.get(Instance))
      group.wc.onMessage = (id, msg, isBroadcast) => {
        expect(isBroadcast).toEqual(isBroadcast)
        if (typeof msg === 'string') expect(Instance).toEqual(String)
        else expect(msg instanceof Instance).toBeTruthy()
        expect(tab.has(id)).toBeTruthy()
        expect(isEqual(msg, tab.get(id), Instance)).toBeTruthy()
        tab.delete(id)
        if (tab.size === 0) resolve()
      }
    })
  ))
}

function checkMembers (wcs) {
  for (let wc of wcs) {
    expect(wc.members.length).toEqual(wcs.length - 1)
    for (let wc2 of wcs) {
      if (wc.myId !== wc2.myId) {
        let firstIndex = wc2.members.indexOf(wc.myId)
        let lastIndex = wc2.members.lastIndexOf(wc.myId)
        expect(firstIndex).not.toEqual(-1)
        expect(firstIndex).toEqual(lastIndex)
      }
    }
  }
}

class TestGroup {
  constructor (wc, instances = INSTANCES) {
    this.wc = wc
    this.msg = []
    if (instances && instances instanceof Array) {
      for (let i of instances) this.msg[i] = randData(i)
    }
  }

  get (Instance) {
    return this.msg[Instance]
  }

  set (Instance, value) {
    this.msg[Instance] = value
  }
}

function randStr () {
  const MIN_LENGTH = 1
  const MAX_LENGTH = 500 // To limit message  size to less than 16kb (4 bytes per character)
  let res = ''
  const length = MIN_LENGTH + Math.ceil(Math.random() * (MAX_LENGTH - MIN_LENGTH))

  for (let i = 0; i < length; i++) {
    res += String.fromCharCode(0x0000 + Math.ceil(Math.random() * 10000))
  }
  return res
}

function itBrowser (shouldSkip, ...args) {
  if (Util.isBrowser()) Reflect.apply(it, undefined, args)
  else if (shouldSkip) Reflect.apply(xit, undefined, args)
}

function xitBrowser (shouldSkip, ...args) {
  if (Util.isBrowser()) Reflect.apply(xit, undefined, args)
  else if (shouldSkip) Reflect.apply(xit, undefined, args)
}

function itNode (shouldSkip, ...args) {
  if (Util.isBrowser()) {
    if (shouldSkip) Reflect.apply(xit, undefined, args)
  } else Reflect.apply(it, undefined, args)
}

function xitNode (shouldSkip, ...args) {
  if (Util.isBrowser()) {
    if (shouldSkip) Reflect.apply(xit, undefined, args)
  } else Reflect.apply(xit, undefined, args)
}

function env () {
  if (Util.isBrowser()) {
    let sUsrAg = navigator.userAgent
    if (sUsrAg.indexOf('Chrome') > -1) {
      return 'CHROME'
    } else if (sUsrAg.indexOf('Firefox') > -1) {
      return 'FIREFOX'
    }
  }
  return 'NODE'
}

function sendReceive (wc, data, done, id) {
  wc.onMessage = (id, msg, isBroadcast) => {
    if (typeof data === 'string') expect(typeof msg).toEqual('string')
    else {
      expect(Reflect.getPrototypeOf(msg)).toEqual(Reflect.getPrototypeOf(data))
    }
    // expect(id).toEqual(wc.members[0])
    expect(msg).toEqual(data)
    expect(isBroadcast).toEqual(isBroadcast)
    done()
  }
  if (id) wc.sendTo(id, data)
  else wc.send(data)
}

function onMessageForBot (wc, id, msg, isBroadcast) {
  try {
    let data = JSON.parse(msg)
    switch (data.code) {
      case LEAVE_CODE:
        wc.leave()
        break
    }
  } catch (err) {
    if (isBroadcast) wc.send(msg)
    else wc.sendTo(id, msg)
  }
}

export {
  SIGNALING_URL,
  BOT,
  MSG_NUMBER,
  INSTANCES,
  LEAVE_CODE,
  CHROME_WC_ID,
  FIREFOX_WC_ID,
  randKey,
  randStr,
  randData,
  sendReceive,
  env,
  allMessagesAreSentAndReceived,
  checkMembers,
  onMessageForBot,
  TestGroup,
  itBrowser,
  xitBrowser,
  itNode,
  xitNode
}

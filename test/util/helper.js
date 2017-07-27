import { Util } from '../../src/Util'
import { WebChannel } from '../../src/service/WebChannel'
import chunk50kb from './50kb.txt'

// Main signaling server for all tests
export const SIGNALING_URL = 'ws://localhost:8000'

// Configuration for bot server
export const BOT_HOST = 'localhost'
export const BOT_PORT = 10001
export const BOT_URL = `ws://${BOT_HOST}:${BOT_PORT}`
const BOT_FETCH_URL = `http://${BOT_HOST}:${BOT_PORT}`

// Used to test send/receive a lot of messages
export const MSG_NUMBER = 100

export const LEAVE_CODE = 1

export const INSTANCES = [
  String,
  Uint8Array
]

export function createWebChannels (numberOfPeers) {
  const wcs = []
  for (let i = 0; i < numberOfPeers; i++) {
    wcs[i] = new WebChannel({signalingURL: SIGNALING_URL})
  }
  return wcs
}

export function createAndConnectWebChannels (numberOfPeers) {
  const wcs = []
  const resPromises = []

  // Create web channels
  for (let i = 0; i < numberOfPeers; i++) {
    wcs[i] = new WebChannel({signalingURL: SIGNALING_URL})
    resPromises[i] = new Promise((resolve, reject) => {
      wcs[i].onStateChanged = state => {
        if (state === WebChannel.JOINED) {
          resolve(wcs[i])
        }
      }
    })
  }

  // Connect peers successively
  const key = randKey()
  let tmp = Promise.resolve()
  for (let wc of wcs) {
    tmp = tmp.then(() => wc.join(key))
  }

  // Resolve when all peers are connected
  return Promise.all(resPromises)
}

export function expectMembers (wcs, totalNumberOfPeers) {
  for (let i = 0; i < wcs.length; i++) {
    expect(wcs[i].members.length).toEqual(totalNumberOfPeers - 1)
    for (let j = i + 1; j < wcs.length; j++) {
      // Each peer should detect each other and only ONCE
      let firstIndex = wcs[j].members.indexOf(wcs[i].myId)
      let lastIndex = wcs[j].members.lastIndexOf(wcs[i].myId)
      expect(firstIndex).not.toEqual(-1)
      expect(firstIndex).toEqual(lastIndex)
      firstIndex = wcs[i].members.indexOf(wcs[j].myId)
      lastIndex = wcs[i].members.lastIndexOf(wcs[j].myId)
      expect(firstIndex).not.toEqual(-1)
      expect(firstIndex).toEqual(lastIndex)
    }
  }
}

export function expectBotMembers (wcId, wcs, totalNumberOfPeers) {
  return fetch(`${BOT_FETCH_URL}/members/${wcId}`)
    .then(res => res.json())
    .then(({ id, members }) => {
      expect(members.length).toEqual(totalNumberOfPeers - 1)
      wcs.forEach(wc => {
        expect(wc.members.includes(id)).toBeTruthy()
        expect(members.includes(wc.myId)).toBeTruthy()
      })
    })
}

export function botWaitJoin (wcId) {
  return fetch(`${BOT_FETCH_URL}/waitJoin/${wcId}`)
}

export function sendAndExpectOnMessage (wcs, isBroadcast, withBot = false) {
  const promises = []

  promises.push(new Promise((resolve, reject) => {
    // Run through each agent
    wcs.forEach(wc => {
      // Prepare message flags for check
      const flags = new Map()
      wc.members.forEach(id => flags.set(id, {
        string: false,
        arraybuffer: false,
        chunk: false
      }))

      // Handle message event
      wc.onMessage = (id, msg, broadcasted) => {
        expect(broadcasted).toEqual(isBroadcast)
        let msgId
        const flag = flags.get(id)
        expect(flag).toBeDefined()
        if (typeof msg === 'string' || msg instanceof String) {
          let msgObj = JSON.parse(msg)
          msgId = msgObj.id

          // Receive Chunk
          if (msgObj.data) {
            expect(flag.chunk).toBeFalsy()
            flag.chunk = true

          // Receive String
          } else {
            expect(flag.string).toBeFalsy()
            flag.string = true
          }

        // Receive Binary
        } else if (msg instanceof Uint8Array) {
          // log.debug(wc.myId + ' received Uint8Array from ' + id + ' is broadcast ' + broadcasted)
          expect(flag.arraybuffer).toBeFalsy()
          flag.arraybuffer = true
          msgId = (new Uint32Array(msg.slice(0, msg.length).buffer))[0]
        } else {
          console.error('Unknown message type')
        }
        expect(msgId).toBeDefined()
        expect(msgId).toEqual(id)
        expect(flags.has(msgId)).toBeTruthy()
        if (flag.string && flag.arraybuffer && flag.chunk) {
          flags.delete(id)
        }

        // resolve when all messages are received
        if (flags.size === 0) {
          resolve()
        }
      }

      // Send messages
      sendMessages(wc, isBroadcast)
    })
  }))

  if (withBot) {
    promises.push(new Promise((resolve, reject) => {
      // Tell bot to send messages
      tellBotToSend(wcs[0].id)
        .then(res => {
          if (!res.ok) {
            reject(res.statusText)
          } else {
            resolve()
          }
        })
    }))
  }
  return Promise.all(promises)
}

function sendMessages (wc, isBroadcast) {
  // Create messages

  // String
  const msgString = JSON.stringify({ id: wc.myId })

  // String chunk of 50Kb
  const msgChunk = JSON.stringify({ id: wc.myId, data: chunk50kb })

  // ArrayBuffer
  const msgArrayBuffer = new Uint32Array(1)
  msgArrayBuffer[0] = wc.myId

  // Broadcast the messages
  if (isBroadcast) {
    wc.send(msgString)
    wc.send(msgChunk)
    wc.send(new Uint8Array(msgArrayBuffer.buffer))

  // Send the messages privately to each peer
  } else {
    wc.members.forEach(id => {
      wc.sendTo(id, msgString)
      wc.sendTo(id, msgChunk)
      console.log('Send ', msgArrayBuffer.buffer.byteLength)
      wc.sendTo(id, new Uint8Array(msgArrayBuffer.buffer))
    })
  }
}

export function randData (Instance) {
  let res
  if (Instance === String) {
    res = randStr()
  } else {
    const lengthBuf = 64 + 64 * Math.ceil(Math.random() * 100)
    const buffer = new ArrayBuffer(lengthBuf)
    if (Instance === ArrayBuffer) {
      return buffer
    }
  }
  return res
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

export function itBrowser (shouldSkip, ...args) {
  if (Util.isBrowser()) Reflect.apply(it, undefined, args)
  else if (shouldSkip) Reflect.apply(xit, undefined, args)
}

export function xitBrowser (shouldSkip, ...args) {
  if (Util.isBrowser()) Reflect.apply(xit, undefined, args)
  else if (shouldSkip) Reflect.apply(xit, undefined, args)
}

export function itNode (shouldSkip, ...args) {
  if (Util.isBrowser()) {
    if (shouldSkip) Reflect.apply(xit, undefined, args)
  } else Reflect.apply(it, undefined, args)
}

export function xitNode (shouldSkip, ...args) {
  if (Util.isBrowser()) {
    if (shouldSkip) Reflect.apply(xit, undefined, args)
  } else Reflect.apply(xit, undefined, args)
}

export function env () {
  if (Util.isBrowser()) {
    const sUsrAg = navigator.userAgent
    if (sUsrAg.indexOf('Chrome') > -1) {
      return 'CHROME'
    } else if (sUsrAg.indexOf('Firefox') > -1) {
      return 'FIREFOX'
    }
  }
  return 'NODE'
}

export function onMessageForBot (wc, id, msg, isBroadcast) {
  try {
    const data = JSON.parse(msg)
    switch (data.code) {
      case LEAVE_CODE:
        wc.disconnect()
        break
    }
  } catch (err) {
    if (isBroadcast) wc.send(msg)
    else wc.sendTo(id, msg)
  }
}

function tellBotToSend (wcId) {
  return fetch(`${BOT_FETCH_URL}/send/${wcId}`)
}

export class Scenario {
  constructor (template) {
    this.template = template
  }

  get nbClients () {
    let count = 0
    for (let i = 0; i < this.template.length; i++) {
      if (this.template[i] === 'c') {
        count++
      }
    }
    return count
  }

  get nbPeers () {
    return this.template.length
  }

  get smiles () {
    return this.template.replace(/c/g, '🙂').replace(/b/g, '🤖')
  }

  hasBot () {
    for (let i = 0; i < this.template.length; i++) {
      if (this.template[i] === 'b') {
        return true
      }
    }
    return false
  }
}

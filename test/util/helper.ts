import { Subject } from 'rxjs/Subject'

import { WebGroup, WebGroupState } from '../../src'

const isBrowser = (typeof window === 'undefined') ? false : true

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

export function createWebGroups (numberOfPeers) {
  const wgs = []
  for (let i = 0; i < numberOfPeers; i++) {
    wgs[i] = new WebGroup({signalingURL: SIGNALING_URL})
  }
  return wgs
}

export function createAndConnectWebGroups (numberOfPeers) {
  const wgs = []
  const network = new Subject()
  const key = randKey()
  let nextJoiningIndex = 0

  // Create web channels
  for (let i = 0; i < numberOfPeers; i++) {
    wgs[i] = new WebGroup({signalingURL: SIGNALING_URL})
    wgs[i].onStateChange = state => {
      if (state === WebGroupState.JOINED) {
        network.next(++i)
      }
    }
  }

  return new Promise((resolve, reject) => {
    network.subscribe(
      (index: number ) => {
        if (index === numberOfPeers) {
          resolve(wgs)
        } else {
          wgs[index].join(key)
        }
      }
    )
    wgs[0].join(key)
  })
}

export function expectMembers (wgs, totalNumberOfPeers) {
  for (let i = 0; i < wgs.length; i++) {
    expect(wgs[i].members.length).toEqual(totalNumberOfPeers - 1)
    for (let j = i + 1; j < wgs.length; j++) {
      // Each peer should detect each other and only ONCE
      let firstIndex = wgs[j].members.indexOf(wgs[i].myId)
      let lastIndex = wgs[j].members.lastIndexOf(wgs[i].myId)
      expect(firstIndex).not.toEqual(-1)
      expect(firstIndex).toEqual(lastIndex)
      firstIndex = wgs[i].members.indexOf(wgs[j].myId)
      lastIndex = wgs[i].members.lastIndexOf(wgs[j].myId)
      expect(firstIndex).not.toEqual(-1)
      expect(firstIndex).toEqual(lastIndex)
    }
  }
}

export function sendAndExpectOnMessage (wgs, isBroadcast, withBot = false) {
  const promises = []

  promises.push(new Promise((resolve, reject) => {
    // Run through each agent
    wgs.forEach(wg => {
      // Prepare message flags for check
      const flags = new Map()
      wg.members.forEach(id => flags.set(id, {
        string: false,
        arraybuffer: false,
        chunk: false
      }))

      // Handle message event
      wg.onMessage = (id, msg, broadcasted) => {
        expect(broadcasted).toEqual(isBroadcast)
        let msgId
        const flag = flags.get(id)
        expect(flag).toBeDefined()
        if (typeof msg === 'string') {
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
          // log.debug(wg.myId + ' received Uint8Array from ' + id + ' is broadcast ' + broadcasted)
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
      sendMessages(wg, isBroadcast)
    })
  }))

  if (withBot) {
    promises.push(new Promise((resolve, reject) => {
      // Tell bot to send messages
      tellBotToSend(wgs[0].id)
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

function sendMessages (wg, isBroadcast) {
  // Create messages

  // String
  const msgString = JSON.stringify({ id: wg.myId })

  // String chunk of 50Kb
  const msgChunk = JSON.stringify({ id: wg.myId, data: randStr(50) })

  // ArrayBuffer
  const msgArrayBuffer = new Uint32Array(1)
  msgArrayBuffer[0] = wg.myId

  // Broadcast the messages
  if (isBroadcast) {
    wg.send(msgString)
    wg.send(msgChunk)
    wg.send(new Uint8Array(msgArrayBuffer.buffer))

  // Send the messages privately to each peer
  } else {
    wg.members.forEach(id => {
      wg.sendTo(id, msgString)
      wg.sendTo(id, msgChunk)
      wg.sendTo(id, new Uint8Array(msgArrayBuffer.buffer))
    })
  }
}

export function env () {
  if (isBrowser) {
    const sUsrAg = navigator.userAgent
    if (sUsrAg.indexOf('Chrome') > -1) {
      return 'CHROME'
    } else if (sUsrAg.indexOf('Firefox') > -1) {
      return 'FIREFOX'
    }
  }
  return 'NODE'
}

export function expectBotMembers (wgId, wgs, totalNumberOfPeers) {
  return fetch(`${BOT_FETCH_URL}/members/${wgId}`)
    .then(res => res.json())
    .then(({ id, members }) => {
      expect(members.length).toEqual(totalNumberOfPeers - 1)
      wgs.forEach(wg => {
        expect(wg.members.includes(id)).toBeTruthy()
        expect(members.includes(wg.myId)).toBeTruthy()
      })
    })
}

export function botWaitJoin (wgId) {
  return fetch(`${BOT_FETCH_URL}/waitJoin/${wgId}`)
}

export function onMessageForBot (wg, id, msg, isBroadcast) {
  try {
    const data = JSON.parse(msg)
    switch (data.code) {
      case LEAVE_CODE:
        wg.leave()
        break
    }
  } catch (err) {
    if (isBroadcast) {
      wg.send(msg)
    } else {
      wg.sendTo(id, msg)
    }
  }
}

function tellBotToSend (wgId) {
  return fetch(`${BOT_FETCH_URL}/send/${wgId}`)
}

export class Scenario {
  public template: string

  constructor (template: string) {
    this.template = template
  }

  get nbBrowsers () {
    let count = 0
    for (let i = 0; i < this.template.length; i++) {
      if (this.template[i] === 'c') {
        count++
      }
    }
    return count
  }

  get nbMembers () {
    return this.template.length
  }

  get smiles () {
    return this.template.replace(/c/g, '🙂').replace(/b/g, '🤖')
  }

  get botIndex () {
    for (let i = 0; i < this.template.length; i++) {
      if (this.template[i] === 'b') {
        return i
      }
    }
    return -1
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

export function randStr (sizeInKb = 14) {
  const length = sizeInKb * 256
  let str = ''
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(0x0000 + Math.ceil(Math.random() * 10000))
  }
  return str
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

export function itBrowser (shouldSkip, ...args) {
  if (isBrowser) {
    Reflect.apply(it, undefined, args)
  } else if (shouldSkip) {
    Reflect.apply(xit, undefined, args)
  }
}

export function xitBrowser (shouldSkip, ...args) {
  if (isBrowser) {
    Reflect.apply(xit, undefined, args)
  } else if (shouldSkip) {
    Reflect.apply(xit, undefined, args)
  }
}

export function itNode (shouldSkip, ...args) {
  if (isBrowser) {
    if (shouldSkip) {
      Reflect.apply(xit, undefined, args)
    }
  } else {
    Reflect.apply(it, undefined, args)
  }
}

export function xitNode (shouldSkip, ...args) {
  if (isBrowser) {
    if (shouldSkip) {
      Reflect.apply(xit, undefined, args)
    }
  } else {
    Reflect.apply(xit, undefined, args)
  }
}

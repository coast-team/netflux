import { SignalingState, WebGroup, WebGroupState } from '../../src/index.browser'
import { LogLevel, setLogLevel } from '../../src/misc/Util'

setLogLevel([
  LogLevel.DEBUG,
  // LogLevel.SIGNALING,
  // LogLevel.CHANNEL,
  // LogLevel.CHANNEL_BUILDER,
  // LogLevel.WEBRTC,
  // LogLevel.TOPOLOGY,
])

// Main signaling server for all tests
export const SIGNALING_URL = 'ws://localhost:8010'

// Configuration for bot server
export const BOT_HOST = 'localhost'
export const BOT_PORT = 10001
export const BOT_URL = `ws://${BOT_HOST}:${BOT_PORT}`
const BOT_FETCH_URL = `http://${BOT_HOST}:${BOT_PORT}`

export function areTheSame(
  array1: Array<number | string | boolean | Uint8Array>,
  array2: Array<number | string | boolean | Uint8Array>
) {
  if (array1.length === array2.length) {
    if (array1.length !== 0) {
      const array2Copy: any[] = Array.from(array2)

      if (array1[0] instanceof Uint8Array) {
        for (const e of array1) {
          let found = false
          array2Copy.forEach((v: Array<number | string | boolean>, i: number) => {
            if (areIdentical(e as any, v)) {
              found = true
              array2Copy[i] = ['¤']
            }
          })
          if (!found) {
            return false
          }
        }
      } else {
        for (const e of array1) {
          const index = array2Copy.indexOf(e)
          if (index !== -1) {
            array2Copy[index] = '¤'
          } else {
            return false
          }
        }
      }
    }
    return true
  } else {
    return false
  }
}

function areIdentical(
  array1: Array<number | string | boolean> | Uint8Array,
  array2: Array<number | string | boolean> | Uint8Array
) {
  return (array1 as any[]).every((v, i) => v === (array2 as any[])[i])
}

export class Queue {
  private promises: Array<Promise<void>>
  private resolvers: Array<() => void>
  private counter: number

  constructor(length: number) {
    this.counter = 0
    this.promises = []
    this.resolvers = []
    for (let i = 0; i < length; i++) {
      this.promises.push(
        new Promise((resolve) => {
          this.resolvers.push(() => resolve())
        })
      )
    }
  }

  pop() {
    if (this.counter < this.resolvers.length) {
      this.resolvers[this.counter++]()
    }
  }

  wait(): Promise<void[]> {
    return Promise.all(this.promises)
  }
}

export interface IBotData {
  id: number
  onMemberJoinCalled: number
  joinedMembers: number[]
  onMemberLeaveCalled: number
  leftMembers: number[]
  onStateCalled: number
  states: number[]
  onSignalingStateCalled: number
  signalingStates: number[]
  messages: IBotMessage[]
  onMessageToBeCalled: number
  state: WebGroupState
  signalingState: SignalingState
  key: string
  topology: number
  members: number[]
  myId: number
}

export interface IBotMessage {
  id: number
  msg: string | Uint8Array
}

export function getBotData(wgId: number): Promise<IBotData> {
  return fetch(`${BOT_FETCH_URL}/data/${wgId}`).then(async (res) => {
    if (res.status !== 200) {
      throw new Error(await res.text())
    } else {
      return res.json()
    }
  })
}

export function waitBotJoin(wgId: number) {
  return fetch(`${BOT_FETCH_URL}/waitJoin/${wgId}`).then(async (res) => {
    if (res.status !== 200) {
      throw new Error(await res.text())
    }
  })
}

export function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), milliseconds))
}

export function cleanWebGroup(wg: WebGroup) {
  wg.onMemberJoin = undefined
  wg.onMemberLeave = undefined
  wg.onMessage = undefined
  wg.onSignalingStateChange = undefined
  wg.onStateChange = undefined
}

export interface IMessages {
  ids: number[]
  msgs: Array<string | Uint8Array>
}

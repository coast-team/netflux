/// <reference types='jasmine' />
import { SignalingState, Topology, WebGroup, WebGroupState } from '../../src/index.browser'
import {
  cleanWebGroup,
  getBotData,
  leaveBotGroup,
  newBotGroup,
  randomKey,
  SIGNALING_URL,
  wait,
  waitBotJoin,
} from '../util/helper'

const WebGroupOptions = {
  signalingServer: SIGNALING_URL,
  autoRejoin: false,
}

/** @test {WebGroup} */
describe('1 member', () => {
  describe('🙂', () => {
    let wg1: WebGroup

    /** @test {WebGroup#constructor} */
    it('constructor', () => {
      const wg = new WebGroup({ signalingServer: SIGNALING_URL })

      // Check members
      const id = Reflect.getOwnPropertyDescriptor(wg, 'id')
      expect(id).toBeDefined()
      expect(wg.id).toBe(0)
      expect((id as PropertyDescriptor).set).toBeUndefined()

      const myId = Reflect.getOwnPropertyDescriptor(wg, 'myId')
      expect(myId).toBeDefined()
      expect(wg.myId).toBe(0)
      expect((myId as PropertyDescriptor).set).toBeUndefined()

      const key = Reflect.getOwnPropertyDescriptor(wg, 'key')
      expect(key).toBeDefined()
      expect(wg.key).toBe('')
      expect((key as PropertyDescriptor).set).toBeUndefined()

      const members = Reflect.getOwnPropertyDescriptor(wg, 'members')
      expect(members).toBeDefined()
      expect(wg.members).toEqual([])
      expect((members as PropertyDescriptor).set).toBeUndefined()

      const topology = Reflect.getOwnPropertyDescriptor(wg, 'topology')
      expect(topology).toBeDefined()
      expect(wg.topology).toBe(Topology.FULL_MESH)
      expect((topology as PropertyDescriptor).set).toBeUndefined()

      const state = Reflect.getOwnPropertyDescriptor(wg, 'state')
      expect(state).toBeDefined()
      expect(wg.state).toBe(WebGroupState.LEFT)
      expect((state as PropertyDescriptor).set).toBeUndefined()

      const signalingState = Reflect.getOwnPropertyDescriptor(wg, 'signalingState')
      expect(signalingState).toBeDefined()
      expect(wg.signalingState).toBe(SignalingState.CLOSED)
      expect((signalingState as PropertyDescriptor).set).toBeUndefined()

      const signalingServer = Reflect.getOwnPropertyDescriptor(wg, 'signalingServer')
      expect(signalingServer).toBeDefined()
      expect(wg.signalingServer).toBe(SIGNALING_URL)
      expect((signalingServer as PropertyDescriptor).set).toBeUndefined()

      expect(wg.autoRejoin).toBeTruthy()
      wg.autoRejoin = false
      expect(wg.autoRejoin).toBeFalsy()

      // Check event handlers
      expect(wg.onMemberJoin).toBeUndefined()
      expect(wg.onMemberLeave).toBeUndefined()
      expect(wg.onMessage).toBeUndefined()
      expect(wg.onStateChange).toBeUndefined()
      expect(wg.onSignalingStateChange).toBeUndefined()

      // Check methods
      expect(typeof wg.join).toBe('function')
      expect(typeof wg.invite).toBe('function')
      expect(typeof wg.leave).toBe('function')
      expect(typeof wg.send).toBe('function')
      expect(typeof wg.sendTo).toBe('function')
    })

    /** @test {WebGroup#join} */
    describe('joining', () => {
      beforeEach(() => {
        wg1 = new WebGroup(WebGroupOptions)
      })

      afterEach(() => {
        cleanWebGroup(wg1)
        wg1.leave()
      })

      /** @test {WebGroup#onSignalingStateChange} */
      it('should change the Signaling state', (done) => {
        let called = 0
        const states: SignalingState[] = []
        const expected = [
          SignalingState.CONNECTING,
          SignalingState.OPEN,
          SignalingState.CHECKING,
          SignalingState.CHECKED,
          SignalingState.CHECKING,
          SignalingState.CHECKED,
        ]

        wg1.onSignalingStateChange = (state: SignalingState) => {
          called++
          states.push(state)
          if (called === expected.length) {
            wait(1000).then(() => {
              expect(states).toEqual(expected)
              expect(called).toEqual(expected.length)
              expect(wg1.signalingState).toEqual(SignalingState.CHECKED)
              done()
            })
          }
        }

        // Start joining
        wg1.join()
      })

      /** @test {WebGroup#onStateChange} */
      it('should change the WebGroup state', (done) => {
        let called = 0
        const states: WebGroupState[] = []
        const expected = [WebGroupState.JOINING, WebGroupState.JOINED]

        wg1.onStateChange = (state: WebGroupState) => {
          called++
          states.push(state)
          if (called === expected.length) {
            wait(1000).then(() => {
              expect(states).toEqual(expected)
              expect(called).toEqual(expected.length)
              expect(wg1.state).toEqual(WebGroupState.JOINED)
              done()
            })
          }
        }

        // Start joining
        wg1.join()
      })

      /** @test {WebGroup#onMemberJoin} */
      it('should NOT be notified about new member', (done) => {
        let called1 = 0

        wg1.onMemberJoin = () => called1++
        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            wait(1000).then(() => {
              expect(called1).toEqual(0)
              done()
            })
          }
        }

        // Start joining
        wg1.join()
      })

      /** @test {WebGroup} */
      it('should have the same members, WebGroup id, topology and NOT empty key once joined', (done) => {
        const topology = wg1.topology

        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            expect(wg1.members).toEqual([wg1.myId])
            expect(wg1.myId).not.toEqual(0)
            expect(wg1.id).not.toEqual(0)
            expect(topology).toEqual(wg1.topology)
            expect(wg1.key).not.toEqual('')

            wait(1000).then(() => {
              expect(wg1.members).toEqual([wg1.myId])
              expect(wg1.myId).not.toEqual(0)
              expect(wg1.id).not.toEqual(0)
              expect(topology).toEqual(wg1.topology)
              expect(wg1.key).not.toEqual('')
              done()
            })
          }
        }

        // Start joining
        wg1.join()
      })

      /** @test {WebGroup#join} */
      it('should join with the specified key', (done) => {
        const key = 'ArtIsLongLifeIsShort'
        const wg = new WebGroup(WebGroupOptions)

        wg.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            expect(wg.key).toEqual(key)
            wg.leave()
            done()
          }
        }

        // Start joining
        wg.join(key)
      })
    })

    describe('leaving', () => {
      beforeEach((done) => {
        wg1 = new WebGroup(WebGroupOptions)
        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            cleanWebGroup(wg1)
            done()
          }
        }
        wg1.join()
      })

      afterEach(() => cleanWebGroup(wg1))

      /** @test {WebGroup#leave} */
      it('should have the same members, WebGroup id, topology and an empty key', (done) => {
        const topology = wg1.topology

        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.LEFT) {
            expect(wg1.members).toEqual([])
            expect(wg1.myId).toBe(0)
            expect(wg1.id).toBe(0)
            expect(topology).toEqual(wg1.topology)
            expect(wg1.key).toEqual('')

            wait(1000).then(() => {
              expect(wg1.members).toEqual([])
              expect(wg1.myId).toBe(0)
              expect(wg1.id).toBe(0)
              expect(topology).toEqual(wg1.topology)
              expect(wg1.key).toEqual('')
              done()
            })
          }
        }

        // Start leaving
        wg1.leave()
      })

      /** @test {WebGroup#onMemberLeave} */
      it('should be NOT notified about left member', (done) => {
        let called1 = 0

        wg1.onMemberJoin = () => called1++

        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.LEFT) {
            wait(1000).then(() => {
              expect(called1).toEqual(0)
              done()
            })
          }
        }

        // Start leaving
        wg1.leave()
      })

      /** @test {WebGroup#onStateChange} */
      it('should change the WebGroup state', (done) => {
        let called1 = 0
        const states: WebGroupState[] = []
        const expected = [WebGroupState.LEFT]

        wg1.onStateChange = (state: WebGroupState) => {
          states.push(state)
          called1++
          if (state === WebGroupState.LEFT) {
            wait(1000).then(() => {
              expect(called1).toEqual(expected.length)
              expect(states).toEqual(expected)
              done()
            })
          }
        }

        // Start leaving
        wg1.leave()
      })

      /** @test {WebGroup#onSignalingStateChange} */
      it('should change the Signaling state', (done) => {
        let called1 = 0
        const states: SignalingState[] = []
        const expected = [SignalingState.CLOSED]

        wg1.onSignalingStateChange = (state: SignalingState) => {
          states.push(state)
          called1++
          wait(1000).then(() => {
            expect(called1).toEqual(expected.length)
            expect(states).toEqual(expected)
            done()
          })
        }

        // Start leaving
        wg1.leave()
      })
    })
  })

  describe('🤖', () => {
    describe('joining', () => {
      let key: string
      beforeEach((done) => {
        key = randomKey()
        newBotGroup(key).then(() => done())
      })

      afterEach((done) => {
        leaveBotGroup(key).then(() => done())
      })

      /** @test {WebGroup#onSignalingStateChange} */
      it('should change the Signaling state', (done) => {
        const expected = [
          SignalingState.CONNECTING,
          SignalingState.OPEN,
          SignalingState.CHECKING,
          SignalingState.CHECKED,
          SignalingState.CHECKING,
          SignalingState.CHECKED,
        ]
        waitBotJoin(key)
          .then(() => getBotData(key))
          .then((data) => {
            expect(data.onSignalingStateCalled).toEqual(expected.length)
            expect(data.signalingStates).toEqual(expected)
            expect(data.signalingState).toEqual(SignalingState.CHECKED)
            done()
          })
      })

      /** @test {WebGroup#onStateChange} */
      it('should change the WebGroup state', (done) => {
        const expected = [WebGroupState.JOINING, WebGroupState.JOINED]
        waitBotJoin(key)
          .then(() => getBotData(key))
          .then((data) => {
            expect(data.state).toEqual(WebGroupState.JOINED)
            expect(data.states).toEqual(expected)
            expect(data.onStateCalled).toEqual(expected.length)
            done()
          })
      })

      /** @test {WebGroup#onMemberJoin} */
      it('should NOT be notified about new member', (done) => {
        waitBotJoin(key)
          .then(() => getBotData(key))
          .then((data) => {
            expect(data.onMemberJoinCalled).toEqual(0)
            expect(data.joinedMembers.length).toEqual(0)
            done()
          })
      })

      /** @test {WebGroup#onSignalingStateChange} */
      it('should have the same members, WebGroup id, topology and NOT empty key once joined', (done) => {
        waitBotJoin(key)
          .then(() => getBotData(key))
          .then((data) => {
            expect(data.members).toEqual([data.myId])
            expect(data.myId).not.toEqual(0)
            expect(data.id).not.toEqual(0)
            expect(data.key).toEqual(key)
            done()
          })
      })
    })

    describe('leaving', () => {
      let key: string
      beforeEach((done) => {
        key = randomKey()
        newBotGroup(key).then(() => done())
      })

      /** @test {WebGroup#leave} */
      it('should have the same members, WebGroup id, topology and an empty key', (done) => {
        leaveBotGroup(key).then((data) => {
          expect(data.members).toEqual([])
          expect(data.myId).toBe(0)
          expect(data.id).toBe(0)
          expect(data.key).toEqual('')
          done()
        })
      })

      /** @test {WebGroup#onMemberLeave} */
      it('should be NOT notified about left member', (done) => {
        leaveBotGroup(key).then((data) => {
          expect(data.leftMembers).toEqual([])
          expect(data.onMemberLeaveCalled).toEqual(0)
          done()
        })
      })

      /** @test {WebGroup#onStateChange} */
      it('should change the WebGroup state', (done) => {
        const expected = [WebGroupState.JOINING, WebGroupState.JOINED, WebGroupState.LEFT]
        leaveBotGroup(key).then((data) => {
          expect(data.states).toEqual(expected)
          expect(data.onStateCalled).toEqual(expected.length)
          done()
        })
      })

      /** @test {WebGroup#onSignalingStateChange} */
      it('should change the Signaling state', (done) => {
        const expected = [
          SignalingState.CONNECTING,
          SignalingState.OPEN,
          SignalingState.CHECKING,
          SignalingState.CHECKED,
          SignalingState.CHECKING,
          SignalingState.CHECKED,
          SignalingState.CLOSED,
        ]
        leaveBotGroup(key).then((data) => {
          expect(data.signalingStates).toEqual(expected)
          expect(data.onSignalingStateCalled).toEqual(expected.length)
          done()
        })
      })
    })
  })
})

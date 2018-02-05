/// <reference types='jasmine' />
import { SignalingState, Topology, WebGroup, WebGroupState } from '../../src/index.browser'
import { MAX_KEY_LENGTH } from '../../src/misc/Util'
import { areTheSame, Queue, SIGNALING_URL, wait } from '../util/helper'

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
      const wg = new WebGroup({signalingServer: SIGNALING_URL})

      // Check members
      expect(typeof wg.id).toBe('number')
      expect(Reflect.getOwnPropertyDescriptor(wg, 'id').set).toBeUndefined()
      expect(typeof wg.myId).toBe('number')
      expect(Reflect.getOwnPropertyDescriptor(wg, 'myId').set).toBeUndefined()
      expect(wg.key).toBe('')
      expect(Reflect.getOwnPropertyDescriptor(wg, 'key').set).toBeUndefined()
      expect(wg.members).toEqual([wg.myId])
      expect(Reflect.getOwnPropertyDescriptor(wg, 'members').set).toBeUndefined()
      expect(wg.topology).toBe(Topology.FULL_MESH)
      expect(Reflect.getOwnPropertyDescriptor(wg, 'topology').set).toBeUndefined()
      expect(wg.state).toBe(WebGroupState.LEFT)
      expect(Reflect.getOwnPropertyDescriptor(wg, 'state').set).toBeUndefined()
      expect(wg.signalingState).toBe(SignalingState.CLOSED)
      expect(Reflect.getOwnPropertyDescriptor(wg, 'signalingState').set).toBeUndefined()
      expect(wg.signalingServer).toBe(SIGNALING_URL)
      expect(Reflect.getOwnPropertyDescriptor(wg, 'signalingServer').set).toBeUndefined()
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
      beforeEach (() => {
        wg1 = new WebGroup(WebGroupOptions)
      })

      afterEach ((done) => {
        if (wg1.state !== WebGroupState.LEFT) {
          wg1.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              done()
            }
          }
          wg1.leave()
        } else {
          done()
        }
      })

      /** @test {WebGroup#onSignalingStateChange} */
      it('should change the Signaling state', (done) => {
        let called1 = 0
        const states: SignalingState[] = []
        const expectedStates = [SignalingState.CONNECTING, SignalingState.STABLE]

        wg1.onSignalingStateChange = (state: SignalingState) => {
          states.push(state)
          called1++
          if (called1 === 2) {
            wait(1000).then(() => {
              expect(called1).toEqual(2)
              expect(states).toEqual(expectedStates)
              expect(wg1.signalingState).toEqual(SignalingState.STABLE)
              done()
            })
          }
        }

        // Start joining
        wg1.join()
      })

      /** @test {WebGroup#onStateChange} */
      it('should change the WebGroup state', (done) => {
        let called1 = 0
        const states: WebGroupState[] = []
        const expectedStates = [WebGroupState.JOINING, WebGroupState.JOINED]

        wg1.onStateChange = (state: WebGroupState) => {
          states.push(state)
          called1++
          if (called1 === 2) {
            wait(1000).then(() => {
              expect(called1).toEqual(2)
              expect(states).toEqual(expectedStates)
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

        wg1.onMemberJoin = (id) => called1++
        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            wait(1000)
              .then(() => {
                expect(called1).toEqual(0)
                done()
              })
          }
        }

        // Start joining
        wg1.join()
      })

      it('should have the same members, WebGroup id, topology and NOT empty key once joined', (done) => {
        const members = Array.from(wg1.members)
        const myId = wg1.myId
        const id = wg1.id
        const topology = wg1.topology

        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            expect(areTheSame(wg1.members, members)).toBeTruthy()
            expect(myId).toEqual(wg1.myId)
            expect(id).toEqual(wg1.id)
            expect(topology).toEqual(wg1.topology)
            expect(wg1.key).not.toEqual('')

            wait(1000)
              .then(() => {
                expect(areTheSame(wg1.members, members)).toBeTruthy()
                expect(myId).toEqual(wg1.myId)
                expect(id).toEqual(wg1.id)
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
      beforeEach ((done) => {
        wg1 = new WebGroup(WebGroupOptions)
        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            done()
          }
        }
        wg1.join()
      })

      /** @test {WebGroup#leave} */
      it('should have the same members, WebGroup id, topology and an empty key', (done) => {
        const members = Array.from(wg1.members)
        const myId = wg1.myId
        const id = wg1.id
        const topology = wg1.topology

        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.LEFT) {
            expect(areTheSame(wg1.members, members)).toBeTruthy()
            expect(myId).toEqual(wg1.myId)
            expect(id).toEqual(wg1.id)
            expect(topology).toEqual(wg1.topology)
            expect(wg1.key).toEqual('')

            wait(1000)
              .then(() => {
                expect(areTheSame(wg1.members, members)).toBeTruthy()
                expect(myId).toEqual(wg1.myId)
                expect(id).toEqual(wg1.id)
                expect(topology).toEqual(wg1.topology)
                expect(wg1.key).toEqual('')
                done()
              })
          }
        }

        // Start joining
        wg1.leave()
      })

        /** @test {WebGroup#onMemberLeave} */
      it('should be NOT notified about left member', (done) => {
        let called1 = 0

        wg1.onMemberJoin = (id) => called1++

        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.LEFT) {
            wait(1000)
              .then(() => {
                expect(called1).toEqual(0)
                done()
              })
          }
        }

        wg1.leave()
      })

        /** @test {WebGroup#onStateChange} */
      it('should change the WebGroup state', (done) => {
        let called1 = 0

        wg1.onStateChange = (state: WebGroupState) => {
          expect(state).toEqual(WebGroupState.LEFT)
          called1++
          wait(1000)
            .then(() => {
              expect(called1).toEqual(1)
              expect(state).toEqual(WebGroupState.LEFT)
              done()
            })
        }

        wg1.leave()
      })

        /** @test {WebGroup#onSignalingStateChange} */
      it('should change the Signaling state', (done) => {
        let called1 = 0

        wg1.onSignalingStateChange = (state: SignalingState) => {
          expect(state).toEqual(SignalingState.CLOSED)
          called1++
          wait(1000)
            .then(() => {
              expect(called1).toEqual(1)
              expect(state).toEqual(SignalingState.CLOSED)
              done()
            })
        }

        wg1.leave()
      })
    })
  })
})

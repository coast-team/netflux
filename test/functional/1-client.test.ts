/// <reference types='jasmine' />
import { SignalingState, Topology, WebGroup, WebGroupState } from '../../src/index.browser'
import { cleanWebGroup, SIGNALING_URL, wait } from '../util/helper'

const WebGroupOptions = {
  signalingServer: SIGNALING_URL,
  autoRejoin: false,
}

/** @test {WebGroup} */
describe('🙂 - 1 client', () => {
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

    const neighbors = Reflect.getOwnPropertyDescriptor(wg, 'neighbors')
    expect(neighbors).toBeDefined()
    expect(wg.neighbors).toEqual([])
    expect((neighbors as PropertyDescriptor).set).toBeUndefined()

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
  describe('join', () => {
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
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#signalingState} */
    it('Signaling state should be CHECKED', (done) => {
      let called = 0
      wg1.onSignalingStateChange = (state: SignalingState) => {
        called++
        if (called === 6) {
          wait(1000).then(() => {
            expect(wg1.signalingState).toEqual(SignalingState.CHECKED)
            done()
          })
        }
      }

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
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#state} */
    it('WebGroup state should be JOINED', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          wait(1000).then(() => {
            expect(wg1.state).toEqual(WebGroupState.JOINED)
            done()
          })
        }
      }

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

      wg1.join()
    })

    /** @test {WebGroup#onMemberLeave} */
    it('should NOT be notified about left member', (done) => {
      let called1 = 0

      wg1.onMemberLeave = () => called1++
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          wait(1000).then(() => {
            expect(called1).toEqual(0)
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#onMessage} */
    it('should NOT receive any message', (done) => {
      let called1 = 0

      wg1.onMessage = () => called1++
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          wait(1000).then(() => {
            expect(called1).toEqual(0)
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#members} */
    it('should have only me as a member', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.members).toEqual([wg1.myId])

          wait(1000).then(() => {
            expect(wg1.members).toEqual([wg1.myId])
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#myId} */
    it('my id should not be 0', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.myId).not.toEqual(0)

          wait(1000).then(() => {
            expect(wg1.myId).not.toEqual(0)
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#id} */
    it('WebGroup id should not be 0', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.id).not.toEqual(0)

          wait(1000).then(() => {
            expect(wg1.id).not.toEqual(0)
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#key} */
    it('key should not be empty', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.key).not.toEqual('')

          wait(1000).then(() => {
            expect(wg1.key).not.toEqual('')
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#topology} */
    it('topology should not change', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.topology).toEqual(Topology.FULL_MESH)

          wait(1000).then(() => {
            expect(wg1.topology).toEqual(Topology.FULL_MESH)
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#signalingServer} */
    it('Signaling server should not change', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.signalingServer).toEqual(SIGNALING_URL)

          wait(1000).then(() => {
            expect(wg1.signalingServer).toEqual(SIGNALING_URL)
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#autoRejoin} */
    it('autoRejoin should be disabled', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.autoRejoin).toBeFalsy()

          wait(1000).then(() => {
            expect(wg1.autoRejoin).toBeFalsy()
            done()
          })
        }
      }

      wg1.join()
    })

    /** @test {WebGroup#join} */
    it('should join with a specified key', (done) => {
      const key = 'ArtIsLongLifeIsShort'

      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.key).toEqual(key)
          done()
        }
      }

      wg1.join(key)
    })
  })

  /** @test {WebGroup#leave} */
  describe('leave', () => {
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

      wg1.leave()
    })

    /** @test {WebGroup#signalingState} */
    it('Signaling state should be CLOSED', (done) => {
      let called = 0
      wg1.onSignalingStateChange = (state: SignalingState) => {
        called++
        if (state === SignalingState.CLOSED) {
          wait(1000).then(() => {
            expect(called).toEqual(1)
            expect(wg1.signalingState).toEqual(SignalingState.CLOSED)
            done()
          })
        }
      }

      wg1.leave()
    })

    /** @test {WebGroup#state} */
    it('WebGroup state should be LEFT', (done) => {
      let called = 0
      wg1.onStateChange = (state: WebGroupState) => {
        called++
        if (state === WebGroupState.LEFT) {
          wait(1000).then(() => {
            expect(called).toEqual(1)
            expect(wg1.state).toEqual(WebGroupState.LEFT)
            done()
          })
        }
      }

      wg1.leave()
    })

    /** @test {WebGroup#onMemberJoin} */
    it('should NOT be notified about new member', (done) => {
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

      wg1.leave()
    })

    /** @test {WebGroup#onMemberLeave} */
    it('should NOT be notified about left member', (done) => {
      let called1 = 0

      wg1.onMemberLeave = () => called1++
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          wait(1000).then(() => {
            expect(called1).toEqual(0)
            done()
          })
        }
      }

      wg1.leave()
    })

    /** @test {WebGroup#onMessage} */
    it('should NOT receive any message', (done) => {
      let called1 = 0

      wg1.onMessage = () => called1++
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          wait(1000).then(() => {
            expect(called1).toEqual(0)
            done()
          })
        }
      }

      wg1.leave()
    })

    /** @test {WebGroup#members} */
    it('should have no members', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.members).toEqual([])

          wait(1000).then(() => {
            expect(wg1.members).toEqual([])
            done()
          })
        }
      }

      wg1.leave()
    })

    /** @test {WebGroup#myId} */
    it('my id should be 0', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.myId).toEqual(0)

          wait(1000).then(() => {
            expect(wg1.myId).toEqual(0)
            done()
          })
        }
      }

      wg1.leave()
    })

    /** @test {WebGroup#id} */
    it('WebGroup id should be 0', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.id).toEqual(0)

          wait(1000).then(() => {
            expect(wg1.id).toEqual(0)
            done()
          })
        }
      }

      wg1.leave()
    })

    /** @test {WebGroup#key} */
    it('key should be empty', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.key).toEqual('')

          wait(1000).then(() => {
            expect(wg1.key).toEqual('')
            done()
          })
        }
      }

      wg1.leave()
    })

    /** @test {WebGroup#topology} */
    it('topology should not change', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.topology).toEqual(Topology.FULL_MESH)

          wait(1000).then(() => {
            expect(wg1.topology).toEqual(Topology.FULL_MESH)
            done()
          })
        }
      }

      wg1.leave()
    })

    /** @test {WebGroup#signalingServer} */
    it('Signaling server should not change', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.signalingServer).toEqual(SIGNALING_URL)

          wait(1000).then(() => {
            expect(wg1.signalingServer).toEqual(SIGNALING_URL)
            done()
          })
        }
      }

      wg1.leave()
    })

    /** @test {WebGroup#autoRejoin} */
    it('autoRejoin should be disabled', (done) => {
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.autoRejoin).toBeFalsy()

          wait(1000).then(() => {
            expect(wg1.autoRejoin).toBeFalsy()
            done()
          })
        }
      }

      wg1.leave()
    })
  })
})

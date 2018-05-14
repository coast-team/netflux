/// <reference types='jasmine' />

import { SignalingState, Topology, WebGroup, WebGroupState } from '../../src/index.browser'
import { areTheSame, cleanWebGroup, Queue, SIGNALING_URL, wait } from '../util/helper'

const WebGroupOptions = {
  signalingServer: SIGNALING_URL,
  autoRejoin: false,
}

/** @test {WebGroup} */
describe('🙂 🙂 - 2 clients', () => {
  let wg1: WebGroup
  let wg2: WebGroup
  let called1: number
  let called2: number

  /** @test {WebGroup#join} */
  describe('join', () => {
    beforeEach((done) => {
      called1 = 0
      called2 = 0
      wg1 = new WebGroup(WebGroupOptions)
      wg2 = new WebGroup(WebGroupOptions)
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          cleanWebGroup(wg1, wg2)
          wait(500).then(() => done())
        }
      }
      wg1.join()
    })

    afterEach(() => {
      cleanWebGroup(wg1, wg2)
      wg1.leave()
      wg2.leave()
    })

    /** @test {WebGroup#onSignalingStateChange} */
    it('should change the Signaling state', (done) => {
      const states: SignalingState[] = []
      const expected = [
        SignalingState.CONNECTING,
        SignalingState.OPEN,
        SignalingState.CHECKING,
        SignalingState.CHECKED,
        SignalingState.CHECKING,
        SignalingState.CHECKED,
      ]

      // Code for peer 2
      wg2.onSignalingStateChange = (state: SignalingState) => {
        states.push(state)
        called2++
        if (called2 === expected.length) {
          wait(1000).then(() => {
            expect(called2).toEqual(expected.length)
            expect(states).toEqual(expected)
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#signalingState} */
    it('Signaling state should be CHECKED', (done) => {
      wg2.onSignalingStateChange = (state: SignalingState) => {
        called2++
        if (called2 === 6) {
          wait(1000).then(() => {
            expect(wg1.signalingState).toEqual(SignalingState.CHECKED)
            expect(wg2.signalingState).toEqual(SignalingState.CHECKED)
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#onStateChange} */
    it('should change the WebGroup state', (done) => {
      const states: WebGroupState[] = []
      const expected = [WebGroupState.JOINING, WebGroupState.JOINED]

      // Code for peer 1
      wg1.onStateChange = () => called1++

      // Code for peer 2
      wg2.onStateChange = (state: WebGroupState) => {
        states.push(state)
        called2++
        if (called2 === expected.length) {
          wait(1000).then(() => {
            expect(called1).toEqual(0)
            expect(called2).toEqual(2)
            expect(states).toEqual(expected)
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#state} */
    it('WebGroup state should be JOINED', (done) => {
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          wait(1000).then(() => {
            expect(wg1.state).toEqual(WebGroupState.JOINED)
            expect(wg2.state).toEqual(WebGroupState.JOINED)
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#onMemberJoin} */
    it('should be notified about new member', (done) => {
      const queue = new Queue(2, () => {
        wait(1000).then(() => {
          expect(called1).toEqual(1)
          expect(called2).toEqual(1)
          done()
        })
      })

      // Code for peer 1
      wg1.onMemberJoin = (id) => {
        expect(id).toEqual(wg2.myId)
        called1++
        queue.done()
      }

      // Code for peer 2
      wg2.onMemberJoin = (id) => {
        expect(id).toEqual(wg1.myId)
        called2++
        queue.done()
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#onMemberLeave} */
    it('should NOT be notified about left member', (done) => {
      // Code for peer 1
      wg1.onMemberLeave = () => called1++

      // Code for peer 2
      wg2.onMemberLeave = () => called2++
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          wait(1000).then(() => {
            expect(called1).toEqual(0)
            expect(called2).toEqual(0)
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#onMessage} */
    it('should NOT receive any message', (done) => {
      // Code for peer 1
      wg1.onMessage = () => called1++

      // Code for peer 2
      wg2.onMessage = () => called2++
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          wait(1000).then(() => {
            expect(called1).toEqual(0)
            expect(called2).toEqual(0)
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#members} */
    it('should have 2 members', (done) => {
      const queue = new Queue(3, () => {
        wait(1000).then(() => {
          const expected = [wg1.myId, wg2.myId]
          expect(areTheSame(wg1.members, expected)).toBeTruthy()
          expect(areTheSame(wg2.members, expected)).toBeTruthy()
          done()
        })
      })

      // Code for peer 1
      wg1.onMemberJoin = () => {
        expect(areTheSame(wg1.members, [wg1.myId, wg2.myId])).toBeTruthy()
        queue.done()
      }

      // Code for peer 2
      wg2.onMemberJoin = () => {
        expect(areTheSame(wg2.members, [wg1.myId, wg2.myId])).toBeTruthy()
        queue.done()
      }
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(areTheSame(wg2.members, [wg1.myId, wg2.myId])).toBeTruthy()
          queue.done()
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#myId} */
    it("first client's id should not change and second client's id should not be 0", (done) => {
      const wg1myId = wg1.myId
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.myId).toEqual(wg1myId)
          expect(wg2.myId).not.toEqual(0)

          wait(1000).then(() => {
            expect(wg1.myId).toEqual(wg1myId)
            expect(wg2.myId).not.toEqual(0)
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#id} */
    it('WebGroup id should not change, should be the same and not 0', (done) => {
      const wg1id = wg1.id
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.id).toEqual(wg1id)
          expect(wg2.id).toEqual(wg1.id)
          expect(wg2.id).not.toEqual(0)

          wait(1000).then(() => {
            expect(wg1.id).toEqual(wg1id)
            expect(wg2.id).toEqual(wg1.id)
            expect(wg2.id).not.toEqual(0)
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#key} */
    it('key should not change, should be the same and not empty', (done) => {
      const key = wg1.key
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.key).toEqual(key)
          expect(wg2.key).toEqual(wg1.key)
          expect(wg2.key).not.toEqual('')

          wait(1000).then(() => {
            expect(wg1.key).toEqual(key)
            expect(wg2.key).toEqual(wg1.key)
            expect(wg2.key).not.toEqual('')
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#topology} */
    it('topology should not change', (done) => {
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.topology).toEqual(Topology.FULL_MESH)
          expect(wg2.topology).toEqual(Topology.FULL_MESH)

          wait(1000).then(() => {
            expect(wg1.topology).toEqual(Topology.FULL_MESH)
            expect(wg2.topology).toEqual(Topology.FULL_MESH)
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#signalingServer} */
    it('Signaling server should not change', (done) => {
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.signalingServer).toEqual(SIGNALING_URL)
          expect(wg2.signalingServer).toEqual(SIGNALING_URL)

          wait(1000).then(() => {
            expect(wg1.signalingServer).toEqual(SIGNALING_URL)
            expect(wg2.signalingServer).toEqual(SIGNALING_URL)
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#autoRejoin} */
    it('autoRejoin should be disabled', (done) => {
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg1.autoRejoin).toBeFalsy()
          expect(wg2.autoRejoin).toBeFalsy()

          wait(1000).then(() => {
            expect(wg1.autoRejoin).toBeFalsy()
            expect(wg2.autoRejoin).toBeFalsy()
            done()
          })
        }
      }

      wg2.join(wg1.key)
    })

    /** @test {WebGroup#join} */
    it('should join with a specified key', (done) => {
      const queue = new Queue(3, () => {
        wg.leave()
        done()
      })
      const key = 'ArtIsLongLifeIsShort'
      const wg = new WebGroup(WebGroupOptions)

      // Code for peer 1
      wg.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          wg2.join(key)
        }
      }
      wg.onMemberJoin = () => queue.done()

      // Code for peer 2
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          expect(wg.key).toEqual(key)
          expect(wg2.key).toEqual(key)
          queue.done()
        }
      }
      wg2.onMemberJoin = () => queue.done()

      wg.join(key)
    })
  })

  describe('should send/receive', () => {
    beforeEach((done) => {
      called1 = 0
      called2 = 0
      const queue = new Queue(3, () => {
        cleanWebGroup(wg1, wg2)
        wait(500).then(() => done())
      })
      wg1 = new WebGroup(WebGroupOptions)
      wg2 = new WebGroup(WebGroupOptions)
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          wg2.join(wg1.key)
        }
      }
      wg1.onMemberJoin = () => queue.done()
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          queue.done()
        }
      }
      wg2.onMemberJoin = () => queue.done()
      wg1.join()
    })

    afterEach(() => {
      cleanWebGroup(wg1, wg2)
      wg1.leave()
      wg2.leave()
    })

    /** @test {WebGroup#send} */
    it('broadcast String', (done) => {
      const msg1 = 'Art is long, life is short2'
      const msg2 = 'Do or do not, there is no try2'

      // Code for peer 1
      wg1.onMessage = (id, msg) => {
        expect(id).toEqual(wg2.myId)
        expect(msg).toEqual(msg2)
        wg1.send(msg1)
        called1++
      }

      // Code for peer 2
      wg2.onMessage = (id, msg) => {
        expect(id).toEqual(wg1.myId)
        expect(msg).toEqual(msg1)
        called2++
        wait(1000).then(() => {
          expect(called1).toEqual(1)
          expect(called2).toEqual(1)
          done()
        })
      }

      wg2.send(msg2)
    })

    /** @test {WebGroup#send} */
    it('broadcast ArrayBuffer', (done) => {
      const msg1 = new Uint8Array([42, 347, 248247, 583, 10, 8, 9623])
      const msg2 = new Uint8Array([845, 4, 798240, 3290, 553, 1, 398539857, 84])

      // Code for peer 1
      wg1.onMessage = (id, msg) => {
        expect(id).toEqual(wg2.myId)
        expect(msg instanceof Uint8Array)
        expect(msg).toEqual(msg2)
        wg1.send(msg1)
        called1++
      }

      // Code for peer 2
      wg2.onMessage = (id, msg) => {
        expect(id).toEqual(wg1.myId)
        expect(msg instanceof Uint8Array)
        expect(msg).toEqual(msg1)
        called2++
        wait(1000).then(() => {
          expect(called1).toEqual(1)
          expect(called2).toEqual(1)
          done()
        })
      }

      wg2.send(msg2)
    })

    /** @test {WebGroup#sendTo} */
    it('private String', (done) => {
      const msg1 = 'Art is long, life is short'
      const msg2 = 'Do or do not, there is no try'

      // Code for peer 1
      wg1.onMessage = (id, msg) => {
        expect(id).toEqual(wg2.myId)
        expect(msg).toEqual(msg2)
        wg1.sendTo(wg2.myId, msg1)
        called1++
      }

      // Code for peer 2
      wg2.onMessage = (id, msg) => {
        expect(id).toEqual(wg1.myId)
        expect(msg).toEqual(msg1)
        called2++
        wait(1000).then(() => {
          expect(called1).toEqual(1)
          expect(called2).toEqual(1)
          done()
        })
      }

      wg2.sendTo(wg1.myId, msg2)
    })

    /** @test {WebGroup#sendTo} */
    it('private ArrayBuffer', (done) => {
      const msg1 = new Uint8Array([42, 347, 248247, 583, 10, 8, 9623])
      const msg2 = new Uint8Array([845, 4, 798240, 3290, 553, 1, 398539857, 84])

      // Code for peer 1
      wg1.onMessage = (id, msg) => {
        expect(id).toEqual(wg2.myId)
        expect(msg instanceof Uint8Array)
        expect(msg).toEqual(msg2)
        wg1.sendTo(wg2.myId, msg1)
        called1++
      }

      // Code for peer 2
      wg2.onMessage = (id, msg) => {
        expect(id).toEqual(wg1.myId)
        expect(msg instanceof Uint8Array)
        expect(msg).toEqual(msg1)
        called2++
        wait(1000).then(() => {
          expect(called1).toEqual(1)
          expect(called2).toEqual(1)
          done()
        })
      }

      // Start sending message
      wg2.sendTo(wg1.myId, msg2)
    })
  })

  /** @test {WebGroup#leave} */
  describe('leave', () => {
    beforeEach((done) => {
      called1 = 0
      called2 = 0
      const queue = new Queue(3, () => {
        cleanWebGroup(wg1, wg2)
        wait(500).then(() => done())
      })
      wg1 = new WebGroup(WebGroupOptions)
      wg2 = new WebGroup(WebGroupOptions)
      wg1.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          wg2.join(wg1.key)
        }
      }
      wg1.onMemberJoin = () => queue.done()
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          queue.done()
        }
      }
      wg2.onMemberJoin = () => queue.done()
      wg1.join()
    })

    afterEach(() => {
      cleanWebGroup(wg1, wg2)
      wg1.leave()
      wg2.leave()
    })

    /** @test {WebGroup#onMemberLeave} */
    it(
      'should be notified about left member',
      (done) => {
        const wg2peerId = wg2.myId
        const queue = new Queue(2, () => {
          wait(1000).then(() => {
            expect(called1).toEqual(1)
            expect(called2).toEqual(1)
            done()
          })
        })

        // Code for peer 1
        wg1.onMemberLeave = (id) => {
          expect(id).toEqual(wg2peerId)
          called1++
          queue.done()
        }

        // Code for peer 2
        wg2.onMemberLeave = (id) => {
          expect(id).toEqual(wg1.myId)
          called2++
          queue.done()
        }

        wg2.leave()
      },
      12000
    )

    /** @test {WebGroup#onStateChange} */
    it(
      'should change the WebGroup state of the second client only',
      (done) => {
        // Code for peer 1
        wg1.onStateChange = (state: WebGroupState) => called1++

        // Code for peer 2
        wg2.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.LEFT) {
            called2++
            wait(1000).then(() => {
              expect(called1).toEqual(0)
              expect(called2).toEqual(1)
              expect(wg2.state).toEqual(WebGroupState.LEFT)
              done()
            })
          }
        }

        wg2.leave()
      },
      12000
    )

    /** @test {WebGroup#state} */
    it('WebGroup state of the first client should be JOINED and of the second should be LEFT', (done) => {
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          wait(1000).then(() => {
            expect(wg1.state).toEqual(WebGroupState.JOINED)
            expect(wg2.state).toEqual(WebGroupState.LEFT)
            done()
          })
        }
      }

      wg2.leave()
    })

    /** @test {WebGroup#onSignalingStateChange} */
    it(
      'should change the Signaling state',
      (done) => {
        // Code for peer 2
        wg2.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.CLOSED) {
            called2++
            wait(1000).then(() => {
              expect(called2).toEqual(1)
              expect(wg2.signalingState).toEqual(SignalingState.CLOSED)
              done()
            })
          }
        }

        wg2.leave()
      },
      12000
    )

    /** @test {WebGroup#signalingState} */
    it('Signaling state of the first client should not be CLOSED and of the second should be CLOSED', (done) => {
      wg2.onSignalingStateChange = (state: SignalingState) => {
        if (state === SignalingState.CLOSED) {
          wait(1000).then(() => {
            expect(wg1.signalingState).not.toEqual(SignalingState.CLOSED)
            expect(wg2.signalingState).toEqual(SignalingState.CLOSED)
            done()
          })
        }
      }

      wg2.leave()
    })

    /** @test {WebGroup#onMemberLeave} */
    it('should NOT be notified about joined member', (done) => {
      // Code for peer 1
      wg1.onMemberJoin = () => called1++

      // Code for peer 2
      wg2.onMemberJoin = () => called2++
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          wait(1000).then(() => {
            expect(called1).toEqual(0)
            expect(called2).toEqual(0)
            done()
          })
        }
      }

      wg2.leave()
    })

    /** @test {WebGroup#onMessage} */
    it('should NOT receive any message', (done) => {
      // Code for peer 1
      wg1.onMessage = () => called1++

      // Code for peer 2
      wg2.onMessage = () => called2++
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          wait(1000).then(() => {
            expect(called1).toEqual(0)
            expect(called2).toEqual(0)
            done()
          })
        }
      }

      wg2.leave()
    })

    /** @test {WebGroup#members} */
    it('first client should have only him as a member and second client should have no members', (done) => {
      const queue = new Queue(2, () => {
        wait(1000).then(() => {
          expect(wg1.members).toEqual([wg1.myId])
          expect(wg2.members).toEqual([])
          done()
        })
      })
      // Code for peer 1
      wg1.onMemberLeave = () => {
        expect(wg1.members).toEqual([wg1.myId])
        queue.done()
      }

      // Code for peer 2
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg2.members).toEqual([])
          queue.done()
        }
      }

      wg2.leave()
    })

    /** @test {WebGroup#myId} */
    it('the id of the first client should NOT be 0 and of second should be 0', (done) => {
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.myId).not.toEqual(0)
          expect(wg2.myId).toEqual(0)

          wait(1000).then(() => {
            expect(wg1.myId).not.toEqual(0)
            expect(wg2.myId).toEqual(0)
            done()
          })
        }
      }

      wg2.leave()
    })

    /** @test {WebGroup#id} */
    it('WebGroup id of the first client should NOT be 0 and of second should be 0', (done) => {
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.id).not.toEqual(0)
          expect(wg2.id).toEqual(0)

          wait(1000).then(() => {
            expect(wg1.id).not.toEqual(0)
            expect(wg2.id).toEqual(0)
            done()
          })
        }
      }

      wg2.leave()
    })

    /** @test {WebGroup#key} */
    it('key of the first client should NOT be empty and of second should be empty', (done) => {
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.key).not.toEqual('')
          expect(wg2.key).toEqual('')

          wait(1000).then(() => {
            expect(wg1.key).not.toEqual('')
            expect(wg2.key).toEqual('')
            done()
          })
        }
      }

      wg2.leave()
    })

    /** @test {WebGroup#topology} */
    it('topology should not change', (done) => {
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.topology).toEqual(Topology.FULL_MESH)
          expect(wg2.topology).toEqual(Topology.FULL_MESH)

          wait(1000).then(() => {
            expect(wg1.topology).toEqual(Topology.FULL_MESH)
            expect(wg2.topology).toEqual(Topology.FULL_MESH)
            done()
          })
        }
      }

      wg2.leave()
    })

    /** @test {WebGroup#signalingServer} */
    it('Signaling server should not change', (done) => {
      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.signalingServer).toEqual(SIGNALING_URL)
          expect(wg2.signalingServer).toEqual(SIGNALING_URL)

          wait(1000).then(() => {
            expect(wg1.signalingServer).toEqual(SIGNALING_URL)
            expect(wg2.signalingServer).toEqual(SIGNALING_URL)
            done()
          })
        }
      }

      wg2.leave()
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

      wg2.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.LEFT) {
          expect(wg1.autoRejoin).toBeFalsy()
          expect(wg2.autoRejoin).toBeFalsy()

          wait(1000).then(() => {
            expect(wg1.autoRejoin).toBeFalsy()
            expect(wg2.autoRejoin).toBeFalsy()
            done()
          })
        }
      }

      wg2.leave()
    })
  })
})

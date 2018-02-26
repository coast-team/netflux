/// <reference types='jasmine' />
/* tslint:disable:one-variable-per-declaration */
import { SignalingState, WebGroup, WebGroupState } from '../../src/index.browser'
import {
  areTheSame,
  cleanWebGroup,
  IMessages,
  Queue,
  SIGNALING_URL, wait } from '../util/helper'

const WebGroupOptions = {
  signalingServer: SIGNALING_URL,
  autoRejoin: false,
}

/** @test {WebGroup} */
describe('3 members', () => {
  describe('🙂 🙂 🙂', () => {
    let wg1: WebGroup, wg2: WebGroup, wg3: WebGroup
    let called1: number, called2: number, called3: number

    /** @test {WebGroup#join} */
    describe('joining', () => {

      beforeEach ((done) => {
        called1 = 0
        called2 = 0
        called3 = 0
        const queue = new Queue(4)
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          cleanWebGroup(wg3)
          done()
        })
        wg1 = new WebGroup(WebGroupOptions)
        wg2 = new WebGroup(WebGroupOptions)
        wg3 = new WebGroup(WebGroupOptions)
        wg1.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            wg2.join(wg1.key)
          }
        }
        wg1.onMemberJoin = () => queue.pop()
        wg2.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            queue.pop()
          }
        }
        wg2.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            queue.pop()
          }
        }
        wg2.onMemberJoin = () => queue.pop()
        wg1.join()
      })

      afterEach ((done) => {
        cleanWebGroup(wg1)
        cleanWebGroup(wg2)
        cleanWebGroup(wg3)
        const queue = new Queue(3)
        if (wg1.state !== WebGroupState.LEFT) {
          wg1.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              queue.pop()
            }
          }
          wg1.leave()
        } else {
          queue.pop()
        }
        if (wg2.state !== WebGroupState.LEFT) {
          wg2.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              queue.pop()
            }
          }
          wg2.leave()
        } else {
          queue.pop()
        }
        if (wg3.state !== WebGroupState.LEFT) {
          wg3.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              queue.pop()
            }
          }
          wg3.leave()
        } else {
          queue.pop()
        }
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          cleanWebGroup(wg3)
          done()
        })
      })

      /** @test {WebGroup#onSignalingStateChange} */
      it('should change the Signaling state', (done) => {
        const states: SignalingState[] = []
        const expectedStates = [SignalingState.CONNECTING, SignalingState.CONNECTED, SignalingState.STABLE]

        // Code for peer 1
        wg1.onSignalingStateChange = () => called1++

        // Code for peer 2
        wg2.onSignalingStateChange = () => called2++

        // Code for peer 3
        wg3.onSignalingStateChange = (state: SignalingState) => {
          states.push(state)
          called3++
          if (state === SignalingState.STABLE) {
            wait(1000).then(() => {
              expect(called1).toEqual(0)
              expect(called2).toEqual(0)
              expect(called3).toEqual(3)
              expect(states).toEqual(expectedStates)
              expect(wg3.signalingState).toEqual(SignalingState.STABLE)
              done()
            })
          }
        }

        // Start joining
        wg3.join(wg1.key)
      })

      /** @test {WebGroup#onStateChange} */
      it('should change the WebGroup state', (done) => {
        const states: WebGroupState[] = []
        const expectedStates = [WebGroupState.JOINING, WebGroupState.JOINED]

        // Code for peer 1
        wg1.onStateChange = () => called1++

        // Code for peer 2
        wg2.onStateChange = () => called2++

        // Code for peer 3
        wg3.onStateChange = (state: WebGroupState) => {
          states.push(state)
          called3++
          if (state === WebGroupState.JOINED) {
            wait(1000).then(() => {
              expect(called1).toEqual(0)
              expect(called2).toEqual(0)
              expect(called3).toEqual(2)
              expect(states).toEqual(expectedStates)
              expect(wg3.state).toEqual(WebGroupState.JOINED)
              done()
            })
          }
        }

        // Start joining
        wg3.join(wg1.key)
      })

      /** @test {WebGroup#onMemberJoin} */
      it('should be notified about new member', (done) => {
        const members3: number[] = []
        const expectedMembers3 = [wg1.myId, wg2.myId]
        const queue = new Queue(3)
        queue.wait()
          .then(() => wait(1000))
          .then(() => {
            expect(called1).toEqual(1)
            expect(called2).toEqual(1)
            expect(called3).toEqual(2)
            expect(areTheSame(members3, expectedMembers3)).toBeTruthy()
            done()
          })

        // Code for peer 1
        wg1.onMemberJoin = (id) => {
          expect(id).toEqual(wg3.myId)
          called1++
          queue.pop()
        }

        // Code for peer 2
        wg2.onMemberJoin = (id) => {
          expect(id).toEqual(wg3.myId)
          called2++
          queue.pop()
        }

        // Code for peer 3
        wg3.onMemberJoin = (id) => {
          members3.push(id)
          called3++
          if (called3 === 2) {
            queue.pop()
          }
        }

        // Start joining
        wg3.join(wg1.key)
      })

      it('should have the same members, key, WebGroup id, topology once joined', (done) => {
        const queue = new Queue(3)
        queue.wait()
          .then(() => wait(1000))
          .then(() => {
            expect(areTheSame(wg3.members, wg1.members)).toBeTruthy()
            expect(areTheSame(wg3.members, wg2.members)).toBeTruthy()
            expect(wg3.id).toEqual(wg1.id)
            expect(wg3.key).toEqual(wg1.key)
            expect(wg3.topology).toEqual(wg1.topology)
            done()
          })

        // Code for peer 1
        wg1.onMemberJoin = () => queue.pop()

        // Code for peer 2
        wg2.onMemberJoin = () => queue.pop()

        // Code for peer 3
        wg3.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            expect(wg3.members.length).toEqual(3)
            expect(wg3.members.includes(wg1.myId)).toBeTruthy()
            expect(wg3.members.includes(wg2.myId)).toBeTruthy()
            expect(wg3.members.includes(wg3.myId)).toBeTruthy()
            expect(wg3.id).toEqual(wg1.id)
            expect(wg3.key).toEqual(wg1.key)
            expect(wg3.topology).toEqual(wg1.topology)
            queue.pop()
          }
        }

        // Start joining
        wg3.join(wg1.key)
      })
    })

    describe('should send/receive', () => {

      beforeEach ((done) => {
        called1 = 0
        called2 = 0
        called3 = 0
        const queue = new Queue(9)
        wg1 = new WebGroup(WebGroupOptions)
        wg2 = new WebGroup(WebGroupOptions)
        wg3 = new WebGroup(WebGroupOptions)
        wg1.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            wg2.join(wg1.key)
          }
        }
        wg1.onMemberJoin = () => queue.pop()
        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            queue.pop()
          }
        }
        wg2.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            queue.pop()
          }
        }
        wg2.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            wg3.join(wg1.key)
          }
        }
        wg2.onMemberJoin = () => queue.pop()
        wg3.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            queue.pop()
          }
        }
        wg3.onMemberJoin = () => queue.pop()

        wg1.join()
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          cleanWebGroup(wg3)
          done()
        })
      })

      afterEach ((done) => {
        cleanWebGroup(wg1)
        cleanWebGroup(wg2)
        cleanWebGroup(wg3)
        const queue = new Queue(3)
        if (wg1.state !== WebGroupState.LEFT) {
          wg1.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              queue.pop()
            }
          }
          wg1.leave()
        } else {
          queue.pop()
        }
        if (wg2.state !== WebGroupState.LEFT) {
          wg2.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              queue.pop()
            }
          }
          wg2.leave()
        } else {
          queue.pop()
        }
        if (wg3.state !== WebGroupState.LEFT) {
          wg3.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              queue.pop()
            }
          }
          wg3.leave()
        } else {
          queue.pop()
        }
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          cleanWebGroup(wg3)
          done()
        })
      })

      /** @test {WebGroup#send} */
      it('broadcast String', (done) => {
        const queue = new Queue(6)
        queue.wait()
          .then(() => wait(1000))
          .then(() => {
            expect(called1).toEqual(2)
            expect(called2).toEqual(2)
            expect(called3).toEqual(2)
            expect(areTheSame(messages1.ids, [wg2.myId, wg3.myId])).toBeTruthy()
            expect(areTheSame(messages1.msgs, [msg2, msg3])).toBeTruthy()
            expect(areTheSame(messages2.ids, [wg1.myId, wg3.myId])).toBeTruthy()
            expect(areTheSame(messages2.msgs, [msg1, msg3])).toBeTruthy()
            expect(areTheSame(messages3.ids, [wg2.myId, wg1.myId])).toBeTruthy()
            expect(areTheSame(messages3.msgs, [msg2, msg1])).toBeTruthy()
            done()
          })
        const msg1 = 'Art is long, life is short'
        const msg2 = 'Do or do not, there is no try'
        const msg3 = 'Never say never'
        const messages1: IMessages = {ids: [], msgs: []}
        const messages2: IMessages  = {ids: [], msgs: []}
        const messages3: IMessages  = {ids: [], msgs: []}

        // Code for peer 1
        wg1.onMessage = (id, msg) => {
          messages1.ids.push(id)
          messages1.msgs.push(msg)
          called1++
          queue.pop()
        }

        // Code for peer 2
        wg2.onMessage = (id, msg) => {
          messages2.ids.push(id)
          messages2.msgs.push(msg)
          called2++
          queue.pop()
        }

        // Code for peer 3
        wg3.onMessage = (id, msg) => {
          messages3.ids.push(id)
          messages3.msgs.push(msg)
          called3++
          queue.pop()
        }

        // Start sending message
        wg1.send(msg1)
        wg2.send(msg2)
        wg3.send(msg3)
      })

      /** @test {WebGroup#send} */
      it('broadcast ArrayBuffer', (done) => {
        const queue = new Queue(6)
        queue.wait()
          .then(() => wait(1000))
          .then(() => {
            expect(called1).toEqual(2)
            expect(called2).toEqual(2)
            expect(called3).toEqual(2)
            expect(areTheSame(messages1.ids, [wg2.myId, wg3.myId])).toBeTruthy()
            expect(areTheSame(messages1.msgs, [msg2, msg3])).toBeTruthy()
            expect(areTheSame(messages2.ids, [wg1.myId, wg3.myId])).toBeTruthy()
            expect(areTheSame(messages2.msgs, [msg1, msg3])).toBeTruthy()
            expect(areTheSame(messages3.ids, [wg2.myId, wg1.myId])).toBeTruthy()
            expect(areTheSame(messages3.msgs, [msg2, msg1])).toBeTruthy()
            done()
          })
        const msg1 = new Uint8Array([42, 347, 248247, 583, 10, 8, 9623])
        const msg2 = new Uint8Array([845, 4, 798240, 3290, 553, 1, 398539857, 84])
        const msg3 = new Uint8Array([84, 79, 240, 30, 53, 3, 339857, 44])
        const messages1: IMessages  = {ids: [], msgs: []}
        const messages2: IMessages  = {ids: [], msgs: []}
        const messages3: IMessages  = {ids: [], msgs: []}

        // Code for peer 1
        wg1.onMessage = (id, msg) => {
          expect(msg instanceof Uint8Array).toBeTruthy()
          messages1.ids.push(id)
          messages1.msgs.push(msg)
          called1++
          queue.pop()
        }

        // Code for peer 2
        wg2.onMessage = (id, msg) => {
          expect(msg instanceof Uint8Array).toBeTruthy()
          messages2.ids.push(id)
          messages2.msgs.push(msg)
          called2++
          queue.pop()
        }

        // Code for peer 3
        wg3.onMessage = (id, msg) => {
          expect(msg instanceof Uint8Array).toBeTruthy()
          messages3.ids.push(id)
          messages3.msgs.push(msg)
          called3++
          queue.pop()
        }

        // Start sending message
        wg1.send(msg1)
        wg2.send(msg2)
        wg3.send(msg3)
      })

      /** @test {WebGroup#sendTo} */
      it('private String', (done) => {
        const queue = new Queue(6)
        queue.wait()
          .then(() => wait(1000))
          .then(() => {
            expect(called1).toEqual(2)
            expect(called2).toEqual(2)
            expect(called3).toEqual(2)
            expect(areTheSame(messages1.ids, [wg2.myId, wg3.myId])).toBeTruthy()
            expect(areTheSame(messages1.msgs, [msg2For1, msg3For1])).toBeTruthy()
            expect(areTheSame(messages2.ids, [wg1.myId, wg3.myId])).toBeTruthy()
            expect(areTheSame(messages2.msgs, [msg1For2, msg3For2])).toBeTruthy()
            expect(areTheSame(messages3.ids, [wg2.myId, wg1.myId])).toBeTruthy()
            expect(areTheSame(messages3.msgs, [msg2For3, msg1For3])).toBeTruthy()
            done()
          })
        const msg1For2 = 'Art is long, life is short2'
        const msg1For3 = 'Art is long, life is short3'
        const msg2For1 = 'Do or do not, there is no try1'
        const msg2For3 = 'Do or do not, there is no try3'
        const msg3For1 = 'Never say never1'
        const msg3For2 = 'Never say never2'
        const messages1: IMessages  = {ids: [], msgs: []}
        const messages2: IMessages  = {ids: [], msgs: []}
        const messages3: IMessages  = {ids: [], msgs: []}

        // Code for peer 1
        wg1.onMessage = (id, msg) => {
          messages1.ids.push(id)
          messages1.msgs.push(msg)
          called1++
          queue.pop()
        }

        // Code for peer 2
        wg2.onMessage = (id, msg) => {
          messages2.ids.push(id)
          messages2.msgs.push(msg)
          called2++
          queue.pop()
        }

        // Code for peer 3
        wg3.onMessage = (id, msg) => {
          messages3.ids.push(id)
          messages3.msgs.push(msg)
          called3++
          queue.pop()
        }

        // Start sending message
        wg1.sendTo(wg2.myId, msg1For2)
        wg1.sendTo(wg3.myId, msg1For3)
        wg2.sendTo(wg1.myId, msg2For1)
        wg2.sendTo(wg3.myId, msg2For3)
        wg3.sendTo(wg1.myId, msg3For1)
        wg3.sendTo(wg2.myId, msg3For2)
      })

      /** @test {WebGroup#sendTo} */
      it('private ArrayBuffer', (done) => {
        const queue = new Queue(6)
        queue.wait()
          .then(() => wait(1000))
          .then(() => {
            expect(called1).toEqual(2)
            expect(called2).toEqual(2)
            expect(called3).toEqual(2)
            expect(areTheSame(messages1.ids, [wg2.myId, wg3.myId])).toBeTruthy()
            expect(areTheSame(messages1.msgs, [msg2For1, msg3For1])).toBeTruthy()
            expect(areTheSame(messages2.ids, [wg1.myId, wg3.myId])).toBeTruthy()
            expect(areTheSame(messages2.msgs, [msg1For2, msg3For2])).toBeTruthy()
            expect(areTheSame(messages3.ids, [wg2.myId, wg1.myId])).toBeTruthy()
            expect(areTheSame(messages3.msgs, [msg2For3, msg1For3])).toBeTruthy()
            done()
          })
        const msg1For2 = new Uint8Array([42, 347, 248247, 583, 10, 8, 2])
        const msg1For3 = new Uint8Array([42, 347, 248247, 583, 10, 8, 3])
        const msg2For1 = new Uint8Array([845, 4, 798240, 3290, 553, 1, 398539857, 1])
        const msg2For3 = new Uint8Array([845, 4, 798240, 3290, 553, 1, 398539857, 3])
        const msg3For1 = new Uint8Array([84, 79, 240, 30, 53, 3, 339857, 1])
        const msg3For2 = new Uint8Array([84, 79, 240, 30, 53, 3, 339857, 2])
        const messages1: IMessages  = {ids: [], msgs: []}
        const messages2: IMessages  = {ids: [], msgs: []}
        const messages3: IMessages  = {ids: [], msgs: []}

        // Code for peer 1
        wg1.onMessage = (id, msg) => {
          expect(msg instanceof Uint8Array).toBeTruthy()
          messages1.ids.push(id)
          messages1.msgs.push(msg)
          called1++
          queue.pop()
        }

        // Code for peer 2
        wg2.onMessage = (id, msg) => {
          expect(msg instanceof Uint8Array).toBeTruthy()
          messages2.ids.push(id)
          messages2.msgs.push(msg)
          called2++
          queue.pop()
        }

        // Code for peer 3
        wg3.onMessage = (id, msg) => {
          expect(msg instanceof Uint8Array).toBeTruthy()
          messages3.ids.push(id)
          messages3.msgs.push(msg)
          called3++
          queue.pop()
        }

        // Start sending message
        wg1.sendTo(wg2.myId, msg1For2)
        wg1.sendTo(wg3.myId, msg1For3)
        wg2.sendTo(wg1.myId, msg2For1)
        wg2.sendTo(wg3.myId, msg2For3)
        wg3.sendTo(wg1.myId, msg3For1)
        wg3.sendTo(wg2.myId, msg3For2)
      })
    })

    // TODO: finish test
    xdescribe('leaving', () => {
      beforeEach ((done) => {
        called1 = 0
        called2 = 0
        called3 = 0
        const queue = new Queue(4)
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          cleanWebGroup(wg3)
          done()
        })
        wg1 = new WebGroup(WebGroupOptions)
        wg2 = new WebGroup(WebGroupOptions)
        wg3 = new WebGroup(WebGroupOptions)
        wg1.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            wg2.join(wg1.key)
          }
        }
        wg1.onMemberJoin = () => queue.pop()
        wg2.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            queue.pop()
          }
        }
        wg2.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            queue.pop()
          }
        }
        wg2.onMemberJoin = () => queue.pop()
        wg1.join()
      })

      afterEach ((done) => {
        cleanWebGroup(wg1)
        cleanWebGroup(wg2)
        cleanWebGroup(wg3)
        const queue = new Queue(3)
        if (wg1.state !== WebGroupState.LEFT) {
          wg1.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              queue.pop()
            }
          }
          wg1.leave()
        } else {
          queue.pop()
        }
        if (wg2.state !== WebGroupState.LEFT) {
          wg2.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              queue.pop()
            }
          }
          wg2.leave()
        } else {
          queue.pop()
        }
        if (wg3.state !== WebGroupState.LEFT) {
          wg3.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              queue.pop()
            }
          }
          wg3.leave()
        } else {
          queue.pop()
        }
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          cleanWebGroup(wg3)
          done()
        })
      })

      /** @test {WebGroup#leave} */
      it('should have no members & an empty key', (done) => {
        const queue = new Queue(1)

        // Code for peer 1
        wg1.onMemberLeave = () => {
          expect(wg1.members.length).toEqual(1)
          expect(wg1.members.includes(wg1.myId)).toBeTruthy()
          queue.pop()
        }

        // Code for peer 2
        wg2.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.LEFT) {
            called2++
            expect(wg2.members.length).toEqual(1)
            expect(wg2.members.includes(wg2.myId)).toBeTruthy()
            expect(wg2.key).toEqual('')
            queue.wait()
              .then(() => wait(1000))
              .then(() => {
                expect(wg1.members.length).toEqual(1)
                expect(wg1.members.includes(wg1.myId)).toBeTruthy()
                expect(wg2.members.length).toEqual(1)
                expect(wg2.members.includes(wg2.myId)).toBeTruthy()
                expect(wg2.key).toEqual('')
                expect(called2).toEqual(1)
                expect(wg2.key).toEqual('')
                done()
              })
          }
        }

        // Start leaving
        wg2.leave()
      })

      /** @test {WebGroup#onMemberLeave} */
      it('should be notified about left member', (done) => {
        const queue = new Queue(2)

        // Code for peer 1
        wg1.onMemberLeave = (id) => {
          expect(id).toEqual(wg2.myId)
          called1++
          queue.pop()
        }

        // Code for peer 2
        wg2.onMemberLeave = (id) => {
          expect(id).toEqual(wg1.myId)
          called2++
          queue.pop()
        }

        // Start leaving
        wg2.leave()

        // When finish test
        queue.wait().then(() => {
          wait(1000).then(() => {
            expect(called1).toEqual(1)
            expect(called2).toEqual(1)
            done()
          })
        })
      })

      /** @test {WebGroup#onStateChange} */
      it('should change the WebGroup state', (done) => {

        // Code for peer 2
        wg2.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.LEFT) {
            called2++
          }
          wait(1000).then(() => {
            expect(called2).toEqual(1)
            expect(wg2.state).toEqual(WebGroupState.LEFT)
            done()
          })
        }

        // Start leaving
        wg2.leave()
      })

      /** @test {WebGroup#onSignalingStateChange} */
      it('should change the Signaling state', (done) => {
        // Code for peer 2
        wg2.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.CLOSED) {
            called2++
          }
          wait(1000).then(() => {
            expect(called2).toEqual(1)
            expect(wg2.signalingState).toEqual(SignalingState.CLOSED)
            done()
          })
        }

        // Start leaving
        wg2.leave()
      })
    })
  })
})

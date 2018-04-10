/// <reference types='jasmine' />
/* tslint:disable:one-variable-per-declaration */
import { SignalingState, WebGroup, WebGroupState } from '../../src/index.browser'
import {} from '../../src/misc/Util'
import {
  areTheSame,
  BOT_URL,
  cleanWebGroup,
  getBotData,
  IBotData,
  Queue,
  SIGNALING_URL,
  wait,
  waitBotJoin,
} from '../util/helper'

const WebGroupOptions = {
  signalingServer: SIGNALING_URL,
  autoRejoin: false,
}

/** @test {WebGroup} */
describe('2 members', () => {
  describe('🙂 🙂', () => {
    let wg1: WebGroup, wg2: WebGroup

    /** @test {WebGroup#join} */
    describe('joining', () => {
      beforeEach((done) => {
        const queue = new Queue(2)
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          done()
        })
        wg1 = new WebGroup(WebGroupOptions)
        wg2 = new WebGroup(WebGroupOptions)
        wg1.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            queue.pop()
          }
        }
        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            queue.pop()
          }
        }
        wg1.join()
      })

      afterEach((done) => {
        cleanWebGroup(wg1)
        cleanWebGroup(wg2)
        const queue = new Queue(2)
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          done()
        })
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
      })

      /** @test {WebGroup#onSignalingStateChange} */
      it('should change the Signaling state', (done) => {
        let called1 = 0,
          called2 = 0
        const states: SignalingState[] = []
        const expectedStates = [
          SignalingState.CONNECTING,
          SignalingState.CONNECTED,
          SignalingState.STABLE,
        ]

        // Code for peer 1
        wg1.onSignalingStateChange = () => called1++

        // Code for peer 2
        wg2.onSignalingStateChange = (state: SignalingState) => {
          states.push(state)
          called2++
          if (called2 === 3) {
            wait(1000).then(() => {
              expect(called1).toEqual(0)
              expect(called2).toEqual(3)
              expect(states).toEqual(expectedStates)
              expect(wg2.signalingState).toEqual(SignalingState.STABLE)
              done()
            })
          }
        }

        // Start joining
        wg2.join(wg1.key)
      })

      /** @test {WebGroup#onStateChange} */
      it('should change the WebGroup state', (done) => {
        let called1 = 0,
          called2 = 0
        const states: WebGroupState[] = []
        const expectedStates = [WebGroupState.JOINING, WebGroupState.JOINED]

        // Code for peer 1
        wg1.onStateChange = () => called1++

        // Code for peer 2
        wg2.onStateChange = (state: WebGroupState) => {
          states.push(state)
          called2++
          if (called2 === 2) {
            wait(1000).then(() => {
              expect(called1).toEqual(0)
              expect(called2).toEqual(2)
              expect(states).toEqual(expectedStates)
              expect(wg2.state).toEqual(WebGroupState.JOINED)
              done()
            })
          }
        }

        // Start joining
        wg2.join(wg1.key)
      })

      /** @test {WebGroup#onMemberJoin} */
      it('should be notified about new member', (done) => {
        let called1 = 0,
          called2 = 0
        const queue = new Queue(1)

        // Code for peer 1
        wg1.onMemberJoin = (id) => {
          expect(id).toEqual(wg2.myId)
          called1++
          queue.pop()
        }

        // Code for peer 2
        wg2.onMemberJoin = (id) => {
          expect(id).toEqual(wg1.myId)
          called2++
        }
        wg2.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            queue
              .wait()
              .then(() => wait(1000))
              .then(() => {
                expect(called1).toEqual(1)
                expect(called2).toEqual(1)
                done()
              })
          }
        }

        // Start joining
        wg2.join(wg1.key)
      })

      it('should have the same members, key, WebGroup id, topology once joined', (done) => {
        const queue = new Queue(1)

        // Code for peer 1
        wg1.onMemberJoin = () => {
          expect(wg1.members.length).toEqual(2)
          expect(wg1.members.includes(wg1.myId)).toBeTruthy()
          expect(wg1.members.includes(wg2.myId)).toBeTruthy()
          queue.pop()
        }

        // Code for peer 2
        wg2.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            expect(wg2.members.length).toEqual(2)
            expect(wg2.members.includes(wg1.myId)).toBeTruthy()
            expect(wg2.members.includes(wg2.myId)).toBeTruthy()
            expect(wg2.id).toEqual(wg1.id)
            expect(wg2.key).toEqual(wg1.key)
            expect(wg2.topology).toEqual(wg1.topology)
            queue
              .wait()
              .then(() => wait(1000))
              .then(() => {
                expect(areTheSame(wg2.members, wg1.members)).toBeTruthy()
                expect(wg2.id).toEqual(wg1.id)
                expect(wg2.key).toEqual(wg1.key)
                expect(wg2.topology).toEqual(wg1.topology)
                done()
              })
          }
        }

        // Start joining
        wg2.join(wg1.key)
      })

      /** @test {WebGroup#join} */
      it('should join with the specified key', (done) => {
        const queue = new Queue(3)
        const key = 'ArtIsLongLifeIsShort'
        const wg = new WebGroup(WebGroupOptions)

        // Code for peer 1
        wg.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            wg2.join(key)
          }
        }
        wg.onMemberJoin = () => queue.pop()

        // Code for peer 2
        wg2.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            expect(wg.key).toEqual(key)
            expect(wg2.key).toEqual(key)
            queue.pop()
          }
        }
        wg2.onMemberJoin = () => queue.pop()

        // Start joining
        wg.join(key)

        queue.wait().then(() => {
          wg.leave()
          done()
        })
      })
    })

    describe('should send/receive', () => {
      let called1: number, called2: number

      beforeEach((done) => {
        called1 = 0
        called2 = 0
        const queue = new Queue(3)
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          done()
        })
        wg1 = new WebGroup(WebGroupOptions)
        wg2 = new WebGroup(WebGroupOptions)
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
        wg2.onMemberJoin = () => queue.pop()
        wg1.join()
      })

      afterEach((done) => {
        cleanWebGroup(wg1)
        cleanWebGroup(wg2)
        const queue = new Queue(2)
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          done()
        })
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
      })

      /** @test {WebGroup#send} */
      it('broadcast String', (done) => {
        const msg1 = 'Art is long, life is short'
        const msg2 = 'Do or do not, there is no try'

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

        // Start sending message
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

        // Start sending message
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

        // Start sending message
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

    describe('leaving', () => {
      let called1: number, called2: number

      beforeEach((done) => {
        called1 = 0
        called2 = 0
        const queue = new Queue(3)
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          done()
        })
        wg1 = new WebGroup(WebGroupOptions)
        wg2 = new WebGroup(WebGroupOptions)
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
        wg2.onMemberJoin = () => queue.pop()
        wg1.join()
      })

      afterEach((done) => {
        cleanWebGroup(wg1)
        cleanWebGroup(wg2)
        const queue = new Queue(2)
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          cleanWebGroup(wg2)
          wait(1000).then(done)
        })
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
      })

      /** @test {WebGroup#leave} */
      it(
        'should have no members & an empty key',
        (done) => {
          const queue = new Queue(2)
          queue
            .wait()
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
              queue.pop()
            }
          }

          // Start leaving
          wg2.leave()
        },
        12000
      )

      /** @test {WebGroup#onMemberLeave} */
      it(
        'should be notified about left member',
        (done) => {
          const queue = new Queue(2)
          queue.wait().then(() => {
            wait(1000).then(() => {
              expect(called1).toEqual(1)
              expect(called2).toEqual(1)
              done()
            })
          })

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
        },
        12000
      )

      /** @test {WebGroup#onStateChange} */
      it(
        'should change the WebGroup state',
        (done) => {
          const states: WebGroupState[] = []
          const expectedStates = [WebGroupState.LEAVING, WebGroupState.LEFT]
          // Code for peer 2
          wg2.onStateChange = (state: WebGroupState) => {
            states.push(state)
            called2++
            if (state === WebGroupState.LEFT) {
              wait(1000).then(() => {
                expect(called2).toEqual(2)
                expect(states).toEqual(expectedStates)
                done()
              })
            }
          }

          // Start leaving
          wg2.leave()
        },
        12000
      )

      /** @test {WebGroup#onSignalingStateChange} */
      it(
        'should change the Signaling state',
        (done) => {
          const states: SignalingState[] = []
          const expectedStates = [SignalingState.CLOSING, SignalingState.CLOSED]
          // Code for peer 2
          wg2.onSignalingStateChange = (state: SignalingState) => {
            states.push(state)
            called2++
            if (state === SignalingState.CLOSED) {
              wait(1000).then(() => {
                expect(called2).toEqual(2)
                expect(states).toEqual(expectedStates)
                done()
              })
            }
          }

          // Start leaving
          wg2.leave()
        },
        12000
      )
    })
  })

  describe('🙂 🤖', () => {
    let wg1: WebGroup

    /** @test {WebGroup#invite} */
    describe('inviting', () => {
      beforeEach(() => (wg1 = new WebGroup(WebGroupOptions)))

      afterEach((done) => {
        cleanWebGroup(wg1)
        if (wg1.state !== WebGroupState.LEFT) {
          wg1.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              cleanWebGroup(wg1)
              done()
            }
          }
          wg1.leave()
        } else {
          cleanWebGroup(wg1)
          done()
        }
      })

      /** @test {WebGroup#onSignalingStateChange} */
      it('should not change the Signaling state', (done) => {
        // Code for peer 1
        wg1.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            // Start inviting
            wg1.invite(BOT_URL)

            // Check bot data
            waitBotJoin(wg1.id)
              .then(() => wait(1000))
              .then(() => getBotData(wg1.id))
              .then((data) => {
                expect(data.onSignalingStateCalled).toEqual(0)
                expect(data.signalingState).toEqual(SignalingState.CLOSED)
                done()
              })
          }
        }

        // Start joining
        wg1.join()
      })

      /** @test {WebGroup#onStateChange} */
      it('should change the WebGroup state', (done) => {
        // Code for peer 1
        wg1.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            // Start inviting
            wg1.invite(BOT_URL)

            // Check bot data
            waitBotJoin(wg1.id)
              .then(() => wait(1000))
              .then(() => getBotData(wg1.id))
              .then((data) => {
                expect(data.state).toEqual(WebGroupState.JOINED)
                done()
              })
              .catch(fail)
          }
        }

        // Start joining
        wg1.join()
      })

      /** @test {WebGroup#onMemberJoin} */
      it('should be notified about new member', (done) => {
        let called1 = 0

        // Code for peer 1
        wg1.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            // Start inviting
            wg1.invite(BOT_URL)
          }
        }

        wg1.onMemberJoin = (id: number) => {
          called1++
          // Check bot data
          waitBotJoin(wg1.id)
            .then(() => wait(1000))
            .then(() => getBotData(wg1.id))
            .then((bot: IBotData) => {
              expect(id).toEqual(bot.myId)
              expect(bot.onMemberJoinCalled).toEqual(1)
              expect(bot.joinedMembers.length).toEqual(1)
              expect(bot.joinedMembers[0]).toEqual(wg1.myId)
              expect(called1).toEqual(1)
              done()
            })
            .catch(fail)
        }

        // Start joining
        wg1.join()
      })

      it('should have the same members, WebGroup id, topology once joined', (done) => {
        // Code for peer 1
        wg1.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            // Start inviting
            wg1.invite(BOT_URL)
          }
        }

        wg1.onMemberJoin = () => {
          // Check bot data
          waitBotJoin(wg1.id)
            .then(() => wait(1000))
            .then(() => getBotData(wg1.id))
            .then((bot: IBotData) => {
              expect(areTheSame(bot.members, wg1.members)).toBeTruthy()
              expect(bot.key).toEqual('')
              expect(bot.topology).toEqual(wg1.topology)
              expect(bot.id).toEqual(wg1.id)
              done()
            })
            .catch(fail)
        }

        // Start joining
        wg1.join()
      })
    })

    describe('should send/receive', () => {
      let called1: number

      beforeEach((done) => {
        called1 = 0
        const queue = new Queue(3)
        queue.wait().then(() => {
          cleanWebGroup(wg1)
          done()
        })
        wg1 = new WebGroup(WebGroupOptions)
        wg1.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            queue.pop()
          }
        }
        wg1.onMemberJoin = () => queue.pop()
        wg1.onSignalingStateChange = (state: SignalingState) => {
          if (state === SignalingState.STABLE) {
            // Start inviting
            wg1.invite(BOT_URL)
          }
        }
        waitBotJoin(wg1.id).then(() => queue.pop())

        wg1.join()
      })

      afterEach((done) => {
        cleanWebGroup(wg1)
        if (wg1.state !== WebGroupState.LEFT) {
          wg1.onStateChange = (state: WebGroupState) => {
            if (state === WebGroupState.LEFT) {
              cleanWebGroup(wg1)
              done()
            }
          }
          wg1.leave()
        } else {
          cleanWebGroup(wg1)
          done()
        }
      })

      /** @test {WebGroup#send} */
      it('broadcast String', (done) => {
        const msg1 = 'sendArt is long, life is short'
        const msgBot = 'bot: ' + msg1

        // Code for peer 1
        wg1.onMessage = (id, msg) => {
          called1++
          expect(msg).toEqual(msgBot)

          // Check bot data
          wait(1000)
            .then(() => getBotData(wg1.id))
            .then((bot: IBotData) => {
              expect(called1).toEqual(1)
              expect(id).toEqual(bot.myId)
              expect(bot.onMessageToBeCalled).toEqual(1)
              expect(bot.messages[0].msg).toEqual(msg1)
              expect(bot.messages[0].id).toEqual(wg1.myId)
              done()
            })
            .catch(fail)
        }

        // Start sending message
        wg1.send(msg1)
      })

      /** @test {WebGroup#send} */
      it('broadcast ArrayBuffer', (done) => {
        const msg1 = new Uint8Array([10, 34, 248, 157, 10, 8, 220])
        const msgBot = new Uint8Array([42, 34, 248, 157, 10, 8, 220])

        // Code for peer 1
        wg1.onMessage = (id, msg) => {
          called1++
          expect(msg).toEqual(msgBot)

          // Check bot data
          wait(1000)
            .then(() => getBotData(wg1.id))
            .then((bot: IBotData) => {
              expect(called1).toEqual(1)
              expect(id).toEqual(bot.myId)
              expect(bot.onMessageToBeCalled).toEqual(1)
              expect(bot.messages[0].msg).toEqual(Array.from(msg1) as any)
              expect(bot.messages[0].id).toEqual(wg1.myId)
              done()
            })
            .catch(fail)
        }

        // Start sending message
        wg1.send(msg1)
      })

      /** @test {WebGroup#sendTo} */
      it('private String', (done) => {
        const msg1 = 'Art is long, life is short'
        const msgBot = 'bot: ' + msg1

        // Code for peer 1
        wg1.onMessage = (id, msg) => {
          called1++
          expect(msg).toEqual(msgBot)

          // Check bot data
          wait(1000)
            .then(() => getBotData(wg1.id))
            .then((bot: IBotData) => {
              expect(called1).toEqual(1)
              expect(id).toEqual(bot.myId)
              expect(bot.onMessageToBeCalled).toEqual(1)
              expect(bot.messages[0].msg).toEqual(msg1)
              expect(bot.messages[0].id).toEqual(wg1.myId)
              done()
            })
            .catch(fail)
        }

        // Start sending message
        wg1.sendTo(wg1.members[1], msg1)
      })

      /** @test {WebGroup#sendTo} */
      it('private ArrayBuffer', (done) => {
        const msg1 = new Uint8Array([45, 34, 248, 157, 10, 8, 220])
        const msgBot = new Uint8Array([42, 34, 248, 157, 10, 8, 220])

        // Code for peer 1
        wg1.onMessage = (id, msg) => {
          called1++
          expect(msg).toEqual(msgBot)

          // Check bot data
          wait(1000)
            .then(() => getBotData(wg1.id))
            .then((bot: IBotData) => {
              expect(called1).toEqual(1)
              expect(id).toEqual(bot.myId)
              expect(bot.onMessageToBeCalled).toEqual(1)
              expect(bot.messages[0].msg).toEqual(Array.from(msg1) as any)
              expect(bot.messages[0].id).toEqual(wg1.myId)
              done()
            })
            .catch(fail)
        }

        // Start sending message
        wg1.sendTo(wg1.members[1], msg1)
      })
    })

    // TODO: finish these tests
    xdescribe('leaving', () => {})
  })
})

/// <reference types='jasmine' />
/* tslint:disable:one-variable-per-declaration */
import { SignalingState, WebGroup, WebGroupState } from '../../src/index.browser'
import { Topology } from '../../src/index.common.doc'
import {
  areTheSame,
  BOT_URL,
  botGetData,
  botWaitJoin,
  cleanWebGroup,
  IBotData,
  Queue,
  randomBigArrayBuffer,
  SIGNALING_URL,
  wait,
} from '../util/helper'

const WebGroupOptions = {
  signalingServer: SIGNALING_URL,
  autoRejoin: false,
}

/** @test {WebGroup} */
describe('🙂 🤖 - 2 members: client invites bot', () => {
  let client: WebGroup

  /** @test {WebGroup#invite} */
  describe('invite', () => {
    beforeEach((done) => {
      client = new WebGroup(WebGroupOptions)
      client.onStateChange = (state: WebGroupState) => {
        if (state === WebGroupState.JOINED) {
          cleanWebGroup(client)
          wait(500).then(() => done())
        }
      }
      client.join()
    })

    afterEach(() => {
      cleanWebGroup(client)
      client.leave()
    })

    /** @test {WebGroup#onSignalingStateChange} */
    it('should change the Signaling state', (done) => {
      client.invite(BOT_URL)

      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot) => {
          expect(bot.onSignalingStateCalled).toEqual(4)
          done()
        })
    })

    /** @test {WebGroup#signalingState} */
    it('Signaling state should be CHECKED', (done) => {
      client.invite(BOT_URL)

      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot) => {
          expect(client.signalingState).toEqual(SignalingState.CHECKED)
          expect(bot.signalingState).toEqual(SignalingState.CHECKED)
          done()
        })
    })

    /** @test {WebGroup#onStateChange} */
    it('should change the WebGroup state of the bot only', (done) => {
      let called = 0

      client.onStateChange = () => called++
      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot) => {
          expect(called).toEqual(0)
          expect(bot.onStateCalled).toEqual(1)
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#state} */
    it('WebGroup state should be JOINED for both', (done) => {
      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot) => {
          expect(client.state).toEqual(WebGroupState.JOINED)
          expect(bot.state).toEqual(WebGroupState.JOINED)
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#onMemberJoin} */
    it('should be notified about new member', (done) => {
      let called1 = 0
      const clientJoinedMembers: number[] = []

      client.onMemberJoin = (id: number) => {
        clientJoinedMembers.push(id)
        called1++
      }

      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          expect(bot.onMemberJoinCalled).toEqual(1)
          expect(bot.joinedMembers).toEqual([client.myId])
          expect(called1).toEqual(1)
          expect(clientJoinedMembers).toEqual([bot.myId])
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#onMemberLeave} */
    it('should NOT be notified about left member', (done) => {
      let called1 = 0
      const clientLeftMembers: number[] = []

      client.onMemberLeave = (id: number) => {
        clientLeftMembers.push(id)
        called1++
      }

      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          expect(bot.onMemberLeaveCalled).toEqual(0)
          expect(bot.leftMembers).toEqual([])
          expect(called1).toEqual(0)
          expect(clientLeftMembers).toEqual([])
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#onMessage} */
    it('should NOT receive any message', (done) => {
      let called1 = 0

      client.onMessage = (id: number) => called1++

      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          expect(bot.onMessageToBeCalled).toEqual(0)
          expect(called1).toEqual(0)
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#onMyId} */
    it('should be called', (done) => {
      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          expect(bot.onMyIdToBeCalled).toEqual(1)
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#members} */
    it('should have 2 members', (done) => {
      let _bot: IBotData
      const queue = new Queue(2, () => {
        wait(1000).then(() => {
          const expected = [client.myId, _bot.myId]
          expect(areTheSame(client.members, expected)).toBeTruthy()
          expect(areTheSame(_bot.members, expected)).toBeTruthy()
          done()
        })
      })

      client.onMemberJoin = (id: number) => {
        expect(areTheSame(client.members, [client.myId, id])).toBeTruthy()
        queue.done()
      }

      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          _bot = bot
          expect(areTheSame(bot.members, [client.myId, bot.myId])).toBeTruthy()
          queue.done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#myId} */
    it("client's id should not change and bot's id should not be 0", (done) => {
      const clientMyId = client.myId

      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          expect(client.myId).toEqual(clientMyId)
          expect(bot.myId).not.toEqual(0)
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#id} */
    it('WebGroup id should not change, should be the same and not 0', (done) => {
      const wgId = client.id

      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          expect(client.id).toEqual(wgId)
          expect(bot.id).toEqual(client.id)
          expect(bot.id).not.toEqual(0)
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#key} */
    it('key should not change, should be the same and not empty', (done) => {
      const key = client.key

      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          expect(client.key).toEqual(key)
          expect(bot.key).toEqual(client.key)
          expect(bot.key).not.toEqual('')
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#topology} */
    it('topology should not change', (done) => {
      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          expect(client.topology).toEqual(Topology.FULL_MESH)
          expect(bot.topology).toEqual(Topology.FULL_MESH)
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#signalingServer} */
    it('Signaling server should not change', (done) => {
      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          expect(client.signalingServer).toEqual(SIGNALING_URL)
          expect(bot.signalingServer).toEqual(SIGNALING_URL)
          done()
        })
        .catch(fail)
    })

    /** @test {WebGroup#autoRejoin} */
    it('autoRejoin should be disabled', (done) => {
      client.invite(BOT_URL)

      // Check bot bot
      botWaitJoin(client.key)
        .then(() => botGetData(client.key))
        .then((bot: IBotData) => {
          expect(client.autoRejoin).toBeFalsy()
          expect(bot.autoRejoin).toBeFalsy()
          done()
        })
        .catch(fail)
    })

    describe('should send/receive', () => {
      let called1: number

      beforeEach((done) => {
        called1 = 0
        const queue = new Queue(2, () => {
          cleanWebGroup(client)
          wait(500).then(() => done())
        })
        client = new WebGroup(WebGroupOptions)
        client.onMemberJoin = () => queue.done()
        client.onStateChange = (state: WebGroupState) => {
          if (state === WebGroupState.JOINED) {
            client.invite(BOT_URL)
            botWaitJoin(client.key).then(() => queue.done())
          }
        }

        client.join()
      })

      afterEach(() => {
        cleanWebGroup(client)
        client.leave()
      })

      /** @test {WebGroup#send} */
      it('broadcast String', (done) => {
        const msg1 = 'sendArt is long, life is short'
        const msgBot = 'bot: ' + msg1

        // Code for peer 1
        client.onMessage = (id, msg) => {
          called1++
          expect(msg).toEqual(msgBot)

          // Check bot bot
          wait(1000)
            .then(() => botGetData(client.key))
            .then((bot) => {
              expect(called1).toEqual(1)
              expect(id).toEqual(bot.myId)
              expect(bot.onMessageToBeCalled).toEqual(1)
              expect(bot.messages[0].msg).toEqual(msg1)
              expect(bot.messages[0].id).toEqual(client.myId)
              done()
            })
            .catch(fail)
        }

        // Start sending message
        client.send(msg1)
      })

      /** @test {WebGroup#send} */
      it('broadcast ArrayBuffer', (done) => {
        const msg1 = new Uint8Array([10, 34, 248, 157, 10, 8, 220])
        const msgBot = new Uint8Array([42, 34, 248, 157, 10, 8, 220])

        // Code for peer 1
        client.onMessage = (id, msg) => {
          called1++
          expect(msg).toEqual(msgBot)

          // Check bot bot
          wait(1000)
            .then(() => botGetData(client.key))
            .then((bot) => {
              expect(called1).toEqual(1)
              expect(id).toEqual(bot.myId)
              expect(bot.onMessageToBeCalled).toEqual(1)
              expect(bot.messages[0].msg).toEqual(Array.from(msg1) as any)
              expect(bot.messages[0].id).toEqual(client.myId)
              done()
            })
            .catch(fail)
        }

        // Start sending message
        client.send(msg1)
      })

      /** @test {WebGroup#sendTo} */
      it('broadcast message cutted in chunks (> 15kb)', (done) => {
        const bytes = randomBigArrayBuffer()

        // Check bot bot
        wait(1000)
          .then(() => botGetData(client.key))
          .then((bot) => {
            expect(bot.onMessageToBeCalled).toEqual(1)
            expect(bot.messages[0].msg).toEqual(Array.from(bytes) as any)
            expect(bot.messages[0].id).toEqual(client.myId)
            done()
          })
          .catch(fail)

        // Start sending message
        client.send(bytes)
      })

      /** @test {WebGroup#sendTo} */
      it('private String', (done) => {
        const msg1 = 'Art is long, life is short'
        const msgBot = 'bot: ' + msg1

        // Code for peer 1
        client.onMessage = (id, msg) => {
          called1++
          expect(msg).toEqual(msgBot)

          // Check bot bot
          wait(1000)
            .then(() => botGetData(client.key))
            .then((bot) => {
              expect(called1).toEqual(1)
              expect(id).toEqual(bot.myId)
              expect(bot.onMessageToBeCalled).toEqual(1)
              expect(bot.messages[0].msg).toEqual(msg1)
              expect(bot.messages[0].id).toEqual(client.myId)
              done()
            })
            .catch(fail)
        }

        // Start sending message
        client.sendTo(client.members[1], msg1)
      })

      /** @test {WebGroup#sendTo} */
      it('private ArrayBuffer', (done) => {
        const msg1 = new Uint8Array([45, 34, 248, 157, 10, 8, 220])
        const msgBot = new Uint8Array([42, 34, 248, 157, 10, 8, 220])

        // Code for peer 1
        client.onMessage = (id, msg) => {
          called1++
          expect(msg).toEqual(msgBot)

          // Check bot bot
          wait(1000)
            .then(() => botGetData(client.key))
            .then((bot) => {
              expect(called1).toEqual(1)
              expect(id).toEqual(bot.myId)
              expect(bot.onMessageToBeCalled).toEqual(1)
              expect(bot.messages[0].msg).toEqual(Array.from(msg1) as any)
              expect(bot.messages[0].id).toEqual(client.myId)
              done()
            })
            .catch(fail)
        }

        // Start sending message
        client.sendTo(client.members[1], msg1)
      })
    })
  })
})

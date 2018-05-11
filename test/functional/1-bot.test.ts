/// <reference types='jasmine' />
import { SignalingState, Topology, WebGroupState } from '../../src/index.browser'
import {
  getBotData,
  leaveBotGroup,
  newBotGroup,
  randomKey,
  SIGNALING_URL,
  waitBotJoin,
} from '../util/helper'

/** @test {WebGroup} */
describe('🤖 - 1 member', () => {
  /** @test {WebGroup#join} */
  describe('join', () => {
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

    /** @test {WebGroup#onMemberLeave} */
    it('should NOT be notified about left member', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.onMemberLeaveCalled).toEqual(0)
          expect(data.leftMembers.length).toEqual(0)
          done()
        })
    })

    /** @test {WebGroup#onMessage} */
    it('should NOT receive any message', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.onMessageToBeCalled).toEqual(0)
          expect(data.messages).toEqual([])
          done()
        })
    })

    /** @test {WebGroup#autoRejoin} */
    it('autoRejoin should be enabled', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.autoRejoin).toBeTruthy()
          done()
        })
    })

    /** @test {WebGroup#signalinServer} */
    it('signalinServer should not change', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.signalingServer).toEqual(SIGNALING_URL)
          done()
        })
    })

    /** @test {WebGroup#topology} */
    it('topology should not change', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.topology).toEqual(Topology.FULL_MESH)
          done()
        })
    })

    /** @test {WebGroup#members} */
    it('should have only me as a member', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.members).toEqual([data.myId])
          done()
        })
    })

    /** @test {WebGroup#myId} */
    it('my id should not be 0', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.myId).not.toEqual(0)
          done()
        })
    })

    /** @test {WebGroup#id} */
    it('WebGroup id should not be 0', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.id).not.toEqual(0)
          done()
        })
    })

    /** @test {WebGroup#key} */
    it('key should be the one provided to the join method', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.key).toEqual(key)
          done()
        })
    })

    /** @test {WebGroup#state} */
    it('WebGroup state should be JOINED', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.state).toEqual(WebGroupState.JOINED)
          done()
        })
    })

    /** @test {WebGroup#signalingState} */
    it('Signaling state should be CHECKED', (done) => {
      waitBotJoin(key)
        .then(() => getBotData(key))
        .then((data) => {
          expect(data.signalingState).toEqual(SignalingState.CHECKED)
          done()
        })
    })
  })

  /** @test {WebGroup#leave} */
  describe('leave', () => {
    let key: string
    beforeEach((done) => {
      key = randomKey()
      newBotGroup(key).then(() => done())
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

    /** @test {WebGroup#onMemberJoin} */
    it('should NOT be notified about new member', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.onMemberJoinCalled).toEqual(0)
        expect(data.joinedMembers.length).toEqual(0)
        done()
      })
    })

    /** @test {WebGroup#onMemberLeave} */
    it('should NOT be notified about left member', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.onMemberLeaveCalled).toEqual(0)
        expect(data.leftMembers.length).toEqual(0)
        done()
      })
    })

    /** @test {WebGroup#onMessage} */
    it('should NOT receive any message', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.onMessageToBeCalled).toEqual(0)
        expect(data.messages).toEqual([])
        done()
      })
    })

    /** @test {WebGroup#autoRejoin} */
    it('autoRejoin should be enabled', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.autoRejoin).toBeTruthy()
        done()
      })
    })

    /** @test {WebGroup#signalinServer} */
    it('signalinServer should not change', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.signalingServer).toEqual(SIGNALING_URL)
        done()
      })
    })

    /** @test {WebGroup#topology} */
    it('topology should not change', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.topology).toEqual(Topology.FULL_MESH)
        done()
      })
    })

    /** @test {WebGroup#members} */
    it('should have no members', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.members).toEqual([])
        done()
      })
    })

    /** @test {WebGroup#myId} */
    it('my id should be 0', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.myId).toEqual(0)
        done()
      })
    })

    /** @test {WebGroup#id} */
    it('WebGroup id should be 0', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.id).toEqual(0)
        done()
      })
    })

    /** @test {WebGroup#key} */
    it('key should be empty', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.key).toEqual('')
        done()
      })
    })

    /** @test {WebGroup#state} */
    it('WebGroup state should be LEFT', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.state).toEqual(WebGroupState.LEFT)
        done()
      })
    })

    /** @test {WebGroup#signalingState} */
    it('Signaling state should be CLOSED', (done) => {
      leaveBotGroup(key).then((data) => {
        expect(data.signalingState).toEqual(SignalingState.CLOSED)
        done()
      })
    })
  })
})

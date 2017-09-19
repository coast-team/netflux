/// <reference types='jasmine' />
import { WebGroup, WebGroupState, SignalingState, Topology } from '../../src'
import { SIGNALING_URL } from '../util/helper'

describe('🙂', () => {
  it('new WebGroup()', () => {
    const wg = new WebGroup({signalingURL: SIGNALING_URL})
    const wgAsAny: any = wg
    let oldValue: any

    // Check members
    expect(typeof wg.id).toBe('number')
    oldValue = wg.id
    wgAsAny.id = oldValue + 1
    expect(wg.id).toBe(oldValue)

    expect(typeof wg.myId).toBe('number')
    oldValue = wg.myId
    wgAsAny.myId = oldValue + 1
    expect(wg.myId).toBe(oldValue)

    expect(wg.key).toBe('')
    oldValue = wg.key
    wgAsAny.key = 'hello world!'
    expect(wg.key).toBe(oldValue)

    expect(wg.members).toBe([])
    oldValue = wg.members
    wgAsAny.members = [1234, 5678]
    expect(wg.members).toBe(oldValue)

    expect(typeof wg.topology).toBe('number')
    expect(Topology).toContain(wg.topology)
    oldValue = wg.topology
    wgAsAny.topology = 474
    expect(wg.topology).toBe(oldValue)

    expect(wg.state).toBe(WebGroupState.LEFT)
    oldValue = wg.state
    wgAsAny.state = 747
    expect(wg.state).toBe(oldValue)

    expect(wg.signalingState).toBe(SignalingState.CLOSED)
    oldValue = wg.signalingState
    wgAsAny.signalingState = 374
    expect(wg.signalingState).toBe(oldValue)

    expect(wg.signalingURL).toBe(SIGNALING_URL)
    oldValue = wg.signalingURL
    wgAsAny.signalingURL = 'wss://relax.planet.net'
    expect(wg.signalingURL).toBe(oldValue)

    expect(wg.autoRejoin).toBeTruthy()
    wg.autoRejoin = false
    expect(wg.autoRejoin).toBeFalsy()

    // Check event handlers
    expect(typeof wg.onMemberJoin).toBe('function')
    expect(typeof wg.onMemberLeave).toBe('function')
    expect(typeof wg.onMessage).toBe('function')
    expect(typeof wg.onStateChange).toBe('function')
    expect(typeof wg.onSignalingStateChange).toBe('function')

    // Check methods
    expect(typeof wg.join).toBe('function')
    expect(typeof wg.invite).toBe('function')
    expect(typeof wg.closeSignaling).toBe('function')
    expect(typeof wg.leave).toBe('function')
    expect(typeof wg.send).toBe('function')
    expect(typeof wg.sendTo).toBe('function')
    expect(typeof wg.ping).toBe('function')
  })

  describe('join', () => {
    let wg: WebGroup

    beforeEach (() => wg = new WebGroup({signalingURL: SIGNALING_URL}))

    afterEach (() => wg.leave())

    function join (key?: string) {
      return new Promise ((resolve, reject) => {
        const oldMyId = wg.myId
        let firstStateDone = false
        function resolveCheck () {
          if (firstStateDone) {
            expect(wg.myId).toBe(oldMyId)
            resolve()
          } else {
            firstStateDone = true
          }
        }
        const onStateChangeGen = (function* () {
          let state = yield
          expect(state).toEqual(WebGroupState.JOINING)
          expect(wg.state).toBe(state)
          state = yield
          expect(yield).toEqual(WebGroupState.JOINED)
          expect(wg.state).toBe(state)

          resolveCheck()
        })()
        const onSignalingStateChangeGen = (function* () {
          let state = yield
          expect(state).toEqual(SignalingState.CONNECTING)
          expect(wg.signalingState).toBe(state)
          state = yield
          expect(yield).toEqual(SignalingState.OPEN)
          expect(wg.signalingState).toBe(state)
          state = yield
          expect(yield).toEqual(SignalingState.READY_TO_JOIN_OTHERS)
          expect(wg.signalingState).toBe(state)

          resolveCheck()
        })()
        wg.onStateChange = (state: WebGroupState) => onStateChangeGen.next(state)
        wg.onSignalingStateChange = (state: SignalingState) => onSignalingStateChangeGen.next(state)
        try {
          wg.join()
        } catch (err) {
          reject(err)
        }
      })
    }

    it('should join without a provided key', done => {
      join().then(() => {
        expect(typeof wg.key).toBe('string')
        expect(wg.key).not.toBe('')
        done()
      })
      .catch((err: Error) => done.fail(err.message))
    })

    it('should join with a provided key', done => {
      const key = 'Free from desire, you realize the mystery. Caught in desire, you see only the manifestations. (Tao Te Ching)'
      join(key).then(() => {
        expect(typeof wg.key).toBe('string')
        expect(wg.key).not.toBe(key)
        done()
      })
      .catch((err: Error) => done.fail(err.message))
    })

    it('should throw an error, because key is not a "string"', done => {
      const oldMyId = wg.myId
      const key = 42
      wg.join(key as any)
      expect(wg.join).toThrowError(`Failed to join: the key type number is not a 'string'`)
      expect(wg.myId).toBe(oldMyId)
      const onStateChangeSpy = spyOnProperty(wg, 'onStateChange', 'get')
      expect(onStateChangeSpy).toHaveBeenCalledTimes(0)
      const onSignalingStateChangeSpy = spyOnProperty(wg, 'onSignalingStateChange', 'get')
      expect(onSignalingStateChangeSpy).toHaveBeenCalledTimes(0)
      expect(wg.state).toBe(WebGroupState.LEFT)
      expect(wg.key).toBe('')
    })

    // it('should throw an error, because key is an empty string', done => {
    //   const oldMyId = wg.myId
    //   wg.join('')
    //   expect(wg.join).toThrow()
    //   expect(wg.myId).toBe(oldMyId)
    //   const onStateChangeSpy = spyOnProperty(wg, 'onStateChange', 'get')
    //   expect(onStateChangeSpy).toHaveBeenCalledTimes(0)
    //   const onSignalingStateChangeSpy = spyOnProperty(wg, 'onSignalingStateChange', 'get')
    //   expect(onSignalingStateChangeSpy).toHaveBeenCalledTimes(0)
    //   expect(wg.state).toBe(WebGroupState.LEFT)
    //   expect(wg.key).toBe('')
    // })
  })

  // it('Should close the WebChannel', done => {
  //   // wg.onClose = done
  //   // wg.open()
  //   //   .then(data => wg.close())
  //   //   .catch(done.fail)
  // })

  // it('Ping should reject', done => {
  //   wg.ping()
  //     .then(() => done.fail('Ping resolved'))
  //     .catch(done)
  // })
})

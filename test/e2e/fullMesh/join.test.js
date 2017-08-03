import * as helper from '../../util/helper'
import bigStr from '../../util/4mb.txt'
import { WebChannel } from '../../../src/service/WebChannel'

// const USE_CASES = [2, 3, 7]
const USE_CASES = [2]
const scenarios = [
  new helper.Scenario('cc') // ,
  // new helper.Scenario('cb'),
  // new helper.Scenario('ccc') // ,
  // new helper.Scenario('ccb'),
  // new helper.Scenario('cccc') // ,
  // new helper.Scenario('ccccccc') // ,
  // new helper.Scenario('cccbccc')
]
const PEER_FACE = '🙂 '
const faces = length => {
  let faces = PEER_FACE
  for (let i = 1; i < length; i++) {
    faces += '🙂 '
  }
  return faces
}

describe('Spray connected', () => {
  describe('Should establish a p2p network', () => {
    let wcs
    afterEach(() => wcs.forEach(wc => wc.disconnect()))

    scenarios.forEach(scenario => {
      it(`${scenario.smiles}`, done => {
        const key = helper.randKey()
        let promises = []
        wcs = helper.createWebChannels(scenario.nbClients)
        wcs.forEach(wc => {
          expect(wc.state).toBe(WebChannel.DISCONNECTED)
          wc.onPeerJoinCalledTimes = 0
          wc.onPeerJoin = id => {
            wc.onPeerJoinCalledTimes++
            // Joined peer's id should be among WebChannel members ids
            expect(wc.members.includes(id)).toBeTruthy()

            // Its id should be included only ONCE
            expect(wc.members.indexOf(id)).toEqual(wc.members.lastIndexOf(id))
          }
          promises.push(new Promise(resolve => {
            wc.onStateChangedCalledTimes = 0
            wc.onStateChanged = state => {
              wc.onStateChangedCalledTimes++
              if (state === WebChannel.JOINED) {
                resolve()
              }
            }
          }))
        })

        let joinQueue = Promise.resolve()
        let clientCount = 0
        for (let i = 0; i < scenario.template.length; i++) {
          if (scenario.template[i] === 'c') {
            joinQueue = joinQueue.then(() => wcs[clientCount++].join(key))
          } else {
            joinQueue = joinQueue.then(() => wcs[i - 1].invite(helper.BOT_URL))
          }
        }

        promises.push(joinQueue)

        // After all peers have been joined, do check
        Promise.all(promises)
          .then(() => helper.botWaitJoin(wcs[0].id))
          .then(() => {
            if (scenario.hasBot()) {
              return helper.expectBotMembers(wcs[0].id, wcs, scenario.nbPeers)
            }
            return true
          })
          .then(() => {
            helper.expectMembers(wcs, scenario.nbPeers)
            wcs.forEach(wc => {
              expect(wc.state).toBe(WebChannel.JOINED)
              expect(wc.onPeerJoinCalledTimes).toBe(scenario.nbPeers - 1)
              expect(wc.onStateChangedCalledTimes).toBe(2)
            })
            done()
          })
          .catch(done.fail)
      // }, 150)
      }, scenario.nbAgents * 2000)
    })
  })

  xdescribe('Should ping', () => {
    let wcs

    afterEach(() => wcs.forEach(wc => wc.disconnect()))

    USE_CASES.forEach(numberOfPeers => {
      it(`${numberOfPeers}`, done => {
        helper.createAndConnectWebChannels(numberOfPeers)
          .then(webChannels => (wcs = webChannels))
          .then(() => wcs.map(
            wc => wc.ping().then(p => expect(Number.isInteger(p)).toBeTruthy())
          ))
          .then(proms => Promise.all(proms))
          .then(done)
          .catch(done.fail)
      })
    })
  })

  fdescribe('Should send/receive', () => {
    let wcs

    afterEach(() => wcs.forEach(wc => wc.disconnect()))

    USE_CASES.forEach(numberOfPeers => {
      describe(`${faces(numberOfPeers)}`, () => {
        it(`private: ArrayBuffer, String & 50Kb chunk`, done => {
          helper.createAndConnectWebChannels(numberOfPeers)
            .then(webChannels => (wcs = webChannels))
            .then(() => helper.sendAndExpectOnMessage(wcs, false))
            .then(done)
            .catch(done.fail)
        })

        it(`broadcast: ArrayBuffer, String & 50Kb chunk`, done => {
          helper.createAndConnectWebChannels(numberOfPeers)
            .then(webChannels => (wcs = webChannels))
            .then(() => helper.sendAndExpectOnMessage(wcs, true))
            .then(done)
            .catch(done.fail)
        })
      })
    })
  })

  describe(`${PEER_FACE}${PEER_FACE}`, () => {
    let wcs

    afterEach(() => wcs.forEach(wc => wc.disconnect()))

    helper.itBrowser(true, 'should send/receive ~4 MB string', done => {
      helper.createAndConnectWebChannels(2)
        .then(webChannels => (wcs = webChannels))
        .then(() => {
          wcs[0].onMessage = (id, msg) => {
            expect(id).toEqual(wcs[1].myId)
            expect(msg === bigStr).toBeTruthy()
            done()
          }
          wcs[1].sendTo(wcs[0].myId, bigStr)
        })
    }, 10000)
  })

  describe('Should disconnect', () => {
    let wcs

    afterEach(() => wcs.forEach(wc => wc.disconnect()))
    USE_CASES.forEach(numberOfPeers => {
      it(`${faces(numberOfPeers)}`, done => {
        helper.createAndConnectWebChannels(numberOfPeers)
          .then(webChannels => {
            wcs = webChannels
            wcs.forEach(wc => {
              expect(wc.state).toBe(WebChannel.JOINED)
              wc.onPeerLeaveCalledTimes = 0
              wc.onPeerLeave = id => {
                wc.onPeerLeaveCalledTimes++
                expect(wc.members.includes(id)).toBeFalsy()
              }
              wc.onStateChangedCalledTimes = 0
              wc.onStateChanged = () => wc.onStateChangedCalledTimes++
            })
            let res = Promise.resolve()
            for (let wc of wcs) {
              res = res.then(() => {
                wc.disconnect()
                return new Promise(resolve => setTimeout(resolve, 10))
              })
            }
            return res
          })
          .then(() => {
            wcs.forEach((wc, index) => {
              expect(wc.state).toBe(WebChannel.DISCONNECTED)
              expect(wc.members.length).toBe(0)
              expect(wc.onPeerLeaveCalledTimes).toBe(index)
              expect(wc.onStateChangedCalledTimes).toBe(1)
            })
          })
          .then(done)
          .catch(done.fail)
      })
    })
  })
})

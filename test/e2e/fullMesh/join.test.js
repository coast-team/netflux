import { Subject } from 'rxjs/Subject'

import * as helper from '../../util/helper'
import bigStr from '../../util/4mb.txt'
import { WebGroup, StateEnum } from '../../../src/index'

const USE_CASES = [2, 3, 7]
const scenarios = [
  new helper.Scenario('cc'),
  new helper.Scenario('cb'),
  new helper.Scenario('ccc'),
  new helper.Scenario('ccb'),
  new helper.Scenario('ccccccc'),
  new helper.Scenario('cccbccc')
]
const PEER_FACE = '🙂 '
const faces = length => {
  let faces = PEER_FACE
  for (let i = 1; i < length; i++) {
    faces += '🙂 '
  }
  return faces
}

describe('Fully connected', () => {
  describe('Should establish a p2p network', () => {
    let wgs
    afterEach(() => wgs.forEach(wg => wg.leave()))

    scenarios.forEach(scenario => {
      it(`${scenario.smiles}`, done => {
        const network = new Subject()
        let nextJoiningIndex = 0
        let botJoined = false
        const key = helper.randKey()
        wgs = helper.createWebGroups(scenario.nbClients)
        wgs.forEach((wg, index) => {
          expect(wg.state).toBe(StateEnum.LEFT)
          wg.onMemberJoinCalledTimes = 0
          wg.onMemberJoin = id => {
            wg.onMemberJoinCalledTimes++
            // Joined peer's id should be among WebGroup members ids
            expect(wg.members.includes(id)).toBeTruthy()

            // Its id should be included only ONCE
            expect(wg.members.indexOf(id)).toEqual(wg.members.lastIndexOf(id))
          }
          wg.onStateChangeCalledTimes = 0
          wg.onStateChange = state => {
            wg.onStateChangeCalledTimes++
            if (state === StateEnum.JOINED) {
              network.next({wg, isBot: false})
            }
          }
        })

        network.subscribe(
          ({wg, isBot}) => {
            nextJoiningIndex = isBot ? nextJoiningIndex : nextJoiningIndex + 1
            if ((nextJoiningIndex === scenario.nbClients && !scenario.hasBot()) || (nextJoiningIndex === scenario.nbClients && scenario.hasBot() && botJoined)) {
              network.complete()
            } else if (nextJoiningIndex === scenario.botIndex && !isBot) {
              wg.invite(helper.BOT_URL)
              helper.botWaitJoin(wgs[0].id)
                .then(() => {
                  botJoined = true
                  network.next({isBot: true})
                })
            } else {
              wgs[nextJoiningIndex].join(key)
            }
          },
          err => {},
          () => {
            let botCheck = Promise.resolve()
            if (scenario.hasBot()) {
              botCheck = helper.expectBotMembers(wgs[0].id, wgs, scenario.nbPeers)
            }
            botCheck.then(() => {
              helper.expectMembers(wgs, scenario.nbPeers)
              wgs.forEach(wg => {
                expect(wg.state).toBe(StateEnum.JOINED)
                expect(wg.onMemberJoinCalledTimes).toBe(scenario.nbPeers - 1)
                expect(wg.onStateChangeCalledTimes).toBe(2)
              })
              done()
            })
            .catch(done.fail)
          }
        )
        wgs[0].join(key)
      }, scenario.nbAgents * 2000)
    })
  })

  describe('Should ping', () => {
    let wgs

    afterEach(() => wgs.forEach(wg => wg.leave()))

    USE_CASES.forEach(numberOfPeers => {
      it(`${numberOfPeers}`, done => {
        helper.createAndConnectWebGroups(numberOfPeers)
          .then(webChannels => (wgs = webChannels))
          .then(() => wgs.map(
            wg => wg.ping().then(p => expect(Number.isInteger(p)).toBeTruthy())
          ))
          .then(proms => Promise.all(proms))
          .then(done)
          .catch(done.fail)
      })
    })
  })

  describe('Should send/receive', () => {
    let wgs

    afterEach(() => wgs.forEach(wg => wg.leave()))

    USE_CASES.forEach(numberOfPeers => {
      describe(`${faces(numberOfPeers)}`, () => {
        it(`private: ArrayBuffer, String & 50Kb chunk`, done => {
          helper.createAndConnectWebGroups(numberOfPeers)
            .then(webChannels => (wgs = webChannels))
            .then(() => helper.sendAndExpectOnMessage(wgs, false))
            .then(done)
            .catch(done.fail)
        })

        it(`broadcast: ArrayBuffer, String & 50Kb chunk`, done => {
          helper.createAndConnectWebGroups(numberOfPeers)
            .then(webChannels => (wgs = webChannels))
            .then(() => helper.sendAndExpectOnMessage(wgs, true))
            .then(done)
            .catch(done.fail)
        })
      })
    })
  })

  describe(`${PEER_FACE}${PEER_FACE}`, () => {
    let wgs

    afterEach(() => wgs.forEach(wg => wg.leave()))

    helper.itBrowser(true, 'should send/receive ~4 MB string', done => {
      helper.createAndConnectWebGroups(2)
        .then(webChannels => (wgs = webChannels))
        .then(() => {
          wgs[0].onMessage = (id, msg) => {
            expect(id).toEqual(wgs[1].myId)
            expect(msg === bigStr).toBeTruthy()
            done()
          }
          wgs[1].sendTo(wgs[0].myId, bigStr)
        })
    }, 10000)
  })

  describe('Should disconnect', () => {
    let wgs

    afterEach(() => wgs.forEach(wg => wg.leave()))
    USE_CASES.forEach(numberOfPeers => {
      it(`${faces(numberOfPeers)}`, done => {
        helper.createAndConnectWebGroups(numberOfPeers)
          .then(webChannels => {
            let res = []
            wgs = webChannels
            wgs.forEach(wg => {
              expect(wg.state).toBe(StateEnum.JOINED)
              wg.onMemberLeaveCalledTimes = 0
              wg.onMemberLeave = id => {
                wg.onMemberLeaveCalledTimes++
                expect(wg.members.includes(id)).toBeFalsy()
              }
              wg.onStateChangeCalledTimes = 0
              res.push(new Promise(resolve => {
                wg.onStateChange = state => {
                  wg.onStateChangeCalledTimes++
                  if (state === StateEnum.LEFT) {
                    resolve()
                  }
                }
              }))
            })
            for (let wg of wgs) {
              wg.leave()
            }
            return Promise.all(res)
          })
          .then(() => {
            wgs.forEach((wg, index) => {
              expect(wg.state).toBe(StateEnum.LEFT)
              expect(wg.members.length).toBe(0)
              expect(wg.onMemberLeaveCalledTimes).toBe(numberOfPeers - 1)
              expect(wg.onStateChangeCalledTimes).toBe(1)
            })
          })
          .then(done)
          .catch(done.fail)
      })
    })
  })
})

import * as helper from 'util/helper'
import bigStr from 'util/4mb.txt'

const USE_CASES = [2, 3, 7]
const scenarios = [
  new helper.Scenario(2),
  new helper.Scenario(1, 1),
  new helper.Scenario(3),
  new helper.Scenario(2, 2),
  new helper.Scenario(7),
  new helper.Scenario(6, 3)
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
  describe('Should establish a p2p network successively via join/join', () => {
    let wcs
    log.info('Hello wolrd')
    afterEach(() => wcs.forEach(wc => wc.leave()))

    scenarios.forEach(scenario => {
      it(`${scenario.smiles}`, done => {
        const key = helper.randKey()
        wcs = helper.createWebChannels(scenario.nbAgents)
        helper.expectAndSpyOnPeerJoin(wcs)

        let joinQueue = Promise.resolve()
        if (scenario.hasBot()) {
          // First peer opens a door with Signaling server.
          joinQueue = joinQueue.then(() => wcs[0].join(key))

          // Join all peers before bot
          for (let i = 1; i < scenario.botPosition; i++) {
            joinQueue = joinQueue.then(() => wcs[i].join(key, {open: false}))
          }

          // Invite bot
          joinQueue = joinQueue.then(() => wcs[scenario.botPosition - 1].invite(helper.BOT_URL))

          // Join rest peers
          for (let i = scenario.botPosition; i < scenario.nbAgents; i++) {
            joinQueue = joinQueue.then(() => wcs[i].join(key, {open: false}))
          }

          // Check Bot members
          joinQueue.then(() => {
            if (scenario.hasBot()) {
              helper.expectBotMembers(wcs[0].id, wcs, scenario.nbPeers)
            }
          })
        } else {
          // Peers join successively through the first peer.
          joinQueue = wcs.reduce((acc, wc, index) => {
            return acc.then(() => wc.join(key, index !== 0 ? {open: false} : {}))
          }, joinQueue)
        }

        // After all peers has been joined (set a small timeout hack, because
        // of async execution), check members and onPeerJoin for all agents (not bot)
        joinQueue
        .then(() => {
          setTimeout(() => {
            helper.expectMembers(wcs, scenario.nbPeers)
            wcs.forEach(wc => expect(wc.onPeerJoin).toHaveBeenCalledTimes(scenario.nbPeers - 1))
            done()
          }, 100)
        })
        .catch(done.fail)
      })
    })
  })

  describe('Should ping', () => {
    let wcs

    afterEach(() => wcs.forEach(wc => wc.leave()))
    USE_CASES.forEach(numberOfPeers => {
      it(`${faces(numberOfPeers)}`, done => {
        helper.createAndConnectWebChannels(2)
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

  describe('Should send/receive', () => {
    let wcs

    afterEach(() => wcs.forEach(wc => wc.leave()))

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

    afterEach(() => wcs.forEach(wc => wc.leave()))

    it(`should establish a p2p network via open/join`, done => {
      wcs = helper.createWebChannels(2)
      helper.expectAndSpyOnPeerJoin(wcs)

      wcs[0].open()
        .then(data => wcs[1].join(data.key))
        .then(() => {
          setTimeout(() => {
            helper.expectMembers(wcs, 2)
            wcs.forEach(wc => expect(wc.onPeerJoin).toHaveBeenCalledTimes(1))
            done()
          }, 100)
        })
        .catch(done.fail)
    })

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

  describe('Should leave', () => {
    let wcs

    afterEach(() => wcs.forEach(wc => wc.leave()))
    USE_CASES.forEach(numberOfPeers => {
      it(`${faces(numberOfPeers)}`, done => {
        helper.createAndConnectWebChannels(numberOfPeers)
          .then(webChannels => (wcs = webChannels))
          .then(() => {
            helper.expectAndSpyOnPeerLeave(wcs)
            async function successiveLeave () {
              for (let wc of wcs) {
                wc.leave()
                await new Promise(resolve => setTimeout(resolve, 50))
              }
            }
            return successiveLeave()
          })
          .then(() => {
            wcs.forEach((wc, index) => {
              expect(wc.members.length).toEqual(0)
              expect(wc.onPeerLeave).toHaveBeenCalledTimes(index)
            })
          })
          .then(done)
          .catch(done.fail)
      })
    })
  })
})

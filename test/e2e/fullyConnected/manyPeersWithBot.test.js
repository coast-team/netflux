import * as helper from 'util/helper'

const NB_AGENTS = 7
const NB_BOT = 1
const NB_PEERS = NB_AGENTS + NB_BOT

describe(`Fully connected: ${NB_PEERS} peers including 1 bot`, () => {
  function sendReceive (wcs, done) {
    const groups = []
    for (let i = 0; i < NB_AGENTS; i++) {
      groups[i] = new helper.TestGroup(wcs[i], [String])
    }
    helper.allMessagesAreSentAndReceived(groups, String)
      .then(done)
      .catch(done.fail)

    groups.forEach(g => g.wc.send(g.get(String)))
  }

  describe('one by one', () => {
    let wcs

    beforeAll(() => (wcs = helper.initWebChannels(NB_AGENTS)))
    afterAll(() => wcs.forEach(wc => wc.leave()))

    it('Should connect', done => {
      // Configure onPeerJoin callback
      helper.expectAndSpyOnPeerJoin(wcs)

      // First peer opens a door with Signaling server.
      let promise = wcs[0].open()
        // Invite bot
        .then(data => {
          return wcs[0].invite(helper.BOT_URL)
            .then(() => data)
        })
        // Other peers join successively through the first peer.
        .then(data => {
          for (let i = 1; i < NB_AGENTS; i++) {
            promise = promise.then(() => wcs[i].join(data.key, {open: false}))
          }

          // After all peers has been joined (set a small timeout hack, because
          // of async execution), check members and onPeerJoin.
          promise
            .then(() => helper.expectBotMembers(wcs[0].id, wcs, NB_PEERS))
            .then(() => {
              setTimeout(() => {
                helper.expectMembers(wcs, NB_PEERS)
                wcs.forEach(wc => expect(wc.onPeerJoin).toHaveBeenCalledTimes(NB_PEERS - 1))
                done()
              }, 100)
            })
            .catch(done.fail)
        })
    }, 60000)

    helper.itBrowser(false, 'broadcast string message', done => {
      sendReceive(wcs, done)
    })
  })

  xdescribe('simultaneously', () => {
    const wcs = []

    afterAll(() => wcs.forEach(wc => wc.leave()))

    it('Should connect', done => {
      helper.detectAllJoiningPeers(wcs)
        .then(() => {
          setTimeout(() => {
            helper.checkMembers(wcs)
            wcs.forEach(wc => wc.close())
            done()
          }, 100)
        })
        .catch(done.fail)
      wcs[0].open()
        .then(data => {
          for (let i = 1; i < wcs.length; i++) wcs[i].join(data.key, {open: false})
        })
        .catch(done.fail)
    }, 30000)

    helper.itBrowser(false, 'broadcast string message', done => {
      sendReceive(wcs, done)
    })
  })
})

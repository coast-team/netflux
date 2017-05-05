import {create} from 'src/index.browser'
import * as helper from 'util/helper'
const NB_PEERS = 7

describe(`Fully connected: many peers (${NB_PEERS})`, () => {
  const signalingURL = helper.SIGNALING_URL

  function allJoiningDetectedByAll (wcs) {
    const joined = new Map()
    const joinPromises = []
    for (let i = 0; i < NB_PEERS; i++) {
      wcs[i] = create({signalingURL})
      joined.set(i, [])
      joinPromises.push(new Promise((resolve, reject) => {
        wcs[i].onPeerJoin = id => {
          const joinedTab = joined.get(i)
          expect(joinedTab.includes(id)).toBeFalsy()
          joinedTab.push(id)
          if (joinedTab.length === NB_PEERS - 1) resolve()
        }
      }))
    }
    return Promise.all(joinPromises)
  }

  function sendReceive (wcs, done) {
    const groups = []
    for (let i = 0; i < NB_PEERS; i++) {
      groups[i] = new helper.TestGroup(wcs[i], [String])
    }
    helper.allMessagesAreSentAndReceived(groups, String)
      .then(done).catch(done.fail)

    groups.forEach(g => g.wc.send(g.get(String)))
  }

  describe('one by one', () => {
    const wcs = []

    afterAll(() => wcs.forEach(wc => wc.leave()))

    it('Should connect', done => {
      allJoiningDetectedByAll(wcs)
        .then(() => {
          setTimeout(() => {
            helper.checkMembers(wcs)
            wcs.forEach(wc => wc.close())
            done()
          }, 100)
        })
        .catch(done.fail)
      let promise = wcs[0].open()
        .then((data) => {
          for (let i = 1; i < NB_PEERS; i++) {
            promise = promise.then(() => wcs[i].join(data.key, {open: false}))
          }
          promise.catch(done.fail)
        })
    }, 30000)

    helper.itBrowser(false, 'broadcast string message', done => {
      sendReceive(wcs, done)
    })
  })

  describe('simultaneously', () => {
    const wcs = []

    afterAll(() => wcs.forEach(wc => wc.leave()))

    it('Should connect', done => {
      allJoiningDetectedByAll(wcs)
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

import {signaling, allMessagesAreSentAndReceived, randString} from 'config'
import WebChannel from 'src/WebChannel'

describe('Fully connected: many peers', () => {
  const NB_PEERS = 10

  let wcs = []
  let msgs = []
  for (let i = 0; i < NB_PEERS; i++) {
    msgs[i] = randString()
  }

  describe('Should establish a connection', () => {
    it('one by one', (done) => {
      let joined = new Map()
      let joinPromises = []
      for (let i = 0; i < NB_PEERS; i++) {
        wcs[i] = new WebChannel({signaling})
        joined.set(i, [])
        if (i !== NB_PEERS - 1) {
          joinPromises.push(new Promise((resolve, reject) => {
            wcs[i].onJoining = (id) => {
              let joinedTab = joined.get(i)
              expect(joinedTab.indexOf(id)).toEqual(-1)
              joinedTab.push(id)
              if (joinedTab.length === NB_PEERS - i - 1) resolve()
            }
          }))
        }
      }

      Promise.all(joinPromises)
        .then(done)
        .catch(done.fail)

      let joinOneByOne = function (prom, index, key) {
        let i = index
        if (index === NB_PEERS) return prom
        return joinOneByOne(prom.then(() => wcs[i].join(key)), ++index, key)
      }
      wcs[0].open()
        .then((data) => joinOneByOne(Promise.resolve(), 1, data.key))
        .catch(done.fail)
    }, 45000)
  })

  describe('Should send/receive', () => {
    it('broadcast string message', (done) => {
      allMessagesAreSentAndReceived(wcs, msgs, String)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(msgs[i])
    })
  })
})

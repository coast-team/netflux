import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

describe('1 bot -> ', () => {
  let host = '127.0.0.1'
  let port = 9000
  let wcArray = []

  const NB_PEERS = 10

  xit('Should connect with the asking peer and all peers that connect after', (done) => {
    for (let i = 0; i < NB_PEERS; i++) {
      wcArray[i] = new WebChannel({signaling})
    }

    let joiningPeers = []
    wcArray[0].onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === NB_PEERS - 1) {
        for (var wc of wcArray) wc.leave()
        done()
      }
    }

    let addPeer = (data, i) => {
      if (i < NB_PEERS) {
        wcArray[i].join(data.key).then(() => {
          addPeer(data, i + 1)
        }).catch(done.fail)
      }
    }

    wcArray[0].addBotServer(host, port)
      .then(() => wcArray[0].open())
      .then((data) => addPeer(data, 1))
      .catch(done.fail)
  }, 5000)
})

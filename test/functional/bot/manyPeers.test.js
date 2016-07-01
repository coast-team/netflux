import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'


describe('1 bot -> ', () => {

  let host = '127.0.0.1'
  let port = 9000
  let wcArray = []

  const DEBUG_PING = 'DEBUG_PING'
  const DEBUG_PONG = 'DEBUG_PONG'
  const NB_PEERS = 3

  it('Should connect with the asking peer and all peers that connect after', (done) => {
    let counter = 0
    for (let i = 0; i < NB_PEERS; i++) {
      wcArray[i] = new WebChannel({signaling})
    }

    let joiningPeers = []
    wcArray[0].onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === NB_PEERS - 1) {
        for (var wc of wcArray)
          wc.leave()
        done()
      }
    }

    wcArray[0].addBotServer(host, port).then(() => {
      wcArray[0].openForJoining().then((data) => {
        for (let i = 1; i < NB_PEERS; i++) {
          wcArray[i].join(data.key).then(() => {}).catch(done.fail)
        }
      }).catch(done.fail)
    }).catch(done.fail)
  })
})

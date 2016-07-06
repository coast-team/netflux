import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

let host = '127.0.0.1'
let port = 9000
let wc1, wc2, idBotServer

const DEBUG_PING = 'DEBUG_PING'
const DEBUG_PONG = 'DEBUG_PONG'

describe('1 bot -> ', () => {
  it('Should connect with the asking peer and then an other peer should connect to the network', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 2) {
        wc1.leave()
        wc2.leave()
        done()
      }
    }

    wc1.addBotServer(host, port).then(() => {
      wc1.openForJoining().then((data) => {
        wc2.join(data.key).catch(done.fail)
      }).catch(done.fail)
    }).catch(done.fail)
  })

  it('Should send message PONG to all peer on the network', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})

    let messages = []
    let nbPong = 0
    wc1.onMessage = (id, message) => {
      messages.push({id, content: message})
      if (messages.length === 3) {
        for (var msg of messages) {
          if (msg.content === DEBUG_PONG) {
            if (typeof idBotServer === 'undefined') {
              idBotServer = msg.id
              nbPong++
            } else if (msg.id === idBotServer) nbPong++
          }
        }
        expect(nbPong).toBe(2)
        wc1.leave()
        wc2.leave()
        done()
      }
    }

    wc1.onJoining = (id) => {
      wc1.send(DEBUG_PING)
    }

    wc1.addBotServer(host, port).then(() => {
      wc1.openForJoining().then((data) => {
        wc2.join(data.key).then(() => {
          wc2.send(DEBUG_PING)
        }).catch(done.fail)
      }).catch(done.fail)
    }).catch(done.fail)
  })

  it('Should connect to an existing peer network of 2 peers by the one who open the gate', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 2) {
        wc1.leave()
        wc2.leave()
        done()
      }
    }

    wc1.openForJoining().then((data) => {
      wc2.join(data.key).then(() => {
        wc1.addBotServer(host, port).then(() => {}).catch(done.fail)
      }).catch(done.fail)
    }).catch(done.fail)
  })

  xit('Should connect to an existing peer network of 2 peers by the one who join', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 2) {
        wc1.leave()
        wc2.leave()
        done()
      }
    }

    wc1.openForJoining().then((data) => {
      wc2.join(data.key).then(() => {
        wc2.addBotServer(host, port).then(() => {}).catch(done.fail)
      }).catch(done.fail)
    }).catch(done.fail)
  })
})

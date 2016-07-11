import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

let host = '127.0.0.1'
let port = 9000
let wc1, wc2

const DEBUG_PING = 'DEBUG_PING'
const DEBUG_PONG = 'DEBUG_PONG'
const DEBUG_KICK = 'DEBUG_KICK'

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

    wc1.addBotServer(host, port)
      .then(() => wc1.open())
      .then((data) => wc2.join(data.key))
      .catch(done.fail)
  })

  it('Should send message PONG to all peer on the network', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})

    let cpt = 0

    wc1.onMessage = (id, message) => {
      if (message === DEBUG_PONG) {
        cpt++
        if (cpt === 3) done()
      }
    }

    wc2.onMessage = (id, message) => {
      if (message === DEBUG_PONG) {
        cpt++
        if (cpt === 3) done()
      }
    }

    wc1.addBotServer(host, port)
      .then(() => wc1.open())
      .then((data) => {
        wc1.send(DEBUG_PING)
        return wc2.join(data.key)
      })
      .then(() => wc2.send(DEBUG_PING))
      .catch(done.fail)
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

    wc1.open()
      .then((data) => wc2.join(data.key))
      .then(() => wc1.addBotServer(host, port))
      .catch(done.fail)
  })

  it('Should connect to an existing peer network of 2 peers by the one who join', (done) => {
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

    wc1.open()
      .then((data) => wc2.join(data.key))
      .then(() => wc2.addBotServer(host, port))
      .catch(done.fail)
  })

  it('Should be able to reconnect to a network after being kicked', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})

    let joiningPeers = []
    let first = true
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 2) {
        if (first) wc1.send(DEBUG_KICK)
        else wc1.send(DEBUG_PING)
        first = false
      }
    }

    wc1.onLeaving = (id) => {
      let index = joiningPeers.indexOf(id)
      joiningPeers.splice(index, 1)
      wc1.addBotServer(host, port).catch(done.fail)
    }

    wc1.onMessage = (id, message) => {
      expect(message).toBe(DEBUG_PONG)
      done()
    }

    wc1.open()
      .then((data) => wc2.join(data.key))
      .then(() => wc1.addBotServer(host, port))
      .catch(done.fail)
  })
})

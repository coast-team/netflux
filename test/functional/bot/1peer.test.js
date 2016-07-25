import {signaling} from 'config'
import WebChannel from 'src/WebChannel'

let host = '127.0.0.1'
let port = 9000
let wc

const DEBUG_PING = 'DEBUG_PING'
const DEBUG_PONG = 'DEBUG_PONG'
const DEBUG_KICK = 'DEBUG_KICK'

describe('1 peer -> ', () => {
  it('Should add the bot server ws://' + host + ':' + port, (done) => {
    wc = new WebChannel({signaling})

    wc.onJoining = (id) => {
      wc.leave()
      done()
    }

    wc.addBotServer(host, port).catch(done.fail)
  })

  it('Should send message PING to bot server and receive PONG', (done) => {
    wc = new WebChannel({signaling})

    wc.onJoining = (id) => {
      wc.send(DEBUG_PING)
    }

    wc.onMessage = (id, message) => {
      expect(message).toBe(DEBUG_PONG)
      done()
    }

    wc.addBotServer(host, port).catch(done.fail)
  })

  it('Should kick the bot server', (done) => {
    wc = new WebChannel({signaling})

    wc.onJoining = (id) => {
      wc.send(DEBUG_KICK)
    }

    wc.onLeaving = (id) => {
      done()
    }

    wc.onMessage = (id, message) => {
      console.log(message)
    }

    wc.addBotServer(host, port).catch(done.fail)
  })

  it('Should kick the bot server and try to reconnect with him after', (done) => {
    wc = new WebChannel({signaling})

    let first = true
    wc.onJoining = (id) => {
      if (first) wc.send(DEBUG_KICK)
      else wc.send(DEBUG_PING)
      first = false
    }

    wc.onLeaving = (id) => {
      wc.addBotServer(host, port).catch(done.fail)
    }

    wc.onMessage = (id, message) => {
      expect(message).toBe(DEBUG_PONG)
      done()
    }

    wc.addBotServer(host, port).catch(done.fail)
  })

  it('Should have a unique connection with a bot even if addBotServer has been called twice', (done) => {
    wc = new WebChannel({signaling})

    wc.onJoining = (id) => {
      done()
    }

    wc.addBotServer(host, port)
      .then(() => wc.addBotServer(host, port))
      .catch(done.fail)
  })
})

import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

let host = '127.0.0.1'
let port = 9000
let wc, idBotServer

const DEBUG_PING = 'DEBUG_PING'
const DEBUG_PONG = 'DEBUG_PONG'

describe('1 peer -> ', () => {
  it('Should add the bot server ws://' + host + ':' + port, (done) => {
    wc = new WebChannel({signaling})
    wc.onJoining = (id) => {
      wc.leave()
      done()
    }
    wc.addBotServer(host, port).then(() => {
      wc.channels.forEach((value) => {
        onJoining(value.peerId)
      })
    }).catch(done.fail)
  })

  it('Should send message PING to bot server and receive PONG', (done) => {
    wc = new WebChannel({signaling})
    wc.onJoining = (id) => {
      wc.send(DEBUG_PING)
    }
    wc.onMessage = (id, message) => {
      expect(message).toBe(DEBUG_PONG)
      wc.leave()
      done()
    }
    wc.addBotServer(host, port).then(() => {
      wc.channels.forEach((value) => {
        onJoining(value.peerId)
      })
    }).catch(done.fail)

  })
})

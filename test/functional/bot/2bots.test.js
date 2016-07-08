import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

let host = '127.0.0.1'
let port1 = 9000
let port2 = 9001
let wc

describe('1 peer -> ', () => {
  it('Should add 2 bots server', (done) => {
    wc = new WebChannel({signaling})
    let bots = []
    wc.onJoining = (id) => {
      bots.push(id)
      if (bots.length === 2) {
        wc.leave()
        done()
      }
    }
    wc.addBotServer(host, port1).then(() => {
      wc.addBotServer(host, port2).then(() => {}).catch(done.fail)
    }).catch(done.fail)
  })
})

import Bot from 'src/Bot'
import WebChannel from 'src/WebChannel'
import {signaling} from 'config'

describe('Node -> ', () => {
  it('Should be able to leave a webChannel', (done) => {
    let wc = new WebChannel({signaling})
    let host = '127.0.0.1'
    let port = 9090
    let bot = new Bot({host, port})

    wc.onLeaving = (id) => done()

    bot.listen()
      .then(() => wc.addBotServer(host, port))
      .then(() => {
        setTimeout(() => bot.leave(wc), 1000)
        bot.getServer().close()
      })
      .catch((reason) => done.fail(reason))
  })

  it('Should be able to leave 2 differents webChannels', (done) => {
    let wc1 = new WebChannel({signaling})
    let wc2 = new WebChannel({signaling})
    let host = '127.0.0.1'
    let port = 9090
    let bot = new Bot({host, port})
    let cpt = 0

    wc1.onLeaving = (id) => {
      cpt++
      if (cpt === 2) {
        bot.getServer().close()
        done()
      }
    }

    wc2.onLeaving = (id) => {
      cpt++
      if (cpt === 2) {
        bot.getServer().close()
        done()
      }
    }

    bot.listen()
      .then(() => wc1.addBotServer(host, port))
      .then(() => wc2.addBotServer(host, port))
      .then(() => setTimeout(() => bot.leave(wc1), 1000))
      .then(() => setTimeout(() => bot.leave(wc2), 1000))
      .catch((reason) => done.fail(reason))
  })
})

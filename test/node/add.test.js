import Bot from 'src/Bot'
import WebChannel from 'src/WebChannel'
import {signaling} from 'config'

const PING = 'ping'
const PONG = 'pong'

describe('Node -> ', () => {
  it('Should use addBotServer function when added in a Webchannel of 1 peer', (done) => {
    let wc = new WebChannel({signaling})
    let host = '127.0.0.1'
    let port = 9090
    let bot = new Bot({host, port})
    let addBotServer = false

    bot.onAddRequest = () => addBotServer = true

    bot.listen()
      .then(() => wc.addBotServer(host, port))
      .then(() => {
        bot.getServer().close()
        if (addBotServer) done()
        else done.fail()
      })
      .catch((reason) => done.fail(reason))
  })

  it('Should use addBotServer and newChannel functions when added in a Webchannel of 2 peers', (done) => {
    let wc1 = new WebChannel({signaling})
    let wc2 = new WebChannel({signaling})
    let host = '127.0.0.1'
    let port = 9090
    let bot = new Bot({host, port})
    let cpt = 0

    bot.onAddRequest = () => cpt++

    bot.onNewChannelRequest = () => cpt++

    bot.listen()
      .then(() => wc1.open())
      .then((data) => wc2.join(data.key))
      .then(() => wc1.addBotServer(host, port))
      .then(() => {
        bot.getServer().close()
        if (cpt === 2) done()
        else done.fail()
      })
      .catch((reason) => done.fail(reason))
  })

  it('Should have 2 distincts WebChannels when added in 2 differents WebChannels', (done) => {
    let wc1 = new WebChannel({signaling})
    let wc2 = new WebChannel({signaling})
    let host = '127.0.0.1'
    let port = 9090
    let bot = new Bot({host, port})

    bot.listen()
      .then(() => wc1.addBotServer(host, port))
      .then(() => wc2.addBotServer(host, port))
      .then(() => {
        let nbWc = bot.getWebChannels().length
        bot.getServer().close()
        if (nbWc === 2) done()
        else done.fail()
      })
      .catch((reason) => done.fail(reason))
  })

  it('Should be able to redefined functions when added in a WebChannel', (done) => {
    let wc = new WebChannel({signaling})
    let host = '127.0.0.1'
    let port = 9090
    let bot = new Bot({host, port})

    bot.onWebChannel = (webChannel) => {
      webChannel.onMessage = (id, message) => {
        if (message === PING) webChannel.send(PONG)
      }
    }

    wc.onMessage = (id, message) => {
      if (message === PONG) {
        bot.getServer().close()
        done()
      }
    }

    bot.listen()
      .then(() => wc.addBotServer(host, port))
      .then(() => setTimeout(() => wc.send(PING), 1000))
      .catch((reason) => done.fail(reason))
  })
})

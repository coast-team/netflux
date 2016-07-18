import {Bot} from '../../src/Bot'

describe('Node -> ', () => {
  it('Should be able to instanciate a bot ', (done) => {
    let bot
    try {
      bot = new Bot()
      done()
    } catch (err) {
      done.fail(err)
    }
  })

  it('Should be able to listen to a certain host and port', (done) => {
    let bot = new Bot()
    let host, port

    host = '127.0.0.1'
    port = 9090

    bot.listen({host, port})
      .then(() => {
        bot.getServer().close()
        done()
      })
      .catch((reason) => {
        done.fail(reason)
      })
  })
})

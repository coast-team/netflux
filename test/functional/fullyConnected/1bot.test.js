import {itNode} from 'utils/helper'
import Bot from 'src/Bot'

describe('🤖', () => {
  itNode(false, 'Should listen to the specified host and port', done => {
    let bot = new Bot()
    let host = '127.0.0.1'
    let port = 9090

    bot.listen({host, port})
      .then(() => {
        bot.stopListen()
        done()
      })
      .catch(done.fail)
  })
})

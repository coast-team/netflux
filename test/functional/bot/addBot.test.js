import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'
import {Bot} from '../../../src/Bot'

describe('1 browser -> ', () => {
  it('Should not be able to instanciate a bot ', (done) => {
    try {
      let bot = new Bot()
      done.fail('Bot can be instanciate only in Node\'s environment')
    } catch (err) {
      done()
    }
  })
})

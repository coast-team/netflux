import {signaling} from '../../config'
import WebSocketService from '../../../src/service/channelBuilder/WebSocketService'

function randKey () {
  const MIN_LENGTH = 5
  const DELTA_LENGTH = 0
  const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH)

  for (let i = 0; i < length; i++) {
    result += MASK[Math.round(Math.random() * (MASK.length - 1))]
  }
  return result
}

describe('WebSocketService ->', () => {
  let webSocketService = new WebSocketService({signaling})
  it('Open: should failed because not implemented', (done) => {
    webSocketService.open(randKey(), () => {}).then((data) => { done.fail() })
      .catch(done)
  })

  it('Join: should failed because not implemented', (done) => {
    webSocketService.join(randKey(), () => {}).then((data) => { done.fail() })
      .catch(done)
  })
})

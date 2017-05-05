import { WebSocketService } from 'src/service/WebSocketService'
import { SIGNALING_URL } from 'util/helper'

describe('WebSocketService', () => {
  const GOOD_URL = SIGNALING_URL
  const WRONG_URL = 'https://github.com:8100/coast-team/netflux'
  const webSocketService = new WebSocketService(42)

  it(`Should open a socket with ${GOOD_URL}`, done => {
    webSocketService.connect(GOOD_URL)
      .then(ws => ws.close(1000))
      .then(done)
      .catch(done.fail)
  })

  it(`Should fail to open a socket with: ${WRONG_URL}`, done => {
    webSocketService.connect(WRONG_URL)
      .then(done.fail)
      .catch(done)
  })
})

import WebSocketService from 'src/service/WebSocketService'
import * as helper from 'util/helper'

describe('WebSocketService', () => {
  const LOCAL_SERVER = helper.SIGNALING_URL
  const WRONG_URL = 'https://github.com:8100/coast-team/netflux'
  const webSocketService = new WebSocketService()
  let socket = {}

  afterEach(() => {
    if ('readyState' in socket && socket.readyState === socket.OPEN) socket.close()
  })

  it(`Should open a socket with ${LOCAL_SERVER}`, done => {
    webSocketService.connect(LOCAL_SERVER)
      .then(ws => ws.close())
      .then(done)
      .catch(done.fail)
  })

  it(`Should fail to open a socket with: ${WRONG_URL}`, done => {
    webSocketService.connect(WRONG_URL)
      .then(data => done.fail('Connection succeed'))
      .catch(done)
  })
})

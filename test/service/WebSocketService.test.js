import WebSocketService, {OPEN} from 'src/service/WebSocketService'

describe('WebSocketService', () => {
  const ONLINE_SERVER = 'ws://sigver-coastteam.rhcloud.com:8000'
  const ONLINE_SECURE_SERVER = 'wss://sigver-coastteam.rhcloud.com:8443'
  const LOCAL_SERVER = 'ws://localhost:8000'
  const WRONG_URL = 'https://github.com:8100/coast-team/netflux'
  let webSocketService = new WebSocketService()
  let socket = {}

  afterEach(() => {
    if ('readyState' in socket && socket.readyState === OPEN) socket.close()
  })

  it(`Should open a socket with ${LOCAL_SERVER}`, (done) => {
    webSocketService.connect(LOCAL_SERVER)
      .then((ws) => {
        socket = ws
        done()
      })
      .catch(done.fail)
  })

  it(`Should open a socket with ${ONLINE_SERVER}`, (done) => {
    webSocketService.connect(ONLINE_SERVER)
      .then((ws) => {
        socket = ws
        done()
      })
      .catch(done.fail)
  }, 10000)

  it(`Should open a socket with ${ONLINE_SECURE_SERVER}`, (done) => {
    webSocketService.connect(ONLINE_SECURE_SERVER)
      .then((ws) => {
        socket = ws
        done()
      })
      .catch(done.fail)
  }, 10000)

  it(`Should fail to open a socket with: ${WRONG_URL}`, (done) => {
    webSocketService.connect(WRONG_URL)
      .then((data) => done.fail('Connection succeed'))
      .catch(done)
  }, 10000)
})

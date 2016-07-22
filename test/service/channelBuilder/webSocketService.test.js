import WebSocketService from 'src/service/WebSocketService'

describe('WebSocketService ->', () => {
  const ONLINE_WSSERVER = 'ws://sigver-coastteam.rhcloud.com:8000'
  const LOCAL_WSSERVER = 'ws://localhost:8000'
  const WRONG_URL = 'https://github.com:8100/coast-team/netflux'

  it(`Should open a socket with ${LOCAL_WSSERVER}`, (done) => {
    new WebSocketService().connect(LOCAL_WSSERVER)
    .then(done)
    .catch(done.fail)
  })

  it(`Should open a socket with ${ONLINE_WSSERVER}`, (done) => {
    new WebSocketService().connect(ONLINE_WSSERVER)
      .then(done)
      .catch(done.fail)
  }, 10000)

  it(`Should fail to open a socket with: ${WRONG_URL}`, (done) => {
    new WebSocketService().connect(WRONG_URL)
			.then((data) => done.fail('Connection succeed'))
			.catch(done)
  })
})

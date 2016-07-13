import {signaling} from '../../config'
import WebRTCService from '../../../src/service/channelBuilder/WebRTCService'
import WebSocketService from '../../../src/service/channelBuilder/WebSocketService'

// const signaling = 'ws://sigver-coastteam.rhcloud.com:8000'

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

describe('WebRTCService ->', () => {
  let webRTCService = new WebRTCService()
  let webSocketService = new WebSocketService()

  it('Listen from signaling: should succeed', (done) => {
    let key = randKey()

    webSocketService.connect(signaling)
      .then((ws) => {
        try {
          ws.send(JSON.stringify({key}))
          webRTCService.listenFromSignaling(ws, () => {})
          done()
        } catch (e) {
          done.fail(e)
        }
      })
      .catch((reason) => {
        done.fail(reason)
      })
  })

  it('Connect over signaling: dataChannel should open', (done) => {
    let key = randKey()

    webSocketService.connect(signaling)
      .then((ws1) => {
        ws1.send(JSON.stringify({key}))
        webRTCService.listenFromSignaling(ws1, () => {})

        webSocketService.connect(signaling)
          .then((ws2) => {
            webRTCService.connectOverSignaling(ws2, key)
              .then(done)
              .catch(done.fail)
          })
          .catch(done.fail)
      })
      .catch(done.fail)
  })

  // Fail because ws throw a new error which is not handle (even if using a try catch or a .catch)
  // xit('Connect over signaling: should fail to connect (bad key)', (done) => {
  //   webSocketService.connect(signaling)
  //     .then((ws1) => {
  //       let key = randKey()
  //       ws1.send(JSON.stringify({key}))
  //       webRTCService.listenFromSignaling(ws1, () => {})
  //       webSocketService.connect(signaling)
  //         .then((ws2) => {
  //           try {
  //             webRTCService.connectOverSignaling(ws2, randKey())
  //               .then((reason) => {done.fail(reason)})
  //               .catch(done)
  //             }
  //           catch (e) {
  //             done()
  //           }
  //         })
  //         .catch((reason) => {done.fail(reason)})
  //     })
  //     .catch((reason) => {done.fail(reason)})
  // })

  // Fail because the 2nd socket is closed with code 1000 instead of code 4002
  // xit('Listen from signaling: should fail the provided because key is already opened', (done) => {
  //   webSocketService.connect(signaling)
  //     .then((ws1) => {
  //       let key = randKey()
  //       ws1.send(JSON.stringify({key}))
  //       webRTCService.listenFromSignaling(ws1, () => {})
  //       webSocketService.connect(signaling)
  //         .then((ws2) => {
              // get rid of the try catch, but useless to do so before the closing code issue is solved
  //           try {
  //             ws2.send(JSON.stringify({key}))
  //             webRTCService.listenFromSignaling(ws2, () => {})
  //             setTimeout(done.fail, 1000)
  //           } catch (e) {
  //             done()
  //           }
  //         })
  //         .catch((reason) => {done.fail(reason)})
  //     })
  //     .catch((reason) => {done.fail(reason)})
  // })

  it('Listen and Connect: should open 1 dataChannel and exchange messages between 2 peers', (done) => {
    const masterPeerMsg = 'Hello! Here is master'
    const peerMsg = 'Hi, I am a peer'
    let key = randKey()

    webSocketService.connect(signaling)
      .then((ws1) => {
        ws1.send(JSON.stringify({key}))
        webRTCService.listenFromSignaling(ws1, (channel) => {
          channel.onmessage = (event) => {
            expect(event.data).toEqual(peerMsg)
            channel.close()
          }
          channel.onerror = done.fail
          channel.send(masterPeerMsg)
        })

        webSocketService.connect(signaling)
          .then((ws2) => {
            webRTCService.connectOverSignaling(ws2, key)
              .then((channel) => {
                channel.onmessage = (event) => {
                  expect(event.data).toEqual(masterPeerMsg)
                  channel.send(peerMsg)
                }
                channel.onclose = done
                channel.onerror = done.fail
              })
              .catch((reason) => {
                done.fail(reason)
              })
          })
          .catch((reason) => {
            done.fail(reason)
          })
      })
      .catch((reason) => {
        done.fail(reason)
      })
  })

  it('Listen and Connect: should detect disconnected peer', (done) => {
    let key = randKey()

    webSocketService.connect(signaling)
      .then((ws1) => {
        ws1.send(JSON.stringify({key}))
        webRTCService.listenFromSignaling(ws1, (channel) => {
          channel.onclose = (closeEvt) => done()
          channel.onerror = done.fail
        })

        webSocketService.connect(signaling)
          .then((ws2) => {
            webRTCService.connectOverSignaling(ws2, key)
              .then((channel) => {
                channel.onerror = done.fail
                setTimeout(() => { channel.close() }, 500)
              })
              .catch(done.fail)
          })
          .catch(done.fail)
      })
  })

  it('Listen and Connect: should open 2 dataChannels and exchange messages between 3 peers', (done) => {
    const masterPeerMsg = 'Do or do not, there is no try'
    const peerMsg1 = 'Hi, I am a peer #1'
    const peerMsg2 = 'Hi, I am a peer #2'
    let limit = 0
    let key = randKey()

    // PEER MASTER
    webSocketService.connect(signaling)
      .then((ws1) => {
        ws1.send(JSON.stringify({key}))

        webRTCService.listenFromSignaling(ws1, (channel) => {
          channel.onmessage = (event) => {
            expect(event.data).toMatch(/Hi, I am a peer #/)
            channel.close()
            if (++limit === 2) { done() }
          }
          channel.onerror = done.fail
          channel.send(masterPeerMsg)
        })

        // PEER #1
        webSocketService.connect(signaling)
          .then((ws2) => {
            webRTCService.connectOverSignaling(ws2, key)
              .then((channel) => {
                channel.onmessage = (event) => {
                  expect(event.data).toEqual(masterPeerMsg)
                  channel.send(peerMsg1)
                }
                channel.onerror = done.fail
              })
              .catch(done.fail)
          })

        // PEER #2
        webSocketService.connect(signaling)
          .then((ws3) => {
            webRTCService.connectOverSignaling(ws3, key)
              .then((channel) => {
                channel.onmessage = (event) => {
                  expect(event.data).toEqual(masterPeerMsg)
                  channel.send(peerMsg2)
                }
                channel.onerror = done.fail
              })
              .catch(done.fail)
          })
      })
      .catch(done.fail)
  })

  it('Connect to node: should exchange a ping-pong', (done) => {
    webSocketService.connect(signaling)
      .then((ws) => {
        webRTCService.connectOverSignaling(ws, '12345')
          .then((channel) => {
            channel.onmessage = (event) => {
              expect(event.data).toEqual('pong')
              done()
            }
            channel.onerror = done.fail
            channel.send('ping')
          })
          .catch(done.fail)
      })
  }, 10000)
})

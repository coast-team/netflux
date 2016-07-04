import {signaling} from '../../config'
import WebRTCService from '../../../src/service/channelBuilder/WebRTCService'

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
  let webRTCService = new WebRTCService({signaling})

  it('Open: should succeed and return the provided key', (done) => {
    let key = randKey()
    console.log("\n\nI'm 1")
    webRTCService.open(key, () => {})
      .then((data) => {
        expect(data.key).toBeDefined()
        expect(data.url).toBeDefined()
        expect(data.key).toEqual(key)
        done()
      })
      .catch((reason) => {
        console.log('Error: ' + reason)
        done.fail(reason)
      })
  })

  it('Open: should fail because of the wrong URL', (done) => {
    console.log("\n\nI'm 2")
    webRTCService.open(randKey(), () => {}, {
      signaling: 'https://github.com:8100/coast-team/netflux'
    }).then((data) => { done.fail() })
      .catch(done)
  })

  it('Open: should fail because the provided key is already opened', (done) => {
    let key = randKey()
    console.log("\n\nI'm 3")
    webRTCService.open(key, () => {})
      .then((data) => {
        webRTCService.open(key, () => {})
          .then((reason) => {
            console.log('FAILED -----> ', reason)//JSON.stringify(reason))
            done.fail(reason)
          })
          .catch(done)
      })
      .catch(done.fail)
  })

  it('Join: dataChannel should open', (done) => {
    console.log("\n\nI'm 4")
    webRTCService.open(randKey(), () => {})
      .then((data) => {
        webRTCService.join(data.key).then(done).catch(done.fail)
      })
  })

  it('Join: should fail because of the wrong key', (done) => {
    console.log("\n\nI'm 5")
    webRTCService.open(randKey(), () => {})
      .then((data) => {
        webRTCService.join(randKey()).then(done.fail).catch(done)
      })
  })

  it('Join: should fail because of the wrong URL', (done) => {
    console.log("\n\nI'm 6")
    webRTCService.open(randKey(), () => {}).then((data) => {
      webRTCService.join(randKey(), {
        signaling: 'https://github.com:8100/coast-team/netflux'
      }).then(done.fail).catch(done)
    })
  })

  it('Open & Join: should detect disconnected peer', (done) => {
    console.log("\n\nI'm 7")
    webRTCService.open(randKey(), (channel) => {
      channel.onclose = (closeEvt) => done()
      channel.onerror = done.fail
    })
      .then((data) => {
        webRTCService.join(data.key)
          .then((channel) => {
            channel.onerror = done.fail
            setTimeout(() => { channel.close() }, 500)
          })
          .catch(done.fail)
      })
      .catch(done.fail)
  })

  it('Open & Join: should open 1 dataChannel and exchange messages between 2 peers', (done) => {
    console.log("\n\nI'm 8")
    const masterPeerMsg = 'Hello! Here is master'
    const peerMsg = 'Hi, I am a peer'
    webRTCService.open(randKey(), (channel) => {
      channel.onmessage = (event) => {
        expect(event.data).toEqual(peerMsg)
        channel.close()
      }
      channel.onerror = done.fail
      channel.send(masterPeerMsg)
    })
      .then((data) => {
        webRTCService.join(data.key)
          .then((channel) => {
            channel.onmessage = (event) => {
              expect(event.data).toEqual(masterPeerMsg)
              channel.send(peerMsg)
            }
            channel.onclose = done
            channel.onerror = done.fail
          })
          .catch(done.fail)
      })
      .catch(done.fail)
  })

  it('Open & Join: should open 2 dataChannels and exchange messages between 3 peers', (done) => {
    console.log("\n\nI'm 9")
    const masterPeerMsg = 'Do or do not, there is no try'
    const peerMsg1 = 'Hi, I am a peer #1'
    const peerMsg2 = 'Hi, I am a peer #2'
    let limit = 0

    // PEER MASTER
    webRTCService.open(randKey(), (channel) => {
      channel.onmessage = (event) => {
        expect(event.data).toMatch(/Hi, I am a peer #/)
        channel.close()
        if (++limit === 2) { done() }
      }
      channel.onerror = done.fail
      channel.send(masterPeerMsg)
    })
      .then((data) => {
        // PEER #1
        webRTCService.join(data.key)
          .then((channel) => {
            channel.onmessage = (event) => {
              expect(event.data).toEqual(masterPeerMsg)
              channel.send(peerMsg1)
            }
            channel.onerror = done.fail
          })
          .catch(done.fail)

        // PEER #2
        webRTCService.join(data.key)
          .then((channel) => {
            channel.onmessage = (event) => {
              expect(event.data).toEqual(masterPeerMsg)
              channel.send(peerMsg2)
            }
            channel.onerror = done.fail
          })
          .catch(done.fail)
      })
      .catch(done.fail)
  })
})

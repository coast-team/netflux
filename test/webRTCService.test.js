import WebRTCService from '../src/service/channelBuilder/WebRTCService'
import WebChannel from '../src/WebChannel'

const signaling = 'ws://localhost:8000'
// const signaling = 'ws://sigver-coastteam.rhcloud.com:8000'

describe('WebRTCService ->', () => {
  let webRTCService = new WebRTCService({signaling})
  let wc1
  let wc2
  beforeEach(function () {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})
  })

  describe('Master & 1 client connection ->', () => {
    describe('open ->', () => {
      it('Should succed', () => {
        let data = webRTCService.open(wc1, wc1.generateId(), () => {
        })
        expect(data.signaling).toBeDefined()
      })

      it('DataChannel with the specified key should open', (done) => {
        let label
        let data = webRTCService.open(wc1, wc1.generateId(), (dc) => {
          expect(dc.label).toBe(label)
          done()
        })
        label = data.key
        webRTCService.join(wc2, data.key)
      })

      it('With wrong url: catch - should throw an exception', () => {
        expect(() => {
          webRTCService.open(wc1, wc1.generateId(), () => {
          }, {
            signaling: 'https://github.com:8100/coast-team/netflux'
          })
        }).toThrow()
      })

      it('With incorrect url syntax: catch - should throw an Error', () => {
        expect(() => {
          webRTCService.open(wc1, wc1.generateId(), () => {
          }, {
            signaling: 'https://github.com:8100/coast-team/netflux'
          })
        }).toThrow()
      })
    })

    describe('join ->', () => {
      it('DataChannel should open', (done) => {
        let data = webRTCService.open(wc1, wc1.generateId(), () => {
        })
        webRTCService.join(wc2, data.key).then(done).catch(done.fail)
      })

      it('With wrong url: catch - should throw an exception', (done) => {
        webRTCService.join(wc2, 'some key', {
          signaling: 'https://github.com:8100/coast-team/netflux'
        }).then(done.fail).catch(done)
      })

      it('With incorrect url syntax: catch - should throw an Error', (done) => {
        webRTCService
          .join(wc2, 'some key', {
            signaling: 'https://github.com:8100/coast-team/netflux'
          })
          .then(done.fail)
          .catch((e) => {
            expect(e instanceof Error).toBeTruthy()
            expect(e.name).toBe('SyntaxError')
            expect(e.code).toBe(12)
            done()
          })
      })
    })

    describe('open & join ->', () => {
      it('Master establish connection with 1 client and send/receive a message', (done) => {
        let masterMsg = 'Hello! Here is master'
        let clientMsg = 'Hi, I am peer #2'
        let data = webRTCService.open(wc1, wc1.generateId(), (channel) => {
          channel.send(masterMsg)
          channel.onmessage = (event) => {
            expect(event.data).toEqual(clientMsg)
            channel.close()
          }
          channel.onerror = done.fail
        })
        webRTCService
          .join(wc2, data.key)
          .then((channel) => {
            channel.onmessage = (event) => {
              expect(event.data).toEqual(masterMsg)
              channel.send(clientMsg)
            }
            channel.onclose = done
            channel.onerror = done.fail
          })
          .catch(done.fail)
      })
    })
  })

  describe('Master & 2 clients connection ->', () => {
    describe('open & join ->', () => {
      it('Master should establish connection with two clients and send/receive a few messages', (done) => {
        let wc3 = new WebChannel({signaling})
        let masterMsg = 'Hello! Here is master'
        let client1Msg = 'Hi, I am client #1'
        let client2Msg = 'Hi, I am client #2'
        const MSG_LIMIT = 2
        let limit = 0
        let data = webRTCService.open(wc1, wc1.generateId(), (channel) => {
          channel.send(masterMsg)
          channel.onmessage = (event) => {
            expect(event.data).toMatch(/Hi, I am client #/)
            channel.close()
            if (++limit === MSG_LIMIT) { done() }
          }
          channel.onerror = done.fail
        })

        // Client #1 is trying to connect
        webRTCService
          .join(wc2, data.key)
          .then((channel) => {
            channel.onmessage = (event) => {
              expect(event.data).toEqual(masterMsg)
              channel.send(client1Msg)
            }
            channel.onerror = done.fail
          })
          .catch(done.fail)

        // Client #2 is trying to connect
        webRTCService
          .join(wc3, data.key)
          .then((channel) => {
            channel.onmessage = (event) => {
              expect(event.data).toEqual(masterMsg)
              channel.send(client2Msg)
            }
            channel.onerror = done.fail
          })
          .catch(done.fail)
      })
    })
  })
})

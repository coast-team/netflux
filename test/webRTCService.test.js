import WebRTCService from '../src/services/connectors/WebRTCService'

const signaling = 'ws://localhost:8000'
// const signaling = 'ws://sigver-coastteam.rhcloud.com:8000'

describe('WebRTCService ->', () => {
  describe('_randomKey ->', () => {
    it('Two random strings should be different', () => {
      let webRTCService = new WebRTCService({signaling})
      let TEST_COUNTER = 10
      for (let i = 0; i < TEST_COUNTER; i++) {
        let str1 = webRTCService._randomKey()
        let str2 = webRTCService._randomKey()
        expect(str1).not.toBe(str2)
      }
    })
  })

  describe('Master & 1 client connection ->', () => {
    let webRTCService1, webRTCService2
    beforeEach(() => {
      webRTCService1 = new WebRTCService({signaling})
      webRTCService2 = new WebRTCService({signaling})
    })

    describe('open ->', () => {
      it('Should succed', (done) => {
        webRTCService1
          .open(() => {})
          .then((data) => {
            expect(true).toBeTruthy()
            done()
          })
          .catch(done.fail)
      })

      it('DataChannel with the specified key should open', (done) => {
        let label
        webRTCService1
          .open((dc) => {
            expect(dc.label).toBe(label)
            done()
          })
          .then((data) => {
            label = data.key
            webRTCService2.join(data.key)
          })
          .catch(done.fail)
      })

      it('With wrong url: catch - should throw an exception', (done) => {
        webRTCService1 = new WebRTCService({
          signaling: 'ws://localhost:8100'
        })
        webRTCService1
          .open(() => {})
          .then((data) => { done.fail() })
          .catch((e) => {
            expect(true).toBeTruthy()
            done()
          })
      })

      it('With incorrect url syntax: catch - should throw DOMException', (done) => {
        webRTCService1 = new WebRTCService({
          signaling: 'https://github.com:8100/coast-team/netflux'
        })
        webRTCService1
          .open(() => {})
          .then((data) => { done.fail() })
          .catch((e) => {
            expect(e instanceof DOMException).toBeTruthy()
            expect(e.name).toBe('SyntaxError')
            expect(e.code).toBe(12)
            done()
          })
      })
    })

    describe('join ->', () => {
      it('DataChannel should open', (done) => {
        webRTCService1
          .open(() => {})
          .then((data) => {
            webRTCService2
              .join(data.key)
              .then((dc) => {
                expect(true).toBeTruthy()
                done()
              })
              .catch(done.fail)
          })
          .catch(done.fail)
      })

      it('With wrong url: catch - should throw an exception', (done) => {
        webRTCService2 = new WebRTCService({
          signaling: 'https://github.com:8100/coast-team/netflux'
        })
        webRTCService2
          .join('some key')
          .then((data) => { done.fail() })
          .catch((e) => {
            expect(true).toBeTruthy()
            done()
          })
      })

      it('With incorrect url syntax: catch - should throw DOMException', (done) => {
        webRTCService2 = new WebRTCService({
          signaling: 'https://github.com:8100/coast-team/netflux'
        })
        webRTCService2
          .join('some key')
          .then((data) => { done.fail() })
          .catch((e) => {
            expect(e instanceof DOMException).toBeTruthy()
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
        webRTCService1
          .open((channel) => {
            channel.send(masterMsg)
            channel.onmessage = (event) => {
              expect(event.data).toEqual(clientMsg)
              channel.close()
            }
            channel.onerror = done.fail
          })
          .then((data) => {
            webRTCService2
              .join(data.key)
              .then((channel) => {
                channel.onmessage = (event) => {
                  expect(event.data).toEqual(masterMsg)
                  channel.send(clientMsg)
                }
                channel.onclose = (event) => { done() }
                channel.onerror = done.fail
              })
              .catch(done.fail)
          })
          .catch(done.fail)
      })
    })
  })

  describe('Master & 2 clients connection ->', () => {
    let webRTCService1, webRTCService2, webRTCService3
    beforeEach(() => {
      webRTCService1 = new WebRTCService({signaling})
      webRTCService2 = new WebRTCService({signaling})
      webRTCService3 = new WebRTCService({signaling})
    })

    describe('open & join ->', () => {
      it('Master should establish connection with two clients and send/receive a few messages', (done) => {
        let masterMsg = 'Hello! Here is master'
        let client1Msg = 'Hi, I am client #1'
        let client2Msg = 'Hi, I am client #2'
        const MSG_LIMIT = 2
        let limit = 0
        webRTCService1
          .open((channel) => {
            channel.send(masterMsg)
            channel.onmessage = (event) => {
              expect(event.data).toMatch(/Hi, I am client #/)
              channel.close()
              if (++limit === MSG_LIMIT) { done() }
            }
            channel.onerror = done.fail
          })
          .then((data) => {
            // Client #1 is trying to connect
            webRTCService2
              .join(data.key)
              .then((channel) => {
                channel.onmessage = (event) => {
                  expect(event.data).toEqual(masterMsg)
                  channel.send(client1Msg)
                }
                channel.onerror = done.fail
              })
              .catch(done.fail)

            // Client #2 is trying to connect
            webRTCService3
              .join(data.key)
              .then((channel) => {
                channel.onmessage = (event) => {
                  expect(event.data).toEqual(masterMsg)
                  channel.send(client2Msg)
                }
                channel.onerror = done.fail
              })
              .catch(done.fail)
          })
          .catch(done.fail)
      })
    })
  })
})

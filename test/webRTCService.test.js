import { WebRTCService } from '../src/webRTCService.js'

const signaling = 'ws://localhost:8000'

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

  describe('connection between two peers via dataChannel ->', () => {
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
          .catch((e) => { done.fail(e) })
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
              .catch((e) => { done.fail(e) })
          })
          .catch((e) => { done.fail(e) })
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
      it('Message should be sent and received via dataChannel then close it', (done) => {
        let peer1Msg = 'Hello! Here is peer #1'
        let peer2Msg = 'Hi, I am peer #2'
        webRTCService1
          .open((channel) => {
            channel.onmessage = (event) => {
              expect(event.data).toEqual(peer2Msg)
              channel.close()
            }
            channel.onerror = (e) => { done.fail(e) }
            channel.send(peer1Msg)
          })
          .then((data) => {
            webRTCService2
              .join(data.key)
              .then((channel) => {
                channel.onmessage = (event) => {
                  expect(event.data).toEqual(peer1Msg)
                  channel.send(peer2Msg)
                }
                channel.onclose = (event) => {
                  expect(true).toBeTruthy()
                  done()
                }
                channel.onerror = (e) => { done.fail(e) }
              })
              .catch((e) => { done.fail(e) })
          })
          .catch((e) => { done.fail(e) })
      })
    })
  })
})

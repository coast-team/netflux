import { WebRTCService } from '../src/webRTCService.js'

const signalling = 'ws://localhost:8000'

describe('WebRTCService ->', () => {
  describe('_randomKey', () => {
    it('two random strings should be different', () => {
      let webRTCService = new WebRTCService({signalling})
      let TEST_COUNTER = 10
      for (let i = 0; i < TEST_COUNTER; i++) {
        let str1 = webRTCService._randomKey()
        let str2 = webRTCService._randomKey()
        expect(str1).not.toBe(str2)
      }
    })
  })

  describe('Connection between two peers via dataChannel ->', () => {
    let webRTCService1, webRTCService2
    beforeEach(() => {
      webRTCService1 = new WebRTCService({signalling})
      webRTCService2 = new WebRTCService({signalling})
    })

    describe('open', () => {
      it('should return an URL', (done) => {
        webRTCService1
          .open(() => {})
          .then((data) => {
            expect(true).toBeTruthy()
            done()
          })
          .catch((e) => {
            expect(true).toBeFalsy()
            done.fail(e)
          })
      })

      it('should receive a dataChannel with specified key', (done) => {
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

      it('with wrong url: catch - should throw an exception', (done) => {
        webRTCService1 = new WebRTCService({
          signalling: 'ws://localhost:8100'
        })
        webRTCService1
          .open(() => {})
          .then((data) => {
            expect(true).toBeFalsy()
            done.fail()
          })
          .catch((e) => {
            expect(true).toBeTruthy()
            done()
          })
      })

      it('with incorrect url syntax: catch - should throw DOMException', (done) => {
        webRTCService1 = new WebRTCService({
          signalling: 'https://github.com:8100/coast-team/netflux'
        })
        webRTCService1
          .open(() => {})
          .then((data) => {
            expect(true).toBeFalsy()
            done.fail()
          })
          .catch((e) => {
            expect(e instanceof DOMException).toBeTruthy()
            expect(e.name).toBe('SyntaxError')
            expect(e.code).toBe(12)
            done()
          })
      })
    })

    describe('join', () => {
      it('dataChannel should be open', (done) => {
        webRTCService1
          .open(() => {})
          .then((data) => {
            webRTCService2
              .join(data.key)
              .then((dc) => {
                expect(true).toBeTruthy()
                done()
              })
              .catch((e) => {
                done.fail(e)
              })
          })
          .catch((e) => {
            done.fail(e)
          })
      })

      it('with wrong url: catch - should throw an exception', (done) => {
        webRTCService2 = new WebRTCService({
          signalling: 'https://github.com:8100/coast-team/netflux'
        })
        webRTCService2
          .join('some key')
          .then((data) => {
            expect(true).toBeFalsy()
            done.fail()
          })
          .catch((e) => {
            expect(true).toBeTruthy()
            done()
          })
      })

      it('with incorrect url syntax: catch - should throw DOMException', (done) => {
        webRTCService2 = new WebRTCService({
          signalling: 'https://github.com:8100/coast-team/netflux'
        })
        webRTCService2
          .join('some key')
          .then((data) => {
            expect(true).toBeFalsy()
            done.fail()
          })
          .catch((e) => {
            expect(e instanceof DOMException).toBeTruthy()
            expect(e.name).toBe('SyntaxError')
            expect(e.code).toBe(12)
            done()
          })
      })
    })

    describe('open & join', () => {
      it('Message should be sent and received via dataChannel', (done) => {
        let peer1Msg = 'Hello! Here is peer #1'
        let peer2Msg = 'Hi, I am peer #2'
        webRTCService1
          .open((dc) => {
            dc.send(peer1Msg)
            dc.onmessage = (event) => {
              expect(event.data).toEqual(peer2Msg)
              dc.close()
            }
            dc.onclose = (event) => {
              expect(true).toBeTruthy()
            }
          })
          .then((data) => {
            webRTCService2
              .join(data.key)
              .then((dc) => {
                dc.onmessage = (event) => {
                  expect(event.data).toEqual(peer1Msg)
                  dc.send(peer2Msg)
                }
                dc.onclose = (event) => {
                  expect(true).toBeTruthy()
                  done()
                }
              })
              .catch((e) => {
                done.fail(e)
              })
          })
          .catch((e) => {
            done.fail(e)
          })
      })
    })
  })
})

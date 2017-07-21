import { Signaling } from 'src/Signaling'
import * as helper from 'util/helper'

describe('Signaling', () => {
  const WebChannelMock = class {
    constructor (onClose = () => {}) {
      this.onClose = onClose
      this.settings = {iceServers: {}}
    }
  }
  run(`through WebSocket ${helper.SIGNALING_URL}`, helper.SIGNALING_URL)
  // run(`through EventSource ${helper.SIGNALING_URL_EVENT_SOURCE}`, helper.SIGNALING_URL_EVENT_SOURCE)
  function run (title, url) {
    const signalingURL = url

    describe(title, () => {
      it('Gate should be closed after construction', () => {
        const signalingGate = new Signaling(new WebChannelMock(), () => {})
        expect(signalingGate.isOpen()).toBeFalsy()
        expect(signalingGate.stream).toBeNull()
        expect(signalingGate.key).toBeNull()
        expect(signalingGate.url).toBeNull()
      })

      it('Should generate different keys', () => {
        const signalingGate = new Signaling(new WebChannelMock(), () => {})
        const key1 = signalingGate.generateKey()
        const key2 = signalingGate.generateKey()
        expect(key1).not.toEqual(key2)
      })

      it('Should open 2 gates with the same key', done => {
        const sg1 = new Signaling(new WebChannelMock(), () => {})
        const sg2 = new Signaling(new WebChannelMock(), () => {})
        sg1.open(signalingURL)
          .then(openData => sg2.open(signalingURL, openData.key))
          .then(() => {
            sg1.close()
            sg2.close()
            done()
          })
          .catch(done.fail)
      })

      describe('Open with auto generated key', () => {
        const webChannelMock = new WebChannelMock()
        const sg = new Signaling(webChannelMock, () => {})
        let openData

        it('Should open the gate', done => {
          sg.open(signalingURL)
            .then(data => {
              openData = data
              expect(data.key).toBeDefined()
              expect(data.url).toBeDefined()
              expect(data.url).toEqual(signalingURL)
              done()
            })
            .catch(err => done.fail(err.message))
        })

        it('isOpen should return true', () => {
          expect(sg.isOpen()).toBeTruthy()
        })

        it('getOpenData should return', () => {
          expect(sg.getOpenData()).toEqual(openData)
        })

        it('Should close & onClose should be called', done => {
          webChannelMock.onClose = () => {
            expect(sg.isOpen()).toBeFalsy()
            expect(sg.getOpenData()).toBeNull()
            done()
          }
          sg.close()
        })
      })

      describe('Open with the specified key', () => {
        const webChannelMock = new WebChannelMock()
        const sg = new Signaling(webChannelMock, () => {})
        let openData

        it('Should open the gate', done => {
          const key = sg.generateKey()
          sg.open(signalingURL, key)
            .then(data => {
              openData = data
              expect(data.key).toBeDefined()
              expect(data.url).toBeDefined()
              expect(data.url).toEqual(signalingURL)
              expect(data.key).toEqual(key)
              done()
            })
            .catch(done.fail)
        })

        it('isOpen should return true', () => {
          expect(sg.isOpen()).toBeTruthy()
        })

        it('getOpenDataData should return', () => {
          expect(sg.getOpenData()).toEqual(openData)
        })

        it('Should close & onClose should be called', done => {
          webChannelMock.onClose = () => {
            expect(sg.isOpen()).toBeFalsy()
            expect(sg.getOpenData()).toBeNull()
            done()
          }
          sg.close()
        })
      })
    })
  }
})

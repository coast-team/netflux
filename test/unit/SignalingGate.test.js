import SignalingGate from 'src/SignalingGate'
import {SIGNALING_URL} from 'util/helper'

describe('SignalingGate', () => {
  let FakeWebChannel = class {
    constructor (onClose = () => {}) {
      this.onClose = onClose
      this.settings = {iceServers: {}}
    }
  }
  let signalingGate
  let signalingURL = SIGNALING_URL

  it('Gate should be closed after construction', () => {
    signalingGate = new SignalingGate(new FakeWebChannel())
    expect(signalingGate.isOpen()).toBeFalsy()
    expect(signalingGate.ws).toBeNull()
    expect(signalingGate.key).toBeNull()
    expect(signalingGate.url).toBeNull()
  })

  it('Should generate different keys', () => {
    let key1 = signalingGate.generateKey()
    let key2 = signalingGate.generateKey()
    expect(key1).not.toEqual(key2)
  })

  it('Should fail to open the gate with the key used by another gate', done => {
    let key = signalingGate.generateKey()
    let wcg1 = new SignalingGate(new FakeWebChannel())
    let wcg2 = new SignalingGate(new FakeWebChannel())
    wcg1.open(signalingURL, () => {}, key)
      .then(() => {
        wcg2.open(() => {}, key)
          .then(done.fail)
          .catch(() => {
            wcg1.close()
            done()
          })
      }).catch(done.fail)
  })

  describe('Open with auto generated key', () => {
    let signalingGate = new SignalingGate(new FakeWebChannel())
    let openData

    it('Should open the gate', done => {
      signalingGate.open(signalingURL, () => {})
        .then(data => {
          openData = data
          expect(data.key).toBeDefined()
          expect(data.url).toBeDefined()
          expect(data.url).toEqual(signalingURL)
          done()
        })
        .catch(done.fail)
    })

    it('isOpen should return true', () => {
      expect(signalingGate.isOpen()).toBeTruthy()
    })

    it('getOpenData should return', () => {
      expect(signalingGate.getOpenData()).toEqual(openData)
    })

    it('Should close', () => {
      signalingGate.close()
      expect(signalingGate.isOpen()).toBeFalsy()
      expect(signalingGate.getOpenData()).toBeNull()
    })

    it('onClose should be called', done => {
      let wcg = new SignalingGate(new FakeWebChannel(done))
      wcg.open(signalingURL, () => {})
        .then(() => { wcg.close() })
        .catch(done.fail)
    })
  })

  describe('Open with the specified key', () => {
    let signalingGate = new SignalingGate(new FakeWebChannel())
    let openData

    it('Should open the gate', done => {
      let key = signalingGate.generateKey()
      signalingGate.open(signalingURL, () => {}, key)
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
      expect(signalingGate.isOpen()).toBeTruthy()
    })

    it('getOpenDataData should return', () => {
      expect(signalingGate.getOpenData()).toEqual(openData)
    })

    it('Should close', () => {
      signalingGate.close()
      expect(signalingGate.isOpen()).toBeFalsy()
      expect(signalingGate.getOpenData()).toBeNull()
    })

    it('onClose should be called', done => {
      let key = signalingGate.generateKey()
      let wcg = new SignalingGate(new FakeWebChannel(done))
      wcg.open(signalingURL, () => {}, key)
        .then(() => { wcg.close() })
        .catch(done.fail)
    })
  })
})

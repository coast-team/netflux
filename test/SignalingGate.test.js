import SignalingGate from 'src/SignalingGate'
import {SIGNALING} from 'utils/helper'

describe('SignalingGate', () => {
  let webChannelGate
  let signaling = SIGNALING

  it('Gate should be closed after construction', () => {
    webChannelGate = new SignalingGate()
    expect(webChannelGate.isOpen()).toBeFalsy()
    expect(webChannelGate.ws).toBeNull()
    expect(webChannelGate.accessData).toEqual({})
  })

  it('Should generate different keys', () => {
    let key1 = webChannelGate.generateKey()
    let key2 = webChannelGate.generateKey()
    expect(key1).not.toEqual(key2)
  })

  it('Should fail to open the gate with the key used by another gate', done => {
    let key = webChannelGate.generateKey()
    let wcg1 = new SignalingGate()
    let wcg2 = new SignalingGate()
    wcg1.open(() => {}, {signaling, key}).then(() => {
      wcg2.open(() => {}, {signaling, key}).then(() => {
        done.fail()
      }).catch(() => {
        wcg1.close()
        done()
      })
    }).catch(done.fail)
  })

  describe('Open with auto generated key', () => {
    let webChannelGate = new SignalingGate()
    let accessData

    it('Should open the gate', done => {
      webChannelGate.open(() => {}, {signaling})
        .then(data => {
          accessData = data
          expect(data.key).toBeDefined()
          expect(data.url).toBeDefined()
          expect(data.url).toEqual(signaling)
          done()
        })
        .catch(done.fail)
    })

    it('isOpen should return true', () => {
      expect(webChannelGate.isOpen()).toBeTruthy()
    })

    it('getAccessData should return', () => {
      expect(webChannelGate.accessData).toEqual(accessData)
    })

    it('Should close', () => {
      webChannelGate.close()
      expect(webChannelGate.isOpen()).toBeFalsy()
      expect(webChannelGate.ws).toBeNull()
      expect(webChannelGate.accessData).toEqual({})
    })

    it('onClose should be called', done => {
      let wcg = new SignalingGate(done)
      wcg.open(() => {}, {signaling}).then(() => { wcg.close() }).catch(done.fail)
    })
  })

  describe('Open with the specified key', () => {
    let webChannelGate = new SignalingGate()
    let accessData

    it('Should open the gate', done => {
      let key = webChannelGate.generateKey()
      webChannelGate.open(() => {}, {signaling, key})
        .then(data => {
          accessData = data
          expect(data.key).toBeDefined()
          expect(data.url).toBeDefined()
          expect(data.url).toEqual(signaling)
          done()
        })
        .catch(done.fail)
    })

    it('isOpen should return true', () => {
      expect(webChannelGate.isOpen()).toBeTruthy()
    })

    it('getAccessData should return', () => {
      expect(webChannelGate.accessData).toEqual(accessData)
    })

    it('Should close', () => {
      webChannelGate.close()
      expect(webChannelGate.isOpen()).toBeFalsy()
      expect(webChannelGate.ws).toBeNull()
      expect(webChannelGate.accessData).toEqual({})
    })

    it('onClose should be called', done => {
      let key = webChannelGate.generateKey()
      let wcg = new SignalingGate(done)
      wcg.open(() => {}, {signaling, key}).then(() => { wcg.close() }).catch(done.fail)
    })
  })
})

import {signaling} from 'config'
import WebChannelGate from 'src/WebChannelGate'

describe('WebChannelGate', () => {
  const WRONG_URL = 'https://github.com:8100/coast-team/netflux'
  let webChannelGate = new WebChannelGate()

  it('Gate should be closed after construction', () => {
    webChannelGate = new WebChannelGate()
    expect(webChannelGate.ws).toBeNull()
    expect(webChannelGate.accessData).toEqual({})
  })

  it('Should generate different keys', () => {
    let key1 = webChannelGate.generateKey()
    let key2 = webChannelGate.generateKey()
    expect(key1).not.toEqual(key2)
  })

  describe('Open with auto generated key', () => {
    let onCloseCalled = false
    let webChannelGate = new WebChannelGate(() => { onCloseCalled = true })
    let accessData

    it('Should open the gate', (done) => {
      webChannelGate.open(() => {}, {signaling})
        .then((data) => {
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
  })

  describe('Open with the specified key', () => {
    let onCloseCalled = false
    let webChannelGate = new WebChannelGate()
    let accessData

    it('Should open the gate', (done) => {
      let key = webChannelGate.generateKey()
      webChannelGate.open(() => {}, {signaling, key})
        .then((data) => {
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
  })

  describe('Open with the specified key', () => {

  })
})

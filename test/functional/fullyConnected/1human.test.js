import {SIGNALING} from 'testhelper'
import WebChannel from 'src/WebChannel'

describe('🙂', () => {
  let wc = new WebChannel({signaling: SIGNALING})
  it('Should construct a WebChannel', () => {
    expect(wc.id).not.toBeNull()
    expect(wc.id).not.toBeUndefined()
    expect(wc.isOpen()).toBeFalsy()
    expect(wc.getAccess()).toEqual({})
    expect(() => wc.leave()).not.toThrow()
    expect(() => wc.close()).not.toThrow()
    expect(() => wc.send('test')).not.toThrow()
    expect(() => wc.sendTo('test')).not.toThrow()
  })

  it('Ping should be 0', done => {
    wc.ping().then(ping => {
      expect(ping).toEqual(0)
      done()
    })
  })

  it('Should open the WebChannel', done => {
    wc.open().then(data => {
      expect(wc.getAccess()).toBe(data)
      expect(wc.isOpen()).toBeTruthy()
      wc.close()
      done()
    }).catch(done.fail)
  })

  it('Should close the WebChannel', done => {
    wc.onClose = done
    wc.open().then(data => wc.close()).catch(done.fail)
  })
})

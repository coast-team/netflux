import {create} from 'src/index'
import {SIGNALING_URL} from 'util/helper'

describe('🙂', () => {
  let wc = create({signalingURL: SIGNALING_URL})
  it('Should construct a WebChannel', () => {
    expect(wc.id).not.toBeNull()
    expect(wc.id).not.toBeUndefined()
    expect(wc.isOpen()).toBeFalsy()
    expect(wc.getOpenData()).toBeNull()
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
      expect(wc.getOpenData()).toEqual(data)
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

import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

describe('2 peers -> ', () => {
  it('Should have equal WebChannel structure', (done) => {
    let wc1 = new WebChannel({signaling})
    let wc2 = new WebChannel({signaling})
    wc1.onJoining = (id) => {
      expect(wc1.id).toBe(wc2.id)
      expect(wc1.channels.size).toBe(wc2.channels.size)
      expect(wc1.channels.values().next().value.peerId).toBe(wc2.myId)
      expect(wc2.channels.values().next().value.peerId).toBe(wc1.myId)
      wc1.leave()
      wc2.leave()
      done()
    }
    wc1.open()
      .then((data) => {
        wc2.join(data.key)
          .catch(done.fail)
      })
      .catch(done.fail)
  })

  it('Should get WebChannel access data after open', (done) => {
    let wc1 = new WebChannel({signaling})
    wc1.open().then((data) => {
      expect(wc1.getAccess()).toBe(data)
      wc1.close()
      done()
    }).catch(done.fail)
  })

  it('Should catch onClose WebChannel event', (done) => {
    if (typeof window !== 'undefined') {
      let wc1 = new WebChannel({signaling})
      wc1.onClose = (evt) => {
        console.log('hello')
        expect(evt instanceof Event).toBeTruthy()
        wc1.leave()
        done()
      }
      wc1.open().then((data) => {
        wc1.close()
      }).catch(done.fail)
    } else { done() }
  })

  describe('Should send/receive messages -> ', () => {
    let wc1, wc2

    beforeAll((done) => {
      // Peer #1
      wc1 = new WebChannel({signaling})
      wc1.open().then((data) => {
        // Peer #2
        wc2 = new WebChannel({signaling})
        wc2.join(data.key).then(() => {
          done()
        })
          .catch(done.fail)
      }).catch(done.fail)
    })

    afterAll(() => {
      wc1.leave()
      wc2.leave()
    })

    it('isOpen', () => {
      expect(wc1.isOpen()).toBeTruthy()
      expect(wc2.isOpen()).toBeFalsy()
    })

    it('broadcast', (done) => {
      const message1 = 'Hi world!'
      const message2 = 'Hello world!'
      wc1.onMessage = (id, msg, isBroadcast) => {
        expect(msg).toBe(message2)
        expect(id).toBe(wc2.myId)
        expect(isBroadcast).toBeTruthy()
        wc1.send(message1)
      }
      wc2.onMessage = (id, msg, isBroadcast) => {
        expect(msg).toBe(message1)
        expect(id).toBe(wc1.myId)
        expect(isBroadcast).toBeTruthy()
        done()
      }
      wc2.send(message2)
    })

    it('send to', (done) => {
      const message1 = 'Hi world!'
      const message2 = 'Hello world!'
      wc1.onMessage = (id, msg, isBroadcast) => {
        expect(msg).toBe(message2)
        expect(id).toBe(wc2.myId)
        expect(isBroadcast).toBeFalsy()
        wc1.sendTo(wc2.myId, message1)
      }
      wc2.onMessage = (id, msg, isBroadcast) => {
        expect(msg).toBe(message1)
        expect(id).toBe(wc1.myId)
        expect(isBroadcast).toBeFalsy()
        done()
      }
      wc2.sendTo(wc1.myId, message2)
    })
  })

  describe('Should leave WebChannel -> ', () => {
    it('initiator is leaving', (done) => {
      const message = 'Hi world!'
      // Peer #1
      let wc1 = new WebChannel({signaling})
      wc1.onMessage = done.fail
      wc1.onJoining = (id) => wc1.leave()
      let wc2 = new WebChannel({signaling})
      wc2.onMessage = done.fail
      wc2.onLeaving = (id) => {
        expect(id).toBe(wc1.myId)
        wc1.send(message)
        wc1.sendTo(wc2.myId, message)
        done()
      }

      wc1.open().then((data) => {
        wc2.join(data.key).catch(done.fail)
      }).catch(done.fail)
      wc2.send(message)
      wc2.sendTo(wc1.myId, message)
    })

    it('guest is leaving', (done) => {
      const message = 'Hi world!'
      // Peer #1
      let wc1 = new WebChannel({signaling})
      wc1.onMessage = done.fail
      wc1.onLeaving = (id) => {
        expect(id).toBe(wc2.myId)
        wc1.send(message)
        wc1.sendTo(wc2.myId, message)
        done()
      }
      let wc2 = new WebChannel({signaling})
      wc2.onMessage = done.fail

      wc1.open().then((data) => {
        // Peer #2
        wc2.join(data.key).then(() => wc2.leave())
          .catch(done.fail)
      }).catch(done.fail)
      wc2.send(message)
      wc2.sendTo(wc1.myId, message)
    })
  })

  it('Should not enable to join the WebChannel after it has been closed', (done) => {
    let wc1 = new WebChannel({signaling})
    let wc2 = new WebChannel({signaling})

    // Peer #1
    wc1.open().then((data) => {
      wc1.close()
      // Peer #2
      wc2.join(data.key).then(done.fail)
        .catch(() => {
          wc1.leave()
          wc2.leave()
          done()
        })
    }).catch(done.fail)
  })
})

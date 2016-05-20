import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

describe('2 peers -> ', () => {
  it('Should have equal WebChannel structure', (done) => {
    let wc1 = new WebChannel({signaling})
    let wc2 = new WebChannel({signaling})
    wc1.onJoining = (id) => {
      expect(wc1.channels.size).toBe(wc2.channels.size)
      expect(wc1.channels.values().next().value.peerId).toBe(wc2.myId)
      expect(wc2.channels.values().next().value.peerId).toBe(wc1.myId)
      expect(wc1.joiningPeers.size).toBe(0)
      expect(wc2.joiningPeers.size).toBe(0)
      done()
    }
    wc1.openForJoining()
      .then((data) => {
        wc2.join(data.key)
          .then(() => {})
          .catch(done.fail)
      })
      .catch(done.fail)
  })

  describe('Should send/receive message -> ', () => {
    let wc1, wc2

    beforeAll((done) => {
      // Peer #1
      wc1 = new WebChannel({signaling})
      wc1.openForJoining().then((data) => {
        // Peer #2
        wc2 = new WebChannel({signaling})
        wc2.join(data.key).then(() => {
          done()
        })
          .catch(done.fail)
      }).catch(done.fail)
    })

    it('broadcast', (done) => {
      const message1 = 'Hi world!'
      const message2 = 'Hello world!'
      wc1.onMessage = (id, msg) => {
        expect(msg).toBe(message2)
        expect(id).toBe(wc2.myId)
        wc1.send(message1)
      }
      wc2.onMessage = (id, msg) => {
        expect(msg).toBe(message1)
        expect(id).toBe(wc1.myId)
        done()
      }
      wc2.send(message2)
    })

    it('send to', (done) => {
      const message1 = 'Hi world!'
      const message2 = 'Hello world!'
      wc1.onMessage = (id, msg) => {
        expect(msg).toBe(message2)
        expect(id).toBe(wc2.myId)
        wc1.sendTo(wc2.myId, message1)
      }
      wc2.onMessage = (id, msg) => {
        expect(msg).toBe(message1)
        expect(id).toBe(wc1.myId)
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
        wc1.sendTo(message)
        done()
      }

      wc1.openForJoining().then((data) => {
        wc2.join(data.key).catch(done.fail)
      }).catch(done.fail)
      wc2.send(message)
      wc2.sendTo(message)
    })

    it('guest is leaving', (done) => {
      const message = 'Hi world!'
      // Peer #1
      let wc1 = new WebChannel({signaling})
      wc1.onMessage = done.fail
      wc1.onLeaving = (id) => {
        expect(id).toBe(wc2.myId)
        wc1.send(message)
        wc1.sendTo(message)
        done()
      }
      let wc2 = new WebChannel({signaling})
      wc2.onMessage = done.fail

      wc1.openForJoining().then((data) => {
        // Peer #2
        wc2.join(data.key).then(() => wc2.leave())
          .catch(done.fail)
      }).catch(done.fail)
      wc2.send(message)
      wc2.sendTo(message)
    })
  })
})

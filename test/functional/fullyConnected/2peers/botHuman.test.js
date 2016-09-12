import {
  SIGNALING,
  INSTANCES,
  MSG_NUMBER,
  LEAVE_CODE,
  getEnvironment,
  sendReceive,
  randData
} from 'utils/helper'
import smallStr from 'utils/200kb.txt'
import bigStr from 'utils/4mb.txt'
import WebChannel from 'src/WebChannel'

describe('🤖 🙂  fully connected', () => {
  let signaling = SIGNALING
  let wc

  it('Should establish a connection through data channel', done => {
    wc = new WebChannel({signaling})
    wc.onJoining = id => expect(id).toEqual(wc.members[0])
    spyOn(wc, 'onJoining')
    wc.join(getEnvironment())
      .then(() => {
        expect(wc.members.length).toEqual(1)
        expect(wc.onJoining).toHaveBeenCalledTimes(1)
        done()
      })
      .catch(done.fail)
  })

  describe('Should send/receive', () => {

    it('Private string message', done => {
      let data = randData(String)
      sendReceive(wc, data, done, wc.members[0])
    })

    for (let i of INSTANCES) {
      it('broadcast: ' + i.prototype.constructor.name, done => {
        let data = randData(i)
        sendReceive(wc, data, done)
      })
    }

    it('broadcast: ~200 KB string', done => {
      sendReceive(wc, smallStr, done)
    })

    xit('broadcast: ~4 MB string', done => {
      sendReceive(wc, bigStr, done)
    }, 10000)

    it(`${MSG_NUMBER} small messages`, done => {
      let data = []
      let dataReceived = Array(MSG_NUMBER)
      for (let i = 0; i < MSG_NUMBER; i++) data[i] = randData(String)
      dataReceived.fill(0)
      wc.onMessage = (id, msg, isBroadcast) => {
        expect(typeof msg).toEqual('string')
        let index = data.indexOf(msg)
        expect(index).not.toEqual(-1)
        expect(dataReceived[index]++).toEqual(0)
        expect(isBroadcast).toBeTruthy()
        done()
      }
      for (let d of data) wc.send(d)
    })
  })

  it('Should ping', done => {
    wc.ping().then(p => expect(p).toBeLessThan(300)).then(done).catch(done.fail)
  })

  describe('Should leave', () => {
    it('🙂', () => {
      wc.leave()
      expect(wc.members.length).toEqual(0)
    })

    it('🤖', done => {
      wc.onLeaving = id => {
        expect(wc.members.length).toEqual(0)
        done()
      }
      wc.join(getEnvironment())
        .then(() => {
          wc.sendTo(wc.members[0], JSON.stringify({code: LEAVE_CODE}))
        })
        .catch(done.fail)
    })
  })
})

import {create} from 'src/index'
import * as helper from 'util/helper'
import smallStr from 'util/200kb.txt'
import bigStr from 'util/4mb.txt'

describe('🤖 🙂  fully connected', () => {
  let signalingURL = helper.SIGNALING_URL
  let wc

  it('Should establish a connection through data channel', done => {
    wc = create({signalingURL})
    wc.onPeerJoin = id => {
      expect(id).toEqual(wc.members[0])
    }
    spyOn(wc, 'onPeerJoin')
    wc.join(helper.env())
      .then(() => {
        expect(wc.members.length).toEqual(1)
        expect(wc.onPeerJoin).toHaveBeenCalledTimes(1)
        done()
      })
      .catch(done.fail)
  })

  describe('Should send/receive', () => {
    it('Private string message', done => {
      let data = helper.randData(String)
      helper.sendReceive(wc, data, done, wc.members[0])
    })

    for (let i of helper.INSTANCES) {
      it('broadcast: ' + i.prototype.constructor.name, done => {
        let data = helper.randData(i)
        helper.sendReceive(wc, data, done)
      })
    }

    it('broadcast: ~200 KB string', done => {
      helper.sendReceive(wc, smallStr, done)
    })

    xit('broadcast: ~4 MB string', done => {
      helper.sendReceive(wc, bigStr, done)
    }, 10000)

    it(`${helper.MSG_NUMBER} small messages`, done => {
      let data = []
      let dataReceived = Array(helper.MSG_NUMBER)
      for (let i = 0; i < helper.MSG_NUMBER; i++) data[i] = helper.randData(String)
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
    wc.ping().then(p => expect(Number.isInteger(p)).toBeTruthy()).then(done).catch(done.fail)
  })

  describe('Should leave', () => {
    it('🙂', () => {
      wc.leave()
      expect(wc.members.length).toEqual(0)
    })

    it('🤖', done => {
      wc.onPeerLeave = id => {
        expect(wc.members.length).toEqual(0)
        done()
      }
      wc.join(helper.env())
        .then(() => {
          wc.sendTo(wc.members[0], JSON.stringify({code: helper.LEAVE_CODE}))
        })
        .catch(done.fail)
    })
  })
})

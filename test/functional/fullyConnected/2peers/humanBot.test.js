import {create} from 'src/index.browser'
import * as helper from 'util/helper'
import smallStr from 'util/200kb.txt'
import bigStr from 'util/4mb.txt'

describe('🙂 🤖  fully connected', () => {
  const signalingURL = helper.SIGNALING_URL

  it('Should establish a connection through socket', done => {
    const wc = create({signalingURL})
    console.log(wc.myId + ' invites...')
    wc.onPeerJoin = id => expect(id).toEqual(wc.members[0])
    spyOn(wc, 'onPeerJoin')
    wc.invite(helper.BOT)
      .then(() => {
        expect(wc.members.length).toEqual(1)
        expect(wc.onPeerJoin).toHaveBeenCalledTimes(1)
        wc.leave()
        done()
      })
      .catch(done.fail)
  })

  it('Should ping', done => {
    const wc = create({signalingURL})
    console.log(wc.myId + ' invites...')
    wc.invite(helper.BOT)
      .then(() => wc.ping())
      .then(p => expect(Number.isInteger(p)).toBeTruthy())
      .then(() => wc.leave())
      .then(done)
      .catch(done.fail)
  })

  describe('Should send/receive', () => {
    let wc

    beforeAll(done => {
      wc = create({signalingURL})
      console.log(wc.myId + ' invites...')
      wc.invite(helper.BOT)
        .then(() => wc.ping())
        .then(done)
    })

    afterAll(() => wc.leave())

    it('Private string message', done => {
      const data = helper.randData(String)
      helper.sendReceive(wc, data, done, wc.members[0])
    })

    for (let i of helper.INSTANCES) {
      it('broadcast: ' + i.prototype.constructor.name, done => {
        const data = helper.randData(i)
        helper.sendReceive(wc, data, done)
      })
    }

    it('broadcast: ~200 KB string', done => {
      helper.sendReceive(wc, smallStr, done)
    })

    helper.xitBrowser(false, 'broadcast: ~4 MB string', done => {
      helper.sendReceive(wc, bigStr, done)
    }, 10000)

    it(`${helper.MSG_NUMBER} small messages`, done => {
      const data = []
      const dataReceived = Array(helper.MSG_NUMBER)
      for (let i = 0; i < helper.MSG_NUMBER; i++) data[i] = helper.randData(String)
      dataReceived.fill(0)
      wc.onMessage = (id, msg, isBroadcast) => {
        expect(typeof msg).toEqual('string')
        const index = data.indexOf(msg)
        expect(index).not.toEqual(-1)
        expect(dataReceived[index]++).toEqual(0)
        expect(isBroadcast).toBeTruthy()
        done()
      }
      for (let d of data) wc.send(d)
    }, 10000)
  })

  describe('Should leave', () => {
    let wc

    beforeEach(done => {
      wc = create({signalingURL})
      wc.invite(helper.BOT)
        .then(() => wc.ping())
        .then(done)
    })

    it('🙂', done => {
      wc.leave()
      expect(wc.members.length).toEqual(0)
      wc.ping()
        .then(done.fail)
        .catch(done)
    })

    it('🤖', done => {
      wc.onPeerLeave = id => {
        expect(wc.members.length).toEqual(0)
        wc.ping()
          .then(done.fail)
          .catch(done)
      }
      wc.sendTo(wc.members[0], JSON.stringify({code: helper.LEAVE_CODE}))
    })
  })
})

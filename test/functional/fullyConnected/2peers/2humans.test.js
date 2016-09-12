import {
  SIGNALING,
  MSG_NUMBER,
  TestGroup,
  allMessagesAreSentAndReceived,
  INSTANCES,
  itBrowser,
  randStr
} from 'utils/helper'
import WebChannel from 'src/WebChannel'
import smallStr from 'utils/200kb.txt'
import bigStr from 'utils/4mb.txt'

describe('🙂 🙂  fully connected', () => {
  let signaling = SIGNALING
  let wcs = []
  afterAll(() => {
    wcs[0].close()
    wcs[1].close()
    wcs[0].leave()
    wcs[1].leave()
  })

  it('Should establish a connection', done => {
    wcs[0] = new WebChannel({signaling})
    wcs[1] = new WebChannel({signaling})
    Promise.all([
      new Promise((resolve, reject) => {
        wcs[0].onJoining = id => {
          expect(id).toEqual(wcs[1].myId)
          expect(wcs[0].members[0]).toEqual(wcs[1].myId)
          resolve()
        }
      }),
      wcs[0].open()
        .then(data => wcs[1].join(data.key))
        .then(() => {
          expect(wcs[0].id).toEqual(wcs[1].id)
          expect(wcs[1].members[0]).toEqual(wcs[0].myId)
        })
    ])
      .then(done)
      .catch(done.fail)
  })

  describe('Should send/receive', () => {
    let groups

    beforeAll(() => {
      groups = []
      for (let i = 0; i < 2; i++) groups[i] = new TestGroup(wcs[i])
    })

    it('Private string message', done => {
      allMessagesAreSentAndReceived(groups, String, false)
        .then(done).catch(done.fail)
      groups[0].wc.sendTo(groups[1].wc.myId, groups[0].get(String))
      groups[1].wc.sendTo(groups[0].wc.myId, groups[1].get(String))
    })

    it('Broadcast string message', done => {
      allMessagesAreSentAndReceived(groups, String)
        .then(done).catch(done.fail)
      for (let g of groups) g.wc.send(g.get(String))
    })

    for (let i of INSTANCES) {
      it(i.prototype.constructor.name, done => {
        allMessagesAreSentAndReceived(groups, i)
          .then(done).catch(done.fail)
        for (let g of groups) g.wc.send(g.get(i))
      })
    }

    it('~200 KB string', done => {
      let groups = []
      for (let i = 0; i < 2; i++) {
        groups[i] = new TestGroup(wcs[i], null)
        groups[i].set(String, smallStr + i)
      }
      allMessagesAreSentAndReceived(groups, String)
        .then(done).catch(done.fail)
      for (let g of groups) g.wc.send(g.get(String))
    })

    itBrowser(true, '~4 MB string', done => {
      let index1 = Math.round(Math.random())
      let index2 = 1 - index1
      wcs[index1].onMessage = (id, msg) => {
        expect(id).toEqual(wcs[index2].myId)
        expect(msg === bigStr).toBeTruthy()
        done()
      }
      wcs[index2].sendTo(wcs[index1].myId, bigStr)
    }, 10000)

    it(`${MSG_NUMBER} small messages`, done => {
      let msgArray1 = []
      let msgArray2 = []
      let msgArrays = [msgArray1, msgArray2]
      let nb = Math.floor(MSG_NUMBER / 3)
      for (let i = 0; i < nb; i++) {
        msgArray1[i] = randStr()
        msgArray2[i] = randStr()
      }
      let startSend = index => new Promise((resolve, reject) => {
        for (let e of msgArrays[index]) wcs[index].send(e)
        resolve()
      })
      Promise.all([
        new Promise((resolve, reject) => {
          let counter1 = 0
          wcs[0].onMessage = (id, msg) => {
            counter1++
            expect(msgArray2.includes(msg)).toBeTruthy()
            if (counter1 === nb) resolve()
          }
        }),
        new Promise((resolve, reject) => {
          let counter2 = 0
          wcs[1].onMessage = (id, msg) => {
            counter2++
            expect(msgArray1.includes(msg)).toBeTruthy()
            if (counter2 === nb) resolve()
          }
        })
      ]).then(done).catch(done.fail)
      startSend(0)
      startSend(1)
    }, 10000)
  })

  it('Should ping', done => {
    Promise.all([
      wcs[0].ping()
        .then(p => expect(p).toBeLessThan(300)),
      wcs[1].ping()
        .then(p => expect(p).toBeLessThan(300))
    ]).then(done).catch(done.fail)
  }, 10000)

  describe('Should leave', () => {
    const message = 'Hi world!'

    it('The peer who opened the WebChannel', done => {
      wcs[0].onMessage = done.fail
      wcs[1].onMessage = done.fail
      wcs[1].onLeaving = id => {
        expect(id).toBe(wcs[0].myId)
        wcs[0].send(message)
        wcs[0].sendTo(wcs[1].myId, message)
        wcs[1].send(message)
        wcs[1].sendTo(wcs[0].myId, message)
        expect(wcs[0].members.length).toEqual(0)
        expect(wcs[1].members.length).toEqual(0)
        setTimeout(done, 100)
      }
      wcs[0].leave()
    })

    it('Joined peer', done => {
      wcs[0] = new WebChannel({signaling})
      wcs[0].open()
        .then(data => wcs[1].join(data.key))
        .then(() => {
          wcs[0].onMessage = done.fail
          wcs[1].onMessage = done.fail
          wcs[0].onLeaving = id => {
            expect(id).toBe(wcs[1].myId)
            wcs[0].send(message)
            wcs[0].sendTo(wcs[1].myId, message)
            wcs[1].send(message)
            wcs[1].sendTo(wcs[0].myId, message)
            expect(wcs[0].members.length).toEqual(0)
            expect(wcs[1].members.length).toEqual(0)
            setTimeout(done, 100)
          }
          setTimeout(() => {
            wcs[1].leave()
          }, 100)
        })
        .catch(done.fail)
    })
  })

  it('Should not be able to join the WebChannel after it has been closed', done => {
    expect(wcs[0].isOpen()).toBeTruthy()
    let key = wcs[0].getAccess().key
    wcs[0].close()
    wcs[1].join(key).then(done.fail).catch(done)
  })
})

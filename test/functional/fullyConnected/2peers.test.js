import {signaling, randArrayBuffer, randString, MSG_NUMBER, allMessagesAreSentAndReceived, TestGroup} from 'config'
import WebChannel from 'src/WebChannel'
import {isBrowser} from 'src/helper'
import smallStr from '200kb.txt'
import bigStr from '4mb.txt'

describe('Fully connected: 2 peers', () => {
  let wcs = []
  afterAll(() => {
    wcs[0].close()
    wcs[1].close()
    wcs[0].leave()
    wcs[1].leave()
  })

  it('Should establish a connection', (done) => {
    wcs[0] = new WebChannel({signaling})
    wcs[1] = new WebChannel({signaling})
    Promise.all([
      new Promise((resolve, reject) => {
        wcs[0].onJoining = (id) => {
          expect(id).toEqual(wcs[1].myId)
          resolve()
        }
      }),
      wcs[0].open().then((data) => wcs[1].join(data.key))
    ])
      .then(() => {
        expect(wcs[0].id).toEqual(wcs[1].id)
        done()
      })
      .catch(done.fail)
  })

  describe('Should send/receive', () => {
    let groupsStr
    let groupsBuf

    beforeAll(() => {
      groupsStr = []
      groupsBuf = []
      for (let i = 0; i < 2; i++) {
        groupsStr[i] = new TestGroup(wcs[i], randString())
        groupsBuf[i] = new TestGroup(wcs[i], randArrayBuffer(8, 200))
      }
    })

    it('Private string message', (done) => {
      allMessagesAreSentAndReceived(groupsStr, String, false)
        .then(done).catch(done.fail)
      groupsStr[0].wc.sendTo(groupsStr[1].wc.myId, groupsStr[0].msg)
      groupsStr[1].wc.sendTo(groupsStr[0].wc.myId, groupsStr[1].msg)
    })

    it('Broadcast string message', (done) => {
      allMessagesAreSentAndReceived(groupsStr, String)
        .then(done).catch(done.fail)
      for (let g of groupsStr) g.wc.send(g.msg)
    })

    it('ArrayBuffer', (done) => {
      allMessagesAreSentAndReceived(groupsBuf, ArrayBuffer)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    it('Uint8Array', (done) => {
      for (let g of groupsBuf) g.msg = new Uint8Array(g.msg)
      allMessagesAreSentAndReceived(groupsBuf, Uint8Array)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    it('Int8Array', (done) => {
      for (let g of groupsBuf) g.msg = new Int8Array(g.msg.buffer)
      allMessagesAreSentAndReceived(groupsBuf, Int8Array)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    it('Uint8ClampedArray', (done) => {
      for (let g of groupsBuf) g.msg = new Uint8ClampedArray(g.msg.buffer)
      allMessagesAreSentAndReceived(groupsBuf, Uint8ClampedArray)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    it('Int16Array', (done) => {
      for (let g of groupsBuf) g.msg = new Int16Array(g.msg.buffer)
      allMessagesAreSentAndReceived(groupsBuf, Int16Array)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    it('Uint16Array', (done) => {
      for (let g of groupsBuf) g.msg = new Uint16Array(g.msg.buffer)
      allMessagesAreSentAndReceived(groupsBuf, Uint16Array)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    it('Int32Array', (done) => {
      for (let g of groupsBuf) g.msg = new Int32Array(g.msg.buffer)
      allMessagesAreSentAndReceived(groupsBuf, Int32Array)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    it('Uint32Array', (done) => {
      for (let g of groupsBuf) g.msg = new Uint32Array(g.msg.buffer)
      allMessagesAreSentAndReceived(groupsBuf, Uint32Array)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    xit('Float32Array', (done) => {
      // FIXME: sometimes it does not pass
      for (let g of groupsBuf) g.msg = new Float32Array(g.msg.buffer)
      allMessagesAreSentAndReceived(groupsBuf, Float32Array)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    xit('Float64Array', (done) => {
      // FIXME: sometimes it does not pass
      for (let g of groupsBuf) g.msg = new Float64Array(g.msg.buffer)
      allMessagesAreSentAndReceived(groupsBuf, Float64Array)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    it('DataView', (done) => {
      for (let g of groupsBuf) g.msg = new DataView(g.msg.buffer)
      allMessagesAreSentAndReceived(groupsBuf, DataView)
        .then(done).catch(done.fail)
      for (let g of groupsBuf) g.wc.send(g.msg)
    })

    it('~200 KB string', (done) => {
      let groups = []
      for (let i = 0; i < 2; i++) {
        groups[i] = new TestGroup(wcs[i], smallStr + i)
      }
      allMessagesAreSentAndReceived(groups, String)
        .then(done).catch(done.fail)
      for (let g of groups) g.wc.send(g.msg)
    })

    if (isBrowser()) {
      it('~4 MB string', (done) => {
        let index1 = Math.round(Math.random())
        let index2 = 1 - index1
        wcs[index1].onMessage = (id, msg) => {
          expect(id).toEqual(wcs[index2].myId)
          expect(msg === bigStr).toBeTruthy()
          done()
        }
        wcs[index2].sendTo(wcs[index1].myId, bigStr)
      }, 10000)
    }

    it(`${MSG_NUMBER} small messages`, (done) => {
      let msgArray1 = []
      let msgArray2 = []
      let msgArrays = [msgArray1, msgArray2]
      let nb = Math.floor(MSG_NUMBER / 3)
      for (let i = 0; i < nb; i++) {
        msgArray1[i] = randString()
        msgArray2[i] = randString()
      }
      let startSend = (index) => new Promise((resolve, reject) => {
        for (let e of msgArrays[index]) wcs[index].send(e)
        resolve()
      })
      Promise.all([
        new Promise((resolve, reject) => {
          let counter1 = 0
          wcs[0].onMessage = (id, msg) => {
            counter1++
            expect(msgArray2.indexOf(msg)).not.toEqual(-1)
            if (counter1 === nb) resolve()
          }
        }),
        new Promise((resolve, reject) => {
          let counter2 = 0
          wcs[1].onMessage = (id, msg) => {
            counter2++
            expect(msgArray1.indexOf(msg)).not.toEqual(-1)
            if (counter2 === nb) resolve()
          }
        })
      ]).then(done).catch(done.fail)
      startSend(0)
      startSend(1)
    }, 10000)
  })

  it('Should ping', (done) => {
    Promise.all([
      wcs[0].ping()
        .then((p) => expect(p).toBeLessThan(300)),
      wcs[1].ping()
        .then((p) => expect(p).toBeLessThan(300))
    ]).then(done).catch(done.fail)
  }, 10000)

  describe('Should leave', () => {
    const message = 'Hi world!'

    it('The peer who opened the WebChannel', (done) => {
      wcs[0].onMessage = done.fail
      wcs[1].onMessage = done.fail
      wcs[1].onLeaving = (id) => {
        expect(id).toBe(wcs[0].myId)
        wcs[0].send(message)
        wcs[0].sendTo(wcs[1].myId, message)
        wcs[1].send(message)
        wcs[1].sendTo(wcs[0].myId, message)
        setTimeout(done, 100)
      }
      wcs[0].leave()
    })

    it('Joined peer', (done) => {
      wcs[0] = new WebChannel({signaling})
      wcs[0].open()
        .then((data) => wcs[1].join(data.key))
        .then(() => {
          wcs[0].onMessage = done.fail
          wcs[1].onMessage = done.fail
          wcs[0].onLeaving = (id) => {
            expect(id).toBe(wcs[1].myId)
            wcs[0].send(message)
            wcs[0].sendTo(wcs[1].myId, message)
            wcs[1].send(message)
            wcs[1].sendTo(wcs[0].myId, message)
            setTimeout(done, 100)
          }
          wcs[1].leave()
        })
        .catch(done.fail)
    })
  })

  it('Should not be able to join the WebChannel after it has been closed', (done) => {
    expect(wcs[0].isOpen()).toBeTruthy()
    let key = wcs[0].getAccess().key
    wcs[0].close()
    wcs[1].join(key).then(done.fail).catch(done)
  })
})

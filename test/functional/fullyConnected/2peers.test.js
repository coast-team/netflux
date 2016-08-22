import {signaling, randArrayBuffer, randString, MSG_NUMBER, allMessagesAreSentAndReceived} from 'config'
import WebChannel from 'src/WebChannel'
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
    const msgs = ['Hi world!', 'Hello world!']
    const buffers = [randArrayBuffer(8, 200), randArrayBuffer(8, 200)]

    it('Private string message', (done) => {
      allMessagesAreSentAndReceived(wcs, msgs, String, false)
        .then(done).catch(done.fail)
      wcs[0].sendTo(wcs[1].myId, msgs[0])
      wcs[1].sendTo(wcs[0].myId, msgs[1])
    })

    it('Broadcast string message', (done) => {
      allMessagesAreSentAndReceived(wcs, msgs, String)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(msgs[i])
    })

    it('ArrayBuffer', (done) => {
      allMessagesAreSentAndReceived(wcs, msgs, ArrayBuffer)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(buffers[i])
    })

    it('Uint8Array', (done) => {
      let original = buffers.map(v => new Uint8Array(v))
      allMessagesAreSentAndReceived(wcs, original, Uint8Array)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    it('Int8Array', (done) => {
      let original = buffers.map(v => new Int8Array(v))
      allMessagesAreSentAndReceived(wcs, original, Int8Array)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    it('Uint8ClampedArray', (done) => {
      let original = buffers.map(v => new Uint8ClampedArray(v))
      allMessagesAreSentAndReceived(wcs, original, Uint8ClampedArray)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    it('Int16Array', (done) => {
      let original = buffers.map(v => new Int16Array(v))
      allMessagesAreSentAndReceived(wcs, original, Int16Array)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    it('Uint16Array', (done) => {
      let original = buffers.map(v => new Uint16Array(v))
      allMessagesAreSentAndReceived(wcs, original, Uint16Array)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    it('Int32Array', (done) => {
      let original = buffers.map(v => new Int32Array(v))
      allMessagesAreSentAndReceived(wcs, original, Int32Array)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    it('Uint32Array', (done) => {
      let original = buffers.map(v => new Uint32Array(v))
      allMessagesAreSentAndReceived(wcs, original, Uint32Array)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    xit('Float32Array', (done) => {
      // FIXME: sometimes it does not pass
      let original = buffers.map(v => new Float32Array(v))
      allMessagesAreSentAndReceived(wcs, original, Float32Array)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    xit('Float64Array', (done) => {
      // FIXME: sometimes it does not pass
      let original = buffers.map(v => new Float64Array(v))
      allMessagesAreSentAndReceived(wcs, original, Float64Array)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    it('DataView', (done) => {
      let original = buffers.map(v => new DataView(v))
      allMessagesAreSentAndReceived(wcs, original, DataView)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    xit('~200 KB string', (done) => {
      let original = ['a' + smallStr, 'b' + smallStr]
      allMessagesAreSentAndReceived(wcs, original, String)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    xit('~4 MB string', (done) => {
      let index1 = Math.round(Math.random())
      let index2 = 1 - index1
      wcs[index1].onMessage = (id, msg) => {
        expect(id).toEqual(wcs[index2].myId)
        expect(msg === bigStr).toBeTruthy()
        done()
      }
      wcs[index2].send(bigStr)
    }, 10000)

    it(`${MSG_NUMBER} small messages`, (done) => {
      let msgArray1 = []
      let msgArray2 = []
      let msgArrays = [msgArray1, msgArray2]
      for (let i = 0; i < MSG_NUMBER / 2; i++) {
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
            if (counter1 === msgArray1.length) resolve()
          }
        }),
        new Promise((resolve, reject) => {
          let counter2 = 0
          wcs[1].onMessage = (id, msg) => {
            counter2++
            expect(msgArray1.indexOf(msg)).not.toEqual(-1)
            if (counter2 === msgArray2.length) resolve()
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

import {signaling, randArrayBuffer, randString, MSG_NUMBER, allMessagesAreSentAndReceived} from 'config'
import WebChannel from 'src/WebChannel'
import smallStr from '200kb.txt'
import bigStr from '4mb.txt'

describe('Fully connected: 3 peers', () => {
  let wcs = []
  afterAll(() => {
    wcs[0].close()
    wcs[1].close()
    wcs[2].close()
    wcs[0].leave()
    wcs[1].leave()
    wcs[2].leave()
  })

  describe('Should establish a connection', () => {
    it('one by one', (done) => {
      wcs[0] = new WebChannel({signaling})
      wcs[1] = new WebChannel({signaling})
      wcs[2] = new WebChannel({signaling})
      Promise.all([
        new Promise((resolve, reject) => {
          let gen = (function * (resolve) {
            expect(yield).toEqual(wcs[1].myId)
            expect(yield).toEqual(wcs[2].myId)
            resolve()
          })(resolve)
          gen.next()
          wcs[0].onJoining = (id) => gen.next(id)
        }),
        new Promise((resolve, reject) => {
          wcs[1].onJoining = (id) => {
            expect(id).toEqual(wcs[2].myId)
            resolve()
          }
        }),
        wcs[0].open()
          .then((data) => wcs[1].join(data.key))
          .then(() => wcs[2].join(wcs[0].getAccess().key))
      ])
        .then(() => {
          expect(wcs[0].id).toEqual(wcs[1].id)
          expect(wcs[0].id).toEqual(wcs[2].id)
          done()
        })
        .catch(done.fail)
    })

    xit('simultaneously', (done) => {
      wcs[0].close()
      wcs[1].leave()
      wcs[2].leave()
      Promise.all([
        new Promise((resolve, reject) => {
          let gen = (function * (resolve) {
            let id1 = yield
            let id2 = yield
            expect(id1).not.toEqual(id2)
            expect(id1 === wcs[1].myId || id1 === wcs[2].myId).toBeTruthy()
            expect(id2 === wcs[1].myId || id2 === wcs[2].myId).toBeTruthy()
            resolve()
          })(resolve)
          gen.next()
          wcs[0].onJoining = (id) => gen.next(id)
        }),
        Promise.race([
          new Promise((resolve, reject) => {
            wcs[1].onJoining = (id) => {
              expect(id).toEqual(wcs[2].myId)
              resolve()
            }
          }),
          new Promise((resolve, reject) => {
            wcs[2].onJoining = (id) => {
              expect(id).toEqual(wcs[1].myId)
              resolve()
            }
          })
        ]),
        wcs[0].open()
          .then((data) => Promise.all([
            wcs[1].join(data.key),
            wcs[2].join(data.key)
          ]))
      ])
        .then(() => {
          expect(wcs[0].id).toEqual(wcs[1].id)
          expect(wcs[0].id).toEqual(wcs[2].id)
          done()
        })
        .catch(done.fail)
    })
  })

  describe('Should send/receive', () => {
    const msgs = [
      'What does not kill us makes us stronger',
      'Do or do not there is no try',
      'Easier said than done'
    ]
    const buffers = [
      randArrayBuffer(8, 200),
      randArrayBuffer(8, 200),
      randArrayBuffer(8, 200)
    ]

    it('private string message', (done) => {
      allMessagesAreSentAndReceived(wcs, msgs, String, false)
        .then(done).catch(done.fail)
      wcs[0].sendTo(wcs[1].myId, msgs[0])
      wcs[0].sendTo(wcs[2].myId, msgs[0])
      wcs[1].sendTo(wcs[0].myId, msgs[1])
      wcs[1].sendTo(wcs[2].myId, msgs[1])
      wcs[2].sendTo(wcs[0].myId, msgs[2])
      wcs[2].sendTo(wcs[1].myId, msgs[2])
    })

    it('broadcast string message', (done) => {
      allMessagesAreSentAndReceived(wcs, msgs, String)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(msgs[i])
    })

    it('ArrayBuffer', (done) => {
      allMessagesAreSentAndReceived(wcs, buffers, ArrayBuffer)
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
      let original = ['a' + smallStr, 'b' + smallStr, 'c' + smallStr]
      allMessagesAreSentAndReceived(wcs, original, String)
        .then(done).catch(done.fail)
      for (let i in wcs) wcs[i].send(original[i])
    })

    xit('~4 MB string', (done) => {
      let indexes = [0, 1, 2]
      let index1 = Math.round(2 * Math.random())
      indexes.splice(index1, 1)
      let index2 = indexes[Math.round(Math.random())]
      wcs[index1].onMessage = (id, msg) => {
        expect(id).toEqual(wcs[index2].myId)
        expect(msg).toEqual(bigStr)
        done()
      }
      wcs[index2].send(bigStr)
    }, 4000)

    it(`${MSG_NUMBER} small messages`, (done) => {
      let msgArray0 = []
      let msgArray1 = []
      let msgArray2 = []
      let msgArrays = [msgArray0, msgArray1, msgArray2]
      for (let i = 0; i < MSG_NUMBER / 3; i++) {
        msgArray0[i] = randString()
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
          let counter2 = 0
          wcs[0].onMessage = (id, msg) => {
            if (id === wcs[1].myId) {
              expect(msgArray1.indexOf(msg)).not.toEqual(-1)
              counter1++
            } else {
              expect(msgArray2.indexOf(msg)).not.toEqual(-1)
              counter2++
            }
            if (counter1 === msgArray1.length && counter2 === msgArray2.length) resolve()
          }
        }),
        new Promise((resolve, reject) => {
          let counter1 = 0
          let counter2 = 0
          wcs[1].onMessage = (id, msg) => {
            if (id === wcs[0].myId) {
              expect(msgArray0.indexOf(msg)).not.toEqual(-1)
              counter1++
            } else {
              expect(msgArray2.indexOf(msg)).not.toEqual(-1)
              counter2++
            }
            if (counter1 === msgArray0.length && counter2 === msgArray2.length) resolve()
          }
        }),
        new Promise((resolve, reject) => {
          let counter1 = 0
          let counter2 = 0
          wcs[2].onMessage = (id, msg) => {
            if (id === wcs[0].myId) {
              expect(msgArray0.indexOf(msg)).not.toEqual(-1)
              counter1++
            } else {
              expect(msgArray1.indexOf(msg)).not.toEqual(-1)
              counter2++
            }
            if (counter1 === msgArray0.length && counter2 === msgArray1.length) resolve()
          }
        })
      ]).then(done).catch(done.fail)
      startSend(0)
      startSend(1)
      startSend(2)
    }, 10000)
  })

  it('should ping', (done) => {
    Promise.all([
      wcs[0].ping()
        .then((p) => expect(p).toBeLessThan(300)),
      wcs[1].ping()
        .then((p) => expect(p).toBeLessThan(300)),
      wcs[2].ping()
        .then((p) => expect(p).toBeLessThan(300))
    ]).then(done).catch(done.fail)
  }, 10000)

  describe('Should leave', () => {
    const message = 'Hi world!'

    describe('One by one', () => {
      it('first the peer who opened the WebChannel', (done) => {
        wcs[0].onMessage = done.fail
        wcs[0].onLeaving = done.fail
        wcs[0].onJoining = done.fail
        wcs[1].onMessage = (id, msg) => {
          expect(id).toEqual(wcs[2].myId)
        }
        wcs[2].onMessage = (id, msg) => {
          expect(id).toEqual(wcs[1].myId)
        }
        Promise.all([
          new Promise((resolve, reject) => {
            wcs[1].onLeaving = (id) => {
              expect(id).toBe(wcs[0].myId)
              wcs[0].send(message)
              wcs[0].sendTo(wcs[1].myId, message)
              wcs[1].send(message)
              wcs[1].sendTo(wcs[0].myId, message)
              setTimeout(resolve, 100)
            }
          }),
          new Promise((resolve, reject) => {
            wcs[2].onLeaving = (id) => {
              expect(id).toBe(wcs[0].myId)
              wcs[0].send(message)
              wcs[0].sendTo(wcs[2].myId, message)
              wcs[2].send(message)
              wcs[2].sendTo(wcs[0].myId, message)
              setTimeout(resolve, 100)
            }
          })
        ]).then(() => {
          wcs[1].onMessage = done.fail
          wcs[1].onLeaving = done.fail
          wcs[1].onJoining = done.fail
          wcs[2].onMessage = done.fail
          wcs[2].onLeaving = (id) => {
            expect(id).toBe(wcs[1].myId)
            wcs[1].send(message)
            wcs[1].sendTo(wcs[2].myId, message)
            wcs[2].send(message)
            wcs[2].sendTo(wcs[1].myId, message)
            setTimeout(done, 100)
          }
          wcs[1].leave()
        }).catch(done.fail)
        wcs[0].leave()
      })

      xit('first one of the joined peer', (done) => {
        // FIXME
        wcs[0] = new WebChannel({signaling})
        wcs[1] = new WebChannel({signaling})
        wcs[2] = new WebChannel({signaling})
        wcs[0].open()
          .then((data) => wcs[1].join(data.key))
          .then(() => wcs[2].join(wcs[0].getAccess().key))
          .then(() => {
            wcs[1].onMessage = done.fail
            wcs[1].onLeaving = done.fail
            //wcs[1].onJoining = done.fail
            wcs[0].onMessage = (id, msg) => expect(id).toEqual(wcs[2].myId)
            wcs[2].onMessage = (id, msg) => expect(id).toEqual(wcs[0].myId)
            Promise.all([
              new Promise((resolve, reject) => {
                wcs[0].onLeaving = (id) => {
                  console.log('1')
                  expect(id).toBe(wcs[1].myId)
                  wcs[1].send(message)
                  wcs[1].sendTo(wcs[0].myId, message)
                  wcs[0].send(message)
                  wcs[0].sendTo(wcs[1].myId, message)
                  setTimeout(resolve, 100)
                }
              }),
              new Promise((resolve, reject) => {
                wcs[2].onLeaving = (id) => {
                  console.log('2')
                  expect(id).toBe(wcs[1].myId)
                  wcs[1].send(message)
                  console.log(('SENDING: ' + wcs[1].myId))
                  wcs[1].sendTo(wcs[2].myId, message)
                  wcs[2].send(message)
                  wcs[2].sendTo(wcs[1].myId, message)
                  setTimeout(resolve, 100)
                }
              })
            ]).then(() => {
              console.log('herer')
              wcs[0].onMessage = done.fail
              wcs[0].onLeaving = done.fail
              wcs[0].onJoining = done.fail
              wcs[2].onMessage = done.fail
              wcs[2].onLeaving = (id) => {
                expect(id).toBe(wcs[0].myId)
                wcs[0].send(message)
                wcs[0].sendTo(wcs[2].myId, message)
                wcs[2].send(message)
                wcs[2].sendTo(wcs[0].myId, message)
                setTimeout(done, 100)
              }
              wcs[0].leave()
            }).catch(done.fail)
            console.log('leaving')
            wcs[1].leave()
          }).catch(done.fail)
      })
    })

    xit('simultaneously', (done) => {
      // FIXME
      wcs[0] = new WebChannel({signaling})
      wcs[1] = new WebChannel({signaling})
      wcs[2] = new WebChannel({signaling})
      let counter = 0
      let left1 = false
      let left2 = false
      // wcs[1].leave()
      // wcs[2].leave()
      wcs[0].onMessage = done.fail
      wcs[1].onMessage = done.fail
      wcs[2].onMessage = done.fail
      wcs[0].open()
        .then((data) => wcs[1].join(data.key))
        .then(() => wcs[2].join(wcs[0].getAccess().key))
        .then(() => {
          wcs[0].onLeaving = (id) => {
            if (!left1 && id === wcs[1].myId) {
              wcs[0].sendTo(wcs[1].myId, message)
              wcs[1].sendTo(wcs[0].myId, message)
              left1 = true
            }
            if (!left2 && id === wcs[2].myId) {
              wcs[0].sendTo(wcs[2].myId, message)
              wcs[2].sendTo(wcs[0].myId, message)
              left2 = true
            }
            if (left1 && left2) setTimeout(done, 100)
          }
          wcs[1].leave()
          wcs[2].leave()
        })
    })
  })

  // it('Should not be able to join the WebChannel after it has been closed', (done) => {
  //   expect(wcs[0].isOpen()).toBeTruthy()
  //   wcs[1].join(wcs[0].getAccess().key).then(done.fail)
  //     .catch(done)
  //   wcs[0].close()
  // })
})

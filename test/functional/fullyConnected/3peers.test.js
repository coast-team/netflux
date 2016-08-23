import {signaling, randArrayBuffer, randString, MSG_NUMBER, allMessagesAreSentAndReceived, TestGroup} from 'config'
import WebChannel from 'src/WebChannel'
import {isBrowser} from 'src/helper'
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
    let groupsStr
    let groupsBuf

    beforeAll(() => {
      groupsStr = []
      groupsBuf = []
      for (let i = 0; i < 3; i++) {
        groupsStr[i] = new TestGroup(wcs[i], randString())
        groupsBuf[i] = new TestGroup(wcs[i], randArrayBuffer(8, 200))
      }
    })

    it('private string message', (done) => {
      allMessagesAreSentAndReceived(groupsStr, String, false)
        .then(done).catch(done.fail)
      groupsStr[0].wc.sendTo(groupsStr[1].wc.myId, groupsStr[0].msg)
      groupsStr[0].wc.sendTo(groupsStr[2].wc.myId, groupsStr[0].msg)
      groupsStr[1].wc.sendTo(groupsStr[0].wc.myId, groupsStr[1].msg)
      groupsStr[1].wc.sendTo(groupsStr[2].wc.myId, groupsStr[1].msg)
      groupsStr[2].wc.sendTo(groupsStr[0].wc.myId, groupsStr[2].msg)
      groupsStr[2].wc.sendTo(groupsStr[1].wc.myId, groupsStr[2].msg)
    })

    it('broadcast string message', (done) => {
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

    if (isBrowser()) {
      it('~200 KB string', (done) => {
        let groups = []
        for (let i = 0; i < 3; i++) {
          groups[i] = new TestGroup(wcs[i], smallStr + i)
        }
        allMessagesAreSentAndReceived(groups, String)
          .then(done).catch(done.fail)
        for (let g of groups) g.wc.send(g.msg)
      })

      it('~4 MB string', (done) => {
        let indexes = [0, 1, 2]
        let index1 = Math.round(2 * Math.random())
        indexes.splice(index1, 1)
        let index2 = indexes[Math.round(Math.random())]
        wcs[index1].onMessage = (id, msg) => {
          expect(id).toEqual(wcs[index2].myId)
          expect(msg === bigStr).toBeTruthy()
          done()
        }
        wcs[index2].sendTo(wcs[index1].myId, bigStr)
      }, 4000)
    }

    it(`${MSG_NUMBER} small messages`, (done) => {
      let msgs = []
      for (let i = 0; i < 3; i++) msgs[i] = []
      let nb = Math.floor(MSG_NUMBER / 3)
      for (let i = 0; i < nb; i++) {
        msgs[0][i] = randString()
        msgs[1][i] = randString()
        msgs[2][i] = randString()
      }
      let startSend = (index) => new Promise((resolve, reject) => {
        for (let msg of msgs[index]) wcs[index].send(msg)
        resolve()
      })
      let allMessagesReceived = (index) => {
        return new Promise((resolve, reject) => {
          let counter1 = 0
          let counter2 = 0
          let i1
          let i2
          switch (index) {
            case 0:
              i1 = 1
              i2 = 2
              break
            case 1:
              i1 = 0
              i2 = 2
              break
            case 2:
              i1 = 0
              i2 = 1
              break
          }
          wcs[index].onMessage = (id, msg) => {
            if (id === wcs[i1].myId) {
              expect(msgs[i1].indexOf(msg)).not.toEqual(-1)
              counter1++
            } else {
              expect(id).toEqual(wcs[i2].myId)
              expect(msgs[i2].indexOf(msg)).not.toEqual(-1)
              counter2++
            }
            if (counter1 === nb && counter2 === nb) resolve()
          }
        })
      }
      Promise.all([
        startSend(0),
        startSend(1),
        startSend(2),
        allMessagesReceived(0),
        allMessagesReceived(1),
        allMessagesReceived(2)
      ]).then(done).catch(done.fail)
    }, 15000)
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
            // wcs[1].onJoining = done.fail
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

import {create} from 'src/index'
import * as helper from 'util/helper'
import smallStr from 'util/200kb.txt'
import bigStr from 'util/4mb.txt'

describe('Fully connected: 3 peers', () => {
  let signalingURL = helper.SIGNALING_URL
  let wcs = []
  afterAll(() => {
    wcs[0].leave()
    wcs[1].leave()
    wcs[2].leave()
  })

  describe('Should establish a connection', () => {
    function* checkJoining (resolve, wc) {
      let id1 = yield
      let id2 = yield
      expect(id1).not.toEqual(id2)
      for (let e of wcs) {
        if (e.myId !== wc.myId) {
          expect(e.myId === id1 || e.myId === id2).toBeTruthy()
        }
      }
      resolve()
    }
    let allJoiningDetectedBy = wc => new Promise((resolve, reject) => {
      let gen = checkJoining(resolve, wc)
      gen.next()
      wc.onPeerJoin = id => gen.next(id)
    })

    it('one by one', done => {
      wcs[0] = create({signalingURL})
      wcs[1] = create({signalingURL})
      wcs[2] = create({signalingURL})
      Promise.all([
        allJoiningDetectedBy(wcs[0]),
        allJoiningDetectedBy(wcs[1]),
        allJoiningDetectedBy(wcs[2]),
        wcs[0].open()
          .then(data => wcs[1].join(data.key))
          .then(() => wcs[2].join(wcs[0].getOpenData().key))
      ])
        .then(() => {
          expect(wcs[0].id).toEqual(wcs[1].id)
          expect(wcs[0].id).toEqual(wcs[2].id)
          helper.checkMembers(wcs)
          done()
        })
        .catch(done.fail)
    }, 15000)

    it('simultaneously', done => {
      wcs[0] = create({signalingURL})
      wcs[1] = create({signalingURL})
      wcs[2] = create({signalingURL})
      Promise.all([
        allJoiningDetectedBy(wcs[0]),
        allJoiningDetectedBy(wcs[1]),
        allJoiningDetectedBy(wcs[2]),
        wcs[0].open()
          .then(data => Promise.all([
            wcs[1].join(data.key),
            wcs[2].join(data.key)
          ]))
      ])
        .then(() => {
          expect(wcs[0].id).toEqual(wcs[1].id)
          expect(wcs[0].id).toEqual(wcs[2].id)
          helper.checkMembers(wcs)
          done()
        })
        .catch(done.fail)
    }, 15000)
  })

  describe('Should send/receive', () => {
    let groups

    beforeAll(() => {
      groups = []
      for (let i = 0; i < 3; i++) groups[i] = new helper.TestGroup(wcs[i])
    })

    it('private string message', done => {
      helper.allMessagesAreSentAndReceived(groups, String, false)
        .then(done).catch(done.fail)
      groups[0].wc.sendTo(groups[1].wc.myId, groups[0].get(String))
      groups[0].wc.sendTo(groups[2].wc.myId, groups[0].get(String))
      groups[1].wc.sendTo(groups[0].wc.myId, groups[1].get(String))
      groups[1].wc.sendTo(groups[2].wc.myId, groups[1].get(String))
      groups[2].wc.sendTo(groups[0].wc.myId, groups[2].get(String))
      groups[2].wc.sendTo(groups[1].wc.myId, groups[2].get(String))
    })

    it('broadcast string message', done => {
      helper.allMessagesAreSentAndReceived(groups, String)
        .then(done).catch(done.fail)
      for (let g of groups) g.wc.send(g.get(String))
    })

    for (let i of helper.INSTANCES) {
      it(i.prototype.constructor.name, done => {
        helper.allMessagesAreSentAndReceived(groups, i)
          .then(done).catch(done.fail)
        for (let g of groups) g.wc.send(g.get(i))
      })
    }

    helper.itBrowser(true, '~200 KB string', done => {
      let groups = []
      for (let i = 0; i < 3; i++) {
        groups[i] = new helper.TestGroup(wcs[i], null)
        groups[i].set(String, smallStr + i)
      }
      helper.allMessagesAreSentAndReceived(groups, String)
        .then(done).catch(done.fail)
      for (let g of groups) g.wc.send(g.get(String))
    })

    helper.itBrowser(true, '~4 MB string', done => {
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

    it(`${helper.MSG_NUMBER} small messages`, done => {
      let msgs = []
      for (let i = 0; i < 3; i++) msgs[i] = []
      let nb = Math.floor(helper.MSG_NUMBER / 3)
      for (let i = 0; i < nb; i++) {
        msgs[0][i] = helper.randStr()
        msgs[1][i] = helper.randStr()
        msgs[2][i] = helper.randStr()
      }
      let startSend = index => new Promise((resolve, reject) => {
        for (let msg of msgs[index]) wcs[index].send(msg)
        resolve()
      })
      let allMessagesReceived = index => {
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
              expect(msgs[i1].includes(msg)).toBeTruthy()
              counter1++
            } else {
              expect(id).toEqual(wcs[i2].myId)
              expect(msgs[i2].includes(msg)).toBeTruthy()
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

  it('should ping', done => {
    Promise.all([
      wcs[0].ping()
        .then(p => expect(p).toBeLessThan(300)),
      wcs[1].ping()
        .then(p => expect(p).toBeLessThan(300)),
      wcs[2].ping()
        .then(p => expect(p).toBeLessThan(300))
    ]).then(done).catch(done.fail)
  }, 10000)

  describe('Should leave', () => {
    const message = 'Hi world!'

    describe('One by one', () => {
      it('first the peer who opened the WebChannel', done => {
        wcs[0].onMessage = done.fail
        wcs[0].onPeerLeave = done.fail
        wcs[0].onPeerJoin = done.fail
        wcs[1].onMessage = (id, msg) => {
          expect(id).toEqual(wcs[2].myId)
        }
        wcs[2].onMessage = (id, msg) => {
          expect(id).toEqual(wcs[1].myId)
        }
        Promise.all([
          new Promise((resolve, reject) => {
            wcs[1].onPeerLeave = id => {
              expect(id).toBe(wcs[0].myId)
              wcs[0].send(message)
              wcs[0].sendTo(wcs[1].myId, message)
              wcs[1].send(message)
              wcs[1].sendTo(wcs[0].myId, message)
              setTimeout(resolve, 100)
            }
          }),
          new Promise((resolve, reject) => {
            wcs[2].onPeerLeave = id => {
              expect(id).toBe(wcs[0].myId)
              wcs[0].send(message)
              wcs[0].sendTo(wcs[2].myId, message)
              wcs[2].send(message)
              wcs[2].sendTo(wcs[0].myId, message)
              setTimeout(resolve, 100)
            }
          })
        ]).then(() => {
          expect(wcs[0].members.length).toEqual(0)
          expect(wcs[1].members.length).toEqual(1)
          expect(wcs[1].members[0]).toEqual(wcs[2].myId)
          expect(wcs[2].members.length).toEqual(1)
          expect(wcs[2].members[0]).toEqual(wcs[1].myId)
          wcs[1].onMessage = done.fail
          wcs[1].onPeerLeave = done.fail
          wcs[1].onPeerJoin = done.fail
          wcs[2].onMessage = done.fail
          wcs[2].onPeerLeave = id => {
            expect(id).toBe(wcs[1].myId)
            wcs[1].send(message)
            wcs[1].sendTo(wcs[2].myId, message)
            wcs[2].send(message)
            wcs[2].sendTo(wcs[1].myId, message)
            expect(wcs[0].members.length).toEqual(0)
            expect(wcs[1].members.length).toEqual(0)
            expect(wcs[2].members.length).toEqual(0)
            setTimeout(done, 100)
          }
          wcs[1].leave()
        }).catch(done.fail)
        wcs[0].leave()
      })

      it('first one of the joined peer', done => {
        wcs[0] = create({signalingURL})
        wcs[1] = create({signalingURL})
        wcs[2] = create({signalingURL})
        wcs[0].open()
          .then(data => wcs[1].join(data.key))
          .then(() => wcs[2].join(wcs[0].getOpenData().key))
          .then(() => {
            wcs[1].onMessage = done.fail
            wcs[1].onPeerLeave = done.fail
            // wcs[1].onPeerJoin = done.fail
            wcs[0].onMessage = (id, msg) => expect(id).toEqual(wcs[2].myId)
            wcs[2].onMessage = (id, msg) => expect(id).toEqual(wcs[0].myId)
            Promise.all([
              new Promise((resolve, reject) => {
                wcs[0].onPeerLeave = id => {
                  expect(id).toBe(wcs[1].myId)
                  wcs[1].sendTo(wcs[0].myId, message)
                  wcs[0].sendTo(wcs[1].myId, message)
                  setTimeout(resolve, 100)
                }
              }),
              new Promise((resolve, reject) => {
                wcs[2].onPeerLeave = id => {
                  expect(id).toBe(wcs[1].myId)
                  wcs[1].sendTo(wcs[2].myId, message)
                  wcs[2].sendTo(wcs[1].myId, message)
                  setTimeout(resolve, 100)
                }
              })
            ]).then(() => {
              expect(wcs[1].members.length).toEqual(0)
              expect(wcs[0].members.length).toEqual(1)
              expect(wcs[0].members[0]).toEqual(wcs[2].myId)
              expect(wcs[2].members.length).toEqual(1)
              expect(wcs[2].members[0]).toEqual(wcs[0].myId)
              wcs[0].onMessage = done.fail
              wcs[0].onPeerLeave = done.fail
              wcs[0].onPeerJoin = done.fail
              wcs[2].onMessage = done.fail
              wcs[2].onPeerLeave = id => {
                expect(id).toBe(wcs[0].myId)
                wcs[0].sendTo(wcs[2].myId, message)
                wcs[2].sendTo(wcs[0].myId, message)
                expect(wcs[0].members.length).toEqual(0)
                expect(wcs[1].members.length).toEqual(0)
                expect(wcs[2].members.length).toEqual(0)
                setTimeout(done, 100)
              }
              wcs[0].leave()
            }).catch(done.fail)
            setTimeout(() => wcs[1].leave(), 100)
          }).catch(done.fail)
      })
    })

    it('simultaneously', done => {
      // FIXME
      wcs[0] = create({signalingURL})
      wcs[1] = create({signalingURL})
      wcs[2] = create({signalingURL})
      let left1 = false
      let left2 = false
      // wcs[1].leave()
      // wcs[2].leave()
      wcs[0].onMessage = done.fail
      wcs[1].onMessage = done.fail
      wcs[2].onMessage = done.fail
      wcs[0].open()
        .then(data => wcs[1].join(data.key))
        .then(() => wcs[2].join(wcs[0].getOpenData().key))
        .then(() => {
          wcs[0].onPeerLeave = id => {
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
            if (left1 && left2) {
              expect(wcs[0].members.length).toEqual(0)
              expect(wcs[1].members.length).toEqual(0)
              expect(wcs[2].members.length).toEqual(0)
              setTimeout(done, 100)
            }
          }
          setTimeout(() => {
            wcs[1].leave()
            wcs[2].leave()
          }, 100)
        })
    })
  })

  it('Should not be able to join the WebChannel after it has been closed', done => {
    expect(wcs[0].isOpen()).toBeTruthy()
    wcs[1].join(wcs[0].getOpenData().key).then(done.fail)
      .catch(done)
    wcs[0].close()
  })
})

import {
  SIGNALING
} from 'testhelper'
import WebChannel from 'src/WebChannel'

describe('🙂 🤖  fully connected', () => {
  let signaling = SIGNALING
  let wc

  it('Should establish a connection through WebSocket', done => {
    wc = new WebChannel({signaling})
    let host = '127.0.0.1'
    let port = 9000
    wc.onJoining = (id) => expect(id).toEqual(wc.members[0])
    spyOn(wc, 'onJoining')
    wc.addBotServer(host, port)
      .then(id => {
        expect(wc.members.length).toEqual(1)
        expect(id).toEqual(wc.members[0])
        expect(wc.onJoining).toHaveBeenCalledTimes(1)
        done()
      })
      .catch(done.fail)
  })

  // xdescribe('Should send/receive', () => {
  //   let groups
  //
  //   beforeAll(() => {
  //     groups = []
  //     for (let i = 0; i < 2; i++) groups[i] = new TestGroup(wcs[i])
  //   })
  //
  //   it('Private string message', done => {
  //     allMessagesAreSentAndReceived(groups, String, false)
  //       .then(done).catch(done.fail)
  //     groups[0].wc.sendTo(groups[1].wc.myId, groups[0].get(String))
  //     groups[1].wc.sendTo(groups[0].wc.myId, groups[1].get(String))
  //   })
  //
  //   it('Broadcast string message', done => {
  //     allMessagesAreSentAndReceived(groups, String)
  //       .then(done).catch(done.fail)
  //     for (let g of groups) g.wc.send(g.get(String))
  //   })
  //
  //   for (let i of INSTANCES) {
  //     it(i.prototype.constructor.name, done => {
  //       allMessagesAreSentAndReceived(groups, i)
  //         .then(done).catch(done.fail)
  //       for (let g of groups) g.wc.send(g.get(i))
  //     })
  //   }
  //
  //   it('~200 KB string', done => {
  //     let groups = []
  //     for (let i = 0; i < 2; i++) {
  //       groups[i] = new TestGroup(wcs[i], null)
  //       groups[i].set(String, smallStr + i)
  //     }
  //     allMessagesAreSentAndReceived(groups, String)
  //       .then(done).catch(done.fail)
  //     for (let g of groups) g.wc.send(g.get(String))
  //   })
  //
  //   itBrowser(true, '~4 MB string', done => {
  //     let index1 = Math.round(Math.random())
  //     let index2 = 1 - index1
  //     wcs[index1].onMessage = (id, msg) => {
  //       expect(id).toEqual(wcs[index2].myId)
  //       expect(msg === bigStr).toBeTruthy()
  //       done()
  //     }
  //     wcs[index2].sendTo(wcs[index1].myId, bigStr)
  //   }, 10000)
  //
  //   it(`${MSG_NUMBER} small messages`, done => {
  //     let msgArray1 = []
  //     let msgArray2 = []
  //     let msgArrays = [msgArray1, msgArray2]
  //     let nb = Math.floor(MSG_NUMBER / 3)
  //     for (let i = 0; i < nb; i++) {
  //       msgArray1[i] = randStr()
  //       msgArray2[i] = randStr()
  //     }
  //     let startSend = index => new Promise((resolve, reject) => {
  //       for (let e of msgArrays[index]) wcs[index].send(e)
  //       resolve()
  //     })
  //     Promise.all([
  //       new Promise((resolve, reject) => {
  //         let counter1 = 0
  //         wcs[0].onMessage = (id, msg) => {
  //           counter1++
  //           expect(msgArray2.includes(msg)).toBeTruthy()
  //           if (counter1 === nb) resolve()
  //         }
  //       }),
  //       new Promise((resolve, reject) => {
  //         let counter2 = 0
  //         wcs[1].onMessage = (id, msg) => {
  //           counter2++
  //           expect(msgArray1.includes(msg)).toBeTruthy()
  //           if (counter2 === nb) resolve()
  //         }
  //       })
  //     ]).then(done).catch(done.fail)
  //     startSend(0)
  //     startSend(1)
  //   }, 10000)
  // })
  //
  // xit('Should ping', done => {
  //   Promise.all([
  //     wcs[0].ping()
  //       .then(p => expect(p).toBeLessThan(300)),
  //     wcs[1].ping()
  //       .then(p => expect(p).toBeLessThan(300))
  //   ]).then(done).catch(done.fail)
  // }, 10000)
  //
  // xdescribe('Should leave', () => {
  //   const message = 'Hi world!'
  //
  //   it('The peer who opened the WebChannel', done => {
  //     wcs[0].onMessage = done.fail
  //     wcs[1].onMessage = done.fail
  //     wcs[1].onLeaving = id => {
  //       expect(id).toBe(wcs[0].myId)
  //       wcs[0].send(message)
  //       wcs[0].sendTo(wcs[1].myId, message)
  //       wcs[1].send(message)
  //       wcs[1].sendTo(wcs[0].myId, message)
  //       expect(wcs[0].members.length).toEqual(0)
  //       expect(wcs[1].members.length).toEqual(0)
  //       setTimeout(done, 100)
  //     }
  //     wcs[0].leave()
  //   })
  //
  //   it('Joined peer', done => {
  //     wcs[0] = new WebChannel({signaling})
  //     wcs[0].open()
  //       .then(data => wcs[1].join(data.key))
  //       .then(() => {
  //         wcs[0].onMessage = done.fail
  //         wcs[1].onMessage = done.fail
  //         wcs[0].onLeaving = id => {
  //           expect(id).toBe(wcs[1].myId)
  //           wcs[0].send(message)
  //           wcs[0].sendTo(wcs[1].myId, message)
  //           wcs[1].send(message)
  //           wcs[1].sendTo(wcs[0].myId, message)
  //           expect(wcs[0].members.length).toEqual(0)
  //           expect(wcs[1].members.length).toEqual(0)
  //           setTimeout(done, 100)
  //         }
  //         setTimeout(() => {
  //           wcs[1].leave()
  //         }, 100)
  //       })
  //       .catch(done.fail)
  //   })
  // })
  //
  // xit('Should not be able to join the WebChannel after it has been closed', done => {
  //   expect(wcs[0].isOpen()).toBeTruthy()
  //   let key = wcs[0].getAccess().key
  //   wcs[0].close()
  //   wcs[1].join(key).then(done.fail).catch(done)
  // })
})

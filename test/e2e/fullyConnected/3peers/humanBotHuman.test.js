import {create} from 'src/index.browser'
import * as helper from 'util/helper'

describe('🙂 🤖 🙂  fully connected', () => {
  const wcOptions = {signalingURL: helper.SIGNALING_URL}

  it(helper.env() + ': Should establish a connection', done => {
    const wc1 = create(wcOptions)
    const wc2 = create(wcOptions)
    const key = helper.randStr()
    wc1.onPeerJoin = id => {
      wc1.members.includes(id)
    }
    wc2.onPeerJoin = id => {
      wc2.members.includes(id)
    }
    spyOn(wc1, 'onPeerJoin')
    spyOn(wc2, 'onPeerJoin')
    wc1.open(key)
      .then(() => wc1.invite(helper.BOT))
      .then(() => wc2.join(key))
      .then(() => {
        setTimeout(() => {
          expect(wc1.members.length).toEqual(2)
          expect(wc1.members[0]).not.toEqual(wc1.members[1])
          expect(wc2.members.length).toEqual(2)
          expect(wc2.members[0]).not.toEqual(wc2.members[1])
          expect(wc1.onPeerJoin).toHaveBeenCalledTimes(2)
          expect(wc2.onPeerJoin).toHaveBeenCalledTimes(2)
          wc1.leave()
          wc2.leave()
          done()
        }, 1000)
      })
      .catch(done.fail)
  })
})

// xdescribe('🙂 🤖 🙂  || 🙂 🙂 🤖  fully connected', () => {
//   const key = 'humanBotHuman'
//   const signalingURL = helper.SIGNALING_URL
//   let wc
//   let botId
//
//   it(helper.env() + ': Should establish a connection', done => {
//     let counter = 0
//     wc = create({signalingURL})
//     wc.onPeerJoin = id => {
//       counter++
//       if (counter === 2) {
//         if (botId) {
//           console.log('Me is ' + helper.env() + ' : ' + wc.myId)
//           console.log('First join: ' + wc.members[0])
//           console.log('Seconde join: ' + wc.members[1])
//         }
//         expect(wc.members.length).toEqual(2)
//         setTimeout(done, 1000)
//       }
//     }
//     wc.open({key})
//       .then(() => {
//         console.log(helper.env() + ' opened')
//         wc.invite(helper.BOT)
//           .then(id => { console.log('Bot id is: ' + id); botId = id })
//           .catch(done.fail)
//       })
//       .catch(() => wc.join(key))
//       .catch(done.fail)
//   }, 10000)
//
//   it(helper.env() + ': Should send/receive string', (done) => {
//     // let data = helper.randStr()
//     setTimeout(() => helper.sendReceive(wc, 'lapsdn90350HA2Ràzhc àref', done, botId), 1000)
//   }, 10000)
  //
  // describe('Should send/receive', () => {
  //
  //   it('Private string message', done => {
  //     let data = randData(String)
  //     sendReceive(wc, data, done, wc.members[0])
  //   })
  //
  //   for (let i of INSTANCES) {
  //     it('broadcast: ' + i.prototype.constructor.name, done => {
  //       let data = randData(i)
  //       sendReceive(wc, data, done)
  //     })
  //   }
  //
  //   it('broadcast: ~200 KB string', done => {
  //     sendReceive(wc, smallStr, done)
  //   })
  //
  //   xit('broadcast: ~4 MB string', done => {
  //     sendReceive(wc, bigStr, done)
  //   }, 10000)
  //
  //   it(`${MSG_NUMBER} small messages`, done => {
  //     let data = []
  //     let dataReceived = Array(MSG_NUMBER)
  //     for (let i = 0; i < MSG_NUMBER; i++) data[i] = randData(String)
  //     dataReceived.fill(0)
  //     wc.onMessage = (id, msg, isBroadcast) => {
  //       expect(typeof msg).toEqual('string')
  //       let index = data.indexOf(msg)
  //       expect(index).not.toEqual(-1)
  //       expect(dataReceived[index]++).toEqual(0)
  //       expect(isBroadcast).toBeTruthy()
  //       done()
  //     }
  //     for (let d of data) wc.send(d)
  //   }, 10000)
  // })
  //
  // it('Should ping', done => {
  //   wc.ping().then(p => expect(Number.isInteger(p)).toBeTruthy()).then(done).catch(done.fail)
  // })
  //
  // describe('Should leave', () => {
  //   const message = 'Hi world!'
  //
  //   it('🙂', done => {
  //     wc.onMessage = done.fail
  //     wc.leave()
  //     expect(wc.members.length).toEqual(0)
  //     wc.send(message)
  //     setTimeout(done, 100)
  //   })
  //
  //   it('🤖', done => {
  //     wc.onMessage = done.fail
  //     wc.onPeerLeave = id => {
  //       expect(wc.members.length).toEqual(0)
  //       wc.send(message)
  //       setTimeout(done, 100)
  //     }
  //     wc.addBotServer(BOT)
  //       .then(() => {
  //         wc.sendTo(wc.members[0], JSON.stringify({code: LEAVE_CODE}))
  //       })
  //       .catch(done.fail)
  //   })
  // })
// })

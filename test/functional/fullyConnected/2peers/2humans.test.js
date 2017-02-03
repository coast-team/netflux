import {create} from 'src/index'
import * as helper from 'util/helper'
import smallStr from 'util/200kb.txt'
import bigStr from 'util/4mb.txt'

describe('🙂 🙂  fully connected', () => {
  const wcOptions = {signalingURL: helper.SIGNALING_URL}

  it('Should establish a connection using open/join', done => {
    const wcs = [create(wcOptions), create(wcOptions)]
    Promise.all([
      new Promise((resolve, reject) => {
        wcs[0].onPeerJoin = id => {
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
      .then(() => { for (let wc of wcs) wc.leave() })
      .then(done)
      .catch(done.fail)
  })

  it('Should establish a connection using join/join', done => {
    const wcs = [create(wcOptions), create(wcOptions)]
    const key = helper.randKey()
    Promise.all([
      new Promise((resolve, reject) => {
        wcs[0].onPeerJoin = id => {
          expect(id).toEqual(wcs[1].myId)
          expect(wcs[0].members[0]).toEqual(wcs[1].myId)
          resolve()
        }
      }),
      wcs[0].join(key)
        .then(() => wcs[1].join(key))
        .then(() => {
          expect(wcs[0].id).toEqual(wcs[1].id)
          expect(wcs[1].members[0]).toEqual(wcs[0].myId)
        })
    ])
      .then(() => { for (let wc of wcs) wc.leave() })
      .then(done)
      .catch(done.fail)
  })

  it('Should ping', done => {
    helper.createWebChannels(2, wcOptions)
      .then(wcs => {
        Promise.all([
          wcs[0].ping().then(p => expect(Number.isInteger(p)).toBeTruthy()),
          wcs[1].ping().then(p => expect(Number.isInteger(p)).toBeTruthy())
        ])
        .then(() => { for (let wc of wcs) wc.leave() })
        .then(done)
      })
      .catch(done.fail)
  })

  it('Should be able to open a door while joining the WebChannel after it has been closed', done => {
    const wc = create(wcOptions)
    wc.open()
      .then(data => {
        wc.close()
        return create(wcOptions).join(data.key)
      })
      .then(() => {
        wc.leave()
        done()
      })
      .catch(done.fail)
  })

  describe('Should send/receive', () => {
    let groups = []
    let wcs

    beforeAll(done => {
      helper.createWebChannels(2, wcOptions)
        .then(webChannels => {
          wcs = webChannels
          for (let i = 0; i < 2; i++) groups[i] = new helper.TestGroup(wcs[i])
          done()
        })
    })

    afterAll(() => {
      for (let wc of wcs) wc.leave()
    })

    it('Private string message', done => {
      helper.allMessagesAreSentAndReceived(groups, String, false)
        .then(done).catch(done.fail)
      groups[0].wc.sendTo(groups[1].wc.myId, groups[0].get(String))
      groups[1].wc.sendTo(groups[0].wc.myId, groups[1].get(String))
    })

    it('Broadcast string message', done => {
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

    it('~200 KB string', done => {
      const groups = []
      for (let i = 0; i < 2; i++) {
        groups[i] = new helper.TestGroup(wcs[i], null)
        groups[i].set(String, smallStr + i)
      }
      helper.allMessagesAreSentAndReceived(groups, String)
        .then(done).catch(done.fail)
      for (let g of groups) g.wc.send(g.get(String))
    })

    helper.itBrowser(true, '~4 MB string', done => {
      const index1 = Math.round(Math.random())
      const index2 = 1 - index1
      wcs[index1].onMessage = (id, msg) => {
        expect(id).toEqual(wcs[index2].myId)
        expect(msg === bigStr).toBeTruthy()
        done()
      }
      wcs[index2].sendTo(wcs[index1].myId, bigStr)
    }, 10000)

    it(`${helper.MSG_NUMBER} small messages`, done => {
      const msgArray1 = []
      const msgArray2 = []
      const msgArrays = [msgArray1, msgArray2]
      const nb = Math.floor(helper.MSG_NUMBER / 3)
      for (let i = 0; i < nb; i++) {
        msgArray1[i] = helper.randStr()
        msgArray2[i] = helper.randStr()
      }
      const startSend = index => new Promise((resolve, reject) => {
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

  describe('Should leave', () => {
    let wcs

    beforeEach(done => {
      helper.createWebChannels(2, wcOptions)
        .then(webChannels => { wcs = webChannels })
        .then(done)
    })

    it('opener', done => {
      wcs[0].onMessage = done.fail
      wcs[1].onMessage = done.fail
      wcs[1].onPeerLeave = id => {
        expect(id).toBe(wcs[0].myId)
        expect(wcs[0].members.length).toEqual(0)
        expect(wcs[1].members.length).toEqual(0)
        wcs[1].ping()
          .then(done.fail)
          .catch(done)
      }
      wcs[0].leave()
    })

    it('joining', done => {
      wcs[0].onMessage = done.fail
      wcs[1].onMessage = done.fail
      wcs[0].onPeerLeave = id => {
        expect(id).toBe(wcs[1].myId)
        expect(wcs[0].members.length).toEqual(0)
        expect(wcs[1].members.length).toEqual(0)
        wcs[1].ping()
          .then(done.fail)
          .catch(() => {
            wcs[0].leave()
            done()
          })
      }
      wcs[1].leave()
    })
  })
})

import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

describe('3 peers -> ', () => {
  let wc1, wc2, wc3

  it('Should exchange messages', (done) => {
    let msg1 = 'And I am #1'
    let msg2 = 'Hi, I am #2'
    let msg3 = 'Hello, here is #3'
    // Peer #1
    wc1 = new WebChannel({signaling})
    wc1.onMessage = (id, msg) => {
      console.log('[A RECEIVED FROM', id, '] ', msg)
      if (id === wc3.myId) {
        expect(msg).toEqual(msg3)
      } else if (id === wc2.myId) {
        expect(msg).toEqual(msg2)
        wc1.send(msg1)
      } else done.fail()
    }
    wc1.open().then((data) => {
      // Peer #2
      wc2 = new WebChannel({signaling})
      wc2.onMessage = (id, msg) => {
        console.log('[B RECEIVED FROM', id, '] ', msg)
        if (id === wc3.myId) {
          expect(msg).toEqual(msg3)
          wc2.send(msg2)
        } else if (id === wc1.myId) {
          expect(msg).toEqual(msg1)
          done()
        } else done.fail()
      }

      wc2.join(data.key).then(() => {
        console.log('[B joined]')
        // Peer #3
        wc3 = new WebChannel({signaling})
        wc3.onMessage = (id, msg) => {
          if (id === wc2.myId) {
            expect(msg).toEqual(msg2)
          } else if (id === wc1.myId) {
            expect(msg).toEqual(msg1)
            done()
          } else done.fail()
        }
        wc3.join(data.key)
          .then(() => {
            console.log('[C joined]')
            wc3.send(msg3)
          })
          .catch(done.fail)
      }).catch(done.fail)
    }).catch(done.fail)
  })
})

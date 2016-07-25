import {signaling, randArrayBuffer} from 'config'
import WebChannel from 'src/WebChannel'
import smallStr from '17kb.txt'
import bigStr from '8mb.txt'

describe('Large data -> ', () => {
  let wc1, wc2

  beforeAll((done) => {
    // Peer #1
    wc1 = new WebChannel({signaling})
    wc1.open().then((data) => {
      // Peer #2
      wc2 = new WebChannel({signaling})
      wc2.join(data.key).then(() => {
        done()
      })
        .catch(done.fail)
    }).catch(done.fail)
  })

  describe('Should send & receive String between 2 peers -> ', () => {
    it('~17kb', (done) => {
      wc1.onMessage = (id, msg) => {
        expect(msg).toEqual(smallStr)
        done()
      }
      wc2.send(smallStr)
    })

    it('~8mb', (done) => {
      let startTime
      wc1.onMessage = (id, msg) => {
        console.info('~8mb String sent between 2 peers in: ' + (Date.now() - startTime) + ' ms')
        expect(msg).toEqual(bigStr)
        done()
      }
      startTime = Date.now()
      wc2.send(bigStr)
    }, 10000)
  })

  function isEqual (buffer1, buffer2) {
    let array1 = new Uint8Array(buffer1)
    let array2 = new Uint8Array(buffer2)

    return array1.every((value, index) => {
      return value === array2[index]
    })
  }

  describe('Should send & receive ArrayBuffer between 2 peers -> ', () => {
    let smallBuffer = randArrayBuffer(10000, 10000)
    let bigBuffer = randArrayBuffer(8388608, 8400000)

    it('between 16kb & 20kb', (done) => {
      wc1.onMessage = (id, msg) => {
        expect(isEqual(msg, smallBuffer)).toBeTruthy()
        done()
      }
      wc2.send(smallBuffer)
    }, 10000)

    it('~8mb', (done) => {
      let startTime
      wc1.onMessage = (id, msg) => {
        console.info(bigBuffer.byteLength + ' bytes sent between 2 peers in: ' + (Date.now() - startTime) + ' ms')
        expect(isEqual(msg, bigBuffer)).toBeTruthy()
        done()
      }
      startTime = Date.now()
      wc2.send(bigBuffer)
    }, 10000)
  })
})

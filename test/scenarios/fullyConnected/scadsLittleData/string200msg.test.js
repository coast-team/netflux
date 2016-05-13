import {signaling, MSG_NUMBER} from '../../../config'
import {WebChannel} from '../../../../src/WebChannel'

it('Should send/receive STRING messages', (done) => {
  let msg1Array = []
  let msg2Array = []
  let startTime = null
  for (let i = 0; i < MSG_NUMBER; i++) {
    msg1Array[i] = randString()
    msg2Array[i] = randString()
  }
  let counter = msg1Array.length + msg2Array.length

  // Peer #1
  let wc1 = new WebChannel({signaling})
  wc1.onJoining = (id) => {
    if (startTime == null) startTime = Date.now()
    for (let e of msg1Array) {
      wc1.send(e)
    }
  }
  wc1.onMessage = (id, msg) => {
    counter--
    expect(msg2Array.indexOf(msg)).toBeGreaterThan(-1)
    if (counter <= 0) {
      console.info((MSG_NUMBER * 2) + ' messages sent between 2 peers in: ' + (Date.now() - startTime) + ' ms')
      done()
    }
  }

  wc1.openForJoining().then((data) => {
    // Peer #2
    let wc2 = new WebChannel({signaling})
    wc2.onMessage = (id, msg) => {
      counter--
      expect(msg1Array.indexOf(msg)).toBeGreaterThan(-1)
      if (counter <= 0) {
        console.info((MSG_NUMBER * 2) + ' messages sent between 2 peers in: ' + (Date.now() - startTime) + ' ms')
        done()
      }
    }
    wc2.join(data.key)
      .then(() => {
        if (startTime == null) startTime = Date.now()
        for (let e of msg2Array) {
          wc2.send(e)
        }
      })
      .catch(done.fail)
  }).catch(done.fail)
}, 15000)

function randString () {
  const MIN_LENGTH = 0
  const DELTA_LENGTH = 3700 // To limit message  size to less than 16kb (4 bytes per character)
  const MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  const length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH)

  for (let i = 0; i < length; i++) {
    result += MASK[Math.round(Math.random() * (MASK.length - 1))]
  }
  return result
}

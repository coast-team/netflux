import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

it('2 peers should have the same structure', (done) => {
  let wc1 = new WebChannel({signaling})
  let wc2 = new WebChannel({signaling})
  wc1.onJoining = (id) => {
    expect(wc1.channels.size).toEqual(wc2.channels.size)
    expect(wc1.channels.values().next().value.peerId).toEqual(wc2.myId)
    expect(wc2.channels.values().next().value.peerId).toEqual(wc1.myId)
    done()
  }
  wc1.openForJoining()
    .then((data) => {
      wc2.join(data.key)
        .then(() => {
        })
        .catch(done.fail)
    })
    .catch(done.fail)
})

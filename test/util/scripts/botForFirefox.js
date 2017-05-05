import {create} from 'dist/netflux.es5.module.node.js'
import {SIGNALING_URL, onMessageForBot} from 'test/util/helper'

run()

// Functions
function run () {
  const wc = create({signalingURL: SIGNALING_URL})
  wc.onMessage = (id, msg, isBroadcast) => onMessageForBot(wc, id, msg, isBroadcast)
  wc.onClose = closeEvt => {
    console.log(`FirefoxBot has disconnected from: ${SIGNALING_URL}`)
  }
  wc.open('FIREFOX')
    .then(() => console.log('FirefoxBot is ready'))
    .catch(reason => console.error('FirefoxBot WebChannel open error: ' + reason))

  process.on('SIGINT', () => wc.leave())
}

import {create} from 'dist/netflux.es6.js'
import {SIGNALING_URL, onMessageForBot} from 'test/util/helper'

const wc = create({signalingURL: SIGNALING_URL})
wc.onMessage = (id, msg, isBroadcast) => onMessageForBot(wc, id, msg, isBroadcast)
wc.onClose = closeEvt => {
  console.log(`Firefox bot has disconnected from Signaling server`)
}
wc.open({key: 'FIREFOX'})
  .then(() => console.log('Bot for Firefox is ready'))
  .catch(reason => console.error('Firefox bot WebChannel open error: ' + reason))

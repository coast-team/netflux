import {create} from 'dist/netflux.es2015.js'
import {SIGNALING_URL, LEAVE_CODE, onMessageForBot} from 'test/util/helper'

let wc = create({signalingURL: SIGNALING_URL})
wc.onMessage = (id, msg, isBroadcast) => onMessageForBot(wc, id, msg, isBroadcast)
wc.onClose = closeEvt => {
  console.log(`Firefox bot has disconnected from Signaling server`)
}
wc.open({key: 'FIREFOX'})
  .then(() => console.log('Bot for Firefox is ready'))
  .catch(reason => console.error('Firefox bot WebChannel open error: ' + reason))

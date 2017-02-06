import {create} from 'dist/netflux.es5.module.node.js'
import {SIGNALING_URL, onMessageForBot} from 'test/util/helper'

let wc

function run () {
  wc = create({signalingURL: SIGNALING_URL})
  wc.onMessage = (id, msg, isBroadcast) => onMessageForBot(wc, id, msg, isBroadcast)
  wc.onClose = closeEvt => {
    console.log('Chrome bot has disconnected from Signaling server')
    run()
  }
  wc.open('CHROME')
    .then(() => console.log('Bot for Chrome is ready'))
    .catch(reason => console.error('Chrome bot WebChannel open error: ' + reason))
}
run()

import {SIGNALING, LEAVE_CODE, onMessageForBot} from 'test/utils/helper'
import WebChannel from 'src/WebChannel'

let wc = new WebChannel({signaling: SIGNALING})
wc.onMessage = (id, msg, isBroadcast) => onMessageForBot(wc, id, msg, isBroadcast)
wc.onClose = closeEvt => {
  console.log('Chrome bot has disconnected from Signaling server')
}
wc.open({key: 'chrome'})
  .then(() => console.log('Bot for Chrome is ready'))
  .catch(reason => console.error('Chrome bot WebChannel open error: ' + reason))

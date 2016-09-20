import {SIGNALING, LEAVE_CODE, onMessageForBot} from 'test/utils/helper'
import WebChannel from 'src/WebChannel'

let wc = new WebChannel({signaling: SIGNALING})
wc.onMessage = (id, msg, isBroadcast) => onMessageForBot(wc, id, msg, isBroadcast)
wc.onClose = closeEvt => {
  console.log(`Node bot has disconnected from Signaling server`)
}
wc.open({key: 'node'})
  .then(() => console.log('Bot for Node is ready'))
  .catch(reason => console.error('Node bot WebChannel open error: ' + reason))

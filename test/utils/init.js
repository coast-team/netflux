import {SIGNALING, BOT, CHROME_WC_ID, FIREFOX_WC_ID, LEAVE_CODE} from 'utils/helper'
import WebChannel from 'src/WebChannel'
import WebChannelGate from 'src/WebChannelGate'
import Bot from 'src/Bot'

const bot = new Bot()
const host = BOT.substring(BOT.lastIndexOf('/') + 1, BOT.lastIndexOf(':'))
const port = BOT.substring(BOT.lastIndexOf(':') + 1)

let onMessage = (wc, id, msg, isBroadcast) => {
  try {
    let data = JSON.parse(msg)
    switch (data.code) {
      case LEAVE_CODE:
        wc.leave()
        break
    }
  } catch (err) {
    if (isBroadcast) wc.send(msg)
    else wc.sendTo(id, msg)
  }
}

bot.listen({host, port, log: true})
bot.onWebChannel = wc => {
  wc.onMessage = (id, msg, isBroadcast) => onMessage(wc, id, msg, isBroadcast)
}

let wcSocketChrome = new WebChannel({signaling: SIGNALING})
wcSocketChrome.id = CHROME_WC_ID
wcSocketChrome.onMessage = (id, msg, isBroadcast) => onMessage(wcSocketChrome, id, msg, isBroadcast)

bot.addWebChannel(wcSocketChrome)

let wcSocketFirefox = new WebChannel({signaling: SIGNALING})
wcSocketFirefox.id = FIREFOX_WC_ID
wcSocketFirefox.onMessage = (id, msg, isBroadcast) => onMessage(wcSocketFirefox, id, msg, isBroadcast)
bot.addWebChannel(wcSocketFirefox)

// For WebRTCService testing in Node
const gate = new WebChannelGate()
const key = '12345'

gate.open(channel => {
  channel.onmessage = event => {
    if (event.data === 'ping') channel.send('pong')
    else channel.close()
  }
  channel.onerror = err => console.log('Error in init.js: ' + err.message)
}, {signaling: SIGNALING, key})
  .catch(reason => console.log('Error in init.js: ' + reason))

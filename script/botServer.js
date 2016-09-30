import {create, BotServer} from 'dist/netflux.es2015.js'
import * as helper from 'test/util/helper'

const bot = new BotServer()
const host = helper.BOT.substring(helper.BOT.lastIndexOf('/') + 1, helper.BOT.lastIndexOf(':'))
const port = helper.BOT.substring(helper.BOT.lastIndexOf(':') + 1)

bot.listen({host, port})
  .then(() => {
    bot.onWebChannel = wc => {
      wc.onPeerJoin = id => {console.log(`Me bot ${wc.myId} detected ${id}`)}
      wc.onMessage = (id, msg, isBroadcast) => helper.onMessageForBot(wc, id, msg, isBroadcast)
    }

    let wcSocketChrome = create({signalingURL: helper.SIGNALING_URL})
    wcSocketChrome.id = helper.CHROME_WC_ID
    wcSocketChrome.onMessage = (id, msg, isBroadcast) => helper.onMessageForBot(wcSocketChrome, id, msg, isBroadcast)

    bot.addWebChannel(wcSocketChrome)

    let wcSocketFirefox = create({signalingURL: helper.SIGNALING_URL})
    wcSocketFirefox.id = helper.FIREFOX_WC_ID
    wcSocketFirefox.onMessage = (id, msg, isBroadcast) => helper.onMessageForBot(wcSocketFirefox, id, msg, isBroadcast)
    bot.addWebChannel(wcSocketFirefox)
  })
  .catch(reason => console.error('Error bot server listen: ', reason))

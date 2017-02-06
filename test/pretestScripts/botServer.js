import {create, BotServer} from 'dist/netflux.es5.module.node.js'
import * as helper from 'test/util/helper'

const host = helper.BOT.substring(helper.BOT.lastIndexOf('/') + 1, helper.BOT.lastIndexOf(':'))
const port = helper.BOT.substring(helper.BOT.lastIndexOf(':') + 1)
const server = new BotServer({host, port})

server.start()
  .then(() => {
    server.onWebChannel = wc => {
      wc.onMessage = (id, msg, isBroadcast) => helper.onMessageForBot(wc, id, msg, isBroadcast)
    }

    const wcSocketChrome = create({signalingURL: helper.SIGNALING_URL})
    wcSocketChrome.id = helper.CHROME_WC_ID
    wcSocketChrome.onMessage = (id, msg, isBroadcast) => helper.onMessageForBot(wcSocketChrome, id, msg, isBroadcast)

    server.addWebChannel(wcSocketChrome)

    const wcSocketFirefox = create({signalingURL: helper.SIGNALING_URL})
    wcSocketFirefox.id = helper.FIREFOX_WC_ID
    wcSocketFirefox.onMessage = (id, msg, isBroadcast) => helper.onMessageForBot(wcSocketFirefox, id, msg, isBroadcast)
    server.addWebChannel(wcSocketFirefox)
  })
  .catch(reason => console.error('Error bot server listen: ', reason))

import {create, BotServer} from 'index.node.js'
import * as helper from 'test/util/helper'
import * as log from 'src/log'

// Require dependencies
const http = require('http')
const Koa = require('koa')
const Router = require('koa-router')
const cors = require('kcors')

try {
  // Instantiate main objects
  const app = new Koa()
  const router = new Router()
  const server = http.createServer(app.callback())
  const bot = new BotServer({ bot: { protocol: 'ws', server } })

  // Configure router
  router
    .get('/members/:wcId', (ctx, next) => {
      const wcId = Number(ctx.params.wcId)
      let members = []
      let id
      for (let wc of bot.webChannels) {
        if (wc.id === wcId) {
          members = wc.members
          id = wc.myId
          break
        }
      }
      ctx.body = {id, members}
    })
    .get('/send/:wcId', (ctx, next) => {
      const wcId = Number(ctx.params.wcId)
      for (let wc of bot.webChannels) {
        if (wc.id === wcId) {
          // Create a message
          const msg = JSON.stringify({ id: wc.myId })

          // Broadcast the message
          wc.send(msg)

          // Send the message privately to each peer
          wc.members.forEach(id => wc.sendTo(id, msg))
          ctx.status = 200
          break
        }
      }
    })

  // Apply router and cors middlewares
  app
    .use(cors())
    .use(router.routes())
    .use(router.allowedMethods())

  // Configure bot
  bot.onWebChannel = wc => {
    wc.onMessage = (id, msg, isBroadcast) => {
      helper.onMessageForBot(wc, id, msg, isBroadcast)
    }
  }
  bot.onError = err => log.error('Bot ERROR: ', err)

  // Add specific web channel to the bot for tests in Chrome
  bot.addWebChannel(createWebChannel('CHROME'))

  // Add specific web channel to the bot for tests in Firefox
  bot.addWebChannel(createWebChannel('FIREFOX'))

  // Add specific web channel to the bot for tests in NodeJS
  bot.addWebChannel(createWebChannel('NODE'))

  // Start the server
  server.listen(helper.BOT_PORT, helper.BOT_HOST, () => {
    const host = server.address().address
    const port = server.address().port
    log.info('Netflux bot is listening on ' + host + ':' + port)
  })

  // Leave all web channels before process death
  process.on('SIGINT', () => bot.webChannels.forEach(wc => wc.leave()))
} catch (err) {
  log.error('BotServer script error: ', err)
}

function createWebChannel (env) {
  // Add specific web channel to the bot for tests in Firefox
  const wc = create({signalingURL: helper.SIGNALING_URL})
  wc.onMessage = (id, msg, isBroadcast) => {
    helper.onMessageForBot(wc, id, msg, isBroadcast)
  }
  wc.onClose = closeEvt => {
    log.warn(`${env} bot has disconnected from: ${helper.SIGNALING_URL}`)
  }
  wc.open('FIREFOX')
    .then(() => log.info(`${env} bot is ready`))
    .catch(reason => log.error(`${env} bot WebChannel open error: ${reason}`))
  return wc
}

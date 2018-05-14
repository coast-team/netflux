import { WebGroup, WebGroupBotServer, WebGroupState } from '../../src/index.node'
import { LogLevel, setLogLevel } from '../../src/misc/util'
import { BOT_HOST, BOT_PORT, IBotData, SIGNALING_URL } from './helper'

setLogLevel([LogLevel.DEBUG])

// Require dependencies
const http = require('http')
const Koa = require('koa')
const Router = require('koa-router')
const cors = require('kcors')

const webGroupOptions = { signalingServer: SIGNALING_URL, autoRejoin: false }
try {
  // Instantiate main objects
  const app = new Koa()
  const router = new Router()
  const server = http.createServer(app.callback())
  const bot = new WebGroupBotServer({ server, webGroupOptions })

  // Configure router
  router
    .get('/new/:key', async (ctx: any) => {
      const key = ctx.params.key
      const wg = addWebGroup(bot)
      wg.join(key)
      await (wg as any).waitJoin
      ctx.body = { id: wg.id }
    })
    .get('/leave/:key', (ctx: any) => {
      const key = ctx.params.key
      for (const [, wg] of bot.webGroups) {
        if (wg.key === key) {
          wg.leave()
          bot.webGroups.delete(wg.id)
          ctx.body = fullData(wg)
          return
        }
      }
    })
    .get('/data/:key', (ctx: any) => {
      const key = ctx.params.key
      for (const [, wg] of bot.webGroups) {
        if (wg.key === key) {
          ctx.body = fullData(wg)
          return
        }
      }
      ctx.throw(404, 'WebGroup ' + key + ' not found')
    })
    .get('/waitJoin/:key', async (ctx: any) => {
      const key = ctx.params.key
      for (const [, wg] of bot.webGroups) {
        if (wg.key === key) {
          await (wg as any).waitJoin
          ctx.body = { id: wg.id }
          return
        }
      }
      ctx.throw(404, 'WebGroup ' + key + ' not found')
    })
    .get('/send/:key', (ctx: any) => {
      const key = ctx.params.key
      for (const [id, wg] of bot.webGroups) {
        if (wg.key === key) {
          // Create a message
          const msg = JSON.stringify({ id: wg.myId })

          // Broadcast the message
          wg.send(msg)

          // Send the message privately to each peer
          wg.members.forEach((i) => {
            if (i !== wg.myId) {
              wg.sendTo(id, msg)
            }
          })
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
  bot.onWebGroup = (wg: WebGroup) => configWebGroup(wg)
  bot.onError = (err) => console.error('Bot ERROR: ', err)

  // Start the server
  server
    .listen(BOT_PORT, BOT_HOST, () => {
      const host = server.address().address
      const port = server.address().port
      console.info('Netflux bot is listening on ' + host + ':' + port)
    })(
      // Leave all web channels before process death
      global as any
    )
    .process.on('SIGINT', () => bot.webGroups.forEach((wg) => wg.leave()))
} catch (err) {
  // console.error('Bot server error: ', err)
}

function addWebGroup(bot: WebGroupBotServer): WebGroup {
  const wg = new WebGroup(webGroupOptions)
  configWebGroup(wg)
  bot.webGroups.set(wg.id, wg)
  return wg
}

function configWebGroup(wg: WebGroup) {
  const data: any = {
    autoRejoin: false,
    onMemberJoinCalled: 0,
    joinedMembers: [],
    onMemberLeaveCalled: 0,
    leftMembers: [],
    onStateCalled: 0,
    states: [],
    onSignalingStateCalled: 0,
    signalingStates: [],
    messages: [],
    onMessageToBeCalled: 0,
    signalingServer: '',
  }
  const anyWg = wg as any
  anyWg.waitJoin = new Promise((resolve) => {
    wg.onStateChange = (state) => {
      if (state === WebGroupState.JOINED) {
        resolve()
      }
      data.onStateCalled++
      data.states.push(state)
    }
  })
  wg.onMessage = (id, msg) => {
    data.onMessageToBeCalled++
    data.messages.push({
      id,
      msg: msg instanceof Uint8Array ? Array.from(msg) : msg,
    })
    let feedback
    let isSend = false
    if (typeof msg === 'string') {
      feedback = 'bot: ' + msg
      isSend = msg.startsWith('send')
    } else {
      isSend = msg[0] === 10
      msg[0] = 42
      feedback = msg
    }
    if (isSend) {
      wg.send(feedback)
    } else {
      wg.sendTo(id, feedback)
    }
  }
  wg.onMemberJoin = (id) => {
    data.onMemberJoinCalled++
    data.joinedMembers.push(id)
  }
  wg.onMemberLeave = (id) => {
    data.onMemberLeaveCalled++
    data.leftMembers.push(id)
  }

  wg.onSignalingStateChange = (state) => {
    data.onSignalingStateCalled++
    data.signalingStates.push(state)
  }
  anyWg.data = data
}

function fullData(wg: any): IBotData {
  wg.data.state = wg.state
  wg.data.signalingState = wg.signalingState
  wg.data.key = wg.key
  wg.data.topology = wg.topology
  wg.data.members = wg.members
  wg.data.myId = wg.myId
  wg.data.id = wg.id
  wg.data.autoRejoin = wg.autoRejoin
  wg.data.signalingServer = wg.signalingServer
  return wg.data
}

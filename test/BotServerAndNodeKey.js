import {signaling} from './config'
import WebRTCService from '../src/service/channelBuilder/WebRTCService'
import WebSocketService from '../src/service/channelBuilder/WebSocketService'

let webRTCService = new WebRTCService()
let webSocketService = new WebSocketService()
let key = '12345'

var host = '127.0.0.1'
var port1 = 9000
var port2 = 9001
let netflux = require('../dist/netflux.es2015.umd.js')

const DEBUG_PING = 'DEBUG_PING'
const DEBUG_PONG = 'DEBUG_PONG'
const DEBUG_KICK = 'DEBUG_KICK'

let bot1 = new netflux.Bot()
bot1.listen({host, port: port1, log: true})

bot1.onWebChannel = (wc) => {
  // bot.log('connected', 'Connected to the network')
  // bot.log('id', wc.myId)

  wc.onJoining = (id) => {
    // bot1.log('joining', 'Joinning of a new client [' + id + ']')
  }

  wc.onLeaving = (id) => {
    // bot1.log('leaving', 'Leaving of client [' + id + ']')
  }

  wc.onMessage = (id, msg) => {
    // bot1.log('message bot1', '[From ' + id + '] ' + msg)
    if (msg === DEBUG_PING) wc.send(DEBUG_PONG)
    if (msg === DEBUG_KICK) bot1.leave(wc)
  }
}

let bot2 = new netflux.Bot()
bot2.listen({host, port: port2, log: true})

bot2.onWebChannel = (wc) => {
  // bot.log('connected', 'Connected to the network')
  // bot.log('id', wc.myId)

  wc.onJoining = (id) => {
    // bot2.log('joining bot2', 'Joinning of a new client [' + id + ']')
  }

  wc.onLeaving = (id) => {
    // bot2.log('leaving bot2', 'Leaving of client [' + id + ']')
  }

  wc.onMessage = (id, msg) => {
    // bot2.log('message bot2', '[From ' + id + '] ' + msg)
    if (msg === DEBUG_PING) wc.send(DEBUG_PONG)
    if (msg === DEBUG_KICK) bot2.leave(wc)
  }
}

// Create a key for connection between node and browser
webSocketService.connect(signaling)
  .then((ws) => {
    ws.send(JSON.stringify({key}))
    webRTCService.listenFromSignaling(ws, (channel) => {
      channel.onmessage = (event) => {
        if (event.data === 'ping') {
          channel.send('pong')
        } else {
          channel.close()
        }
      }
      channel.onerror = (error) => {
        console.error(error)
      }
    })
  })
  .catch(() => {
    console.log('error in opening websocket')
  })

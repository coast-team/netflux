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
    // bot.log('joining', 'Joinning of a new client [' + id + ']')
  }

  wc.onLeaving = (id) => {
    // bot.log('leaving', 'Leaving of client [' + id + ']')
  }

  wc.onMessage = (id, msg) => {
    // bot.log('message', '[From ' + id + '] ' + msg)
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
    // bot.log('joining', 'Joinning of a new client [' + id + ']')
  }

  wc.onLeaving = (id) => {
    // bot.log('leaving', 'Leaving of client [' + id + ']')
  }

  wc.onMessage = (id, msg) => {
    // bot.log('message', '[From ' + id + '] ' + msg)
    if (msg === DEBUG_PING) wc.send(DEBUG_PONG)
    if (msg === DEBUG_KICK) bot2.leave(wc)
  }
}

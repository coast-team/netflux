var host = '127.0.0.1'
var port = 9000
let netflux = require('../dist/netflux.es2015.umd.js')

const DEBUG_PING = 'DEBUG_PING'
const DEBUG_PONG = 'DEBUG_PONG'
const DEBUG_KICK = 'DEBUG_KICK'

let bot = new netflux.Bot()
bot.listen({host, port, log: true})

bot.onWebChannel = (wc) => {
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
    if (msg === DEBUG_KICK) bot.leave(wc)
  }
}

bot.onLaunch = () => {
  // bot.log('WebSocketServer', 'Server runs on: ws://' + host + ':' + port)
}

bot.onConnection = () => {
  // bot.log('connection', 'Connection of one client')
}

bot.onAddRequest = () => {
  // bot.log('add', 'Add request received')
}

bot.onNewChannelRequest = () => {
  // bot.log('new_channel', 'New channel request received')
}

bot.onCodeError = () => {
  // bot.log('error', 'Unknown code message')
}

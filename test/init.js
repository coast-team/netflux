import {SIGNALING} from 'testhelper'
import WebChannelGate from 'src/WebChannelGate'
import Bot from 'src/Bot'

// For bot testing
const host = '127.0.0.1'
const port1 = 9000
const port2 = 9001
const port = 9002

const DEBUG_PING = 'DEBUG_PING'
const DEBUG_PONG = 'DEBUG_PONG'
const DEBUG_KICK = 'DEBUG_KICK'

const bot = new Bot()
const bot1 = new Bot()
const bot2 = new Bot()
bot1.listen({host, port: port1, log: true})
bot1.onWebChannel = wc => {
  wc.onMessage = (id, msg) => {
    if (msg === DEBUG_PING) wc.send(DEBUG_PONG)
    if (msg === DEBUG_KICK) wc.leave()
  }
}

bot2.listen({host, port: port2, log: true})
bot2.onWebChannel = wc => {
  wc.onMessage = (id, msg) => {
    if (msg === DEBUG_PING) wc.send(DEBUG_PONG)
    if (msg === DEBUG_KICK) wc.leave()
  }
}

bot.listen({host, port, log: true})
bot.onWebChannel = wc => {
  wc.onMessage = (id, msg, isBroadcast) => {
  //   switch (msg.code) {
  //     case
  //   }
  }
}

// For WebRTC Node testing
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

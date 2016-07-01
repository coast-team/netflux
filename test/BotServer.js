// import {WebChannel} from '../src/WebChannel'
var host = '127.0.0.1'
var port = 9000
let WebSocketServer = require('ws').Server
let netflux = require('../dist/netflux.es2015.umd.js')

const ADD_BOT_SERVER = 'addBotServer'
const NEW_CHANNEL = 'newChannel'
const DEBUG_PING = 'DEBUG_PING'
const DEBUG_PONG = 'DEBUG_PONG'

let webChannels = []

let server = new WebSocketServer({host, port}, () => {
  log('WebSocketServer', 'Server runs on: ws://' + host + ':' + port)
})

server.on('connection', (socket) => {
  log('connected', 'Connection of one client')

  socket.on('message', (msg) => {
    var data = {code: ''}
    try {
      data = JSON.parse(msg)
    } catch (e) {}
    switch (data.code) {
      case ADD_BOT_SERVER:
        log('add', 'Add request received')
        var webChannel, onJoining, onLeaving, onMessage, onChannelClose

        onJoining = (id) => {
          log('joining', 'Joinning of a new client [' + id + ']')
        }

        onLeaving = (id) => {
          log('leaving', 'Leaving of client [' + id + ']')
        }

        onMessage = (id, msg) => {
          log('message', '[From ' + id + '] ' + msg)
          if (msg === DEBUG_PING) webChannel.send(DEBUG_PONG)
        }

        onChannelClose = (evt) => {
          // log('closed', 'WebChannel has been closed')
        }

        webChannel = new netflux.WebChannel({'connector': 'WebSocket', host, port})
        webChannel.onJoining = onJoining
        webChannel.onMessage = onMessage
        webChannel.onLeaving = onLeaving
        webChannel.onChannelClose = onChannelClose
        webChannel.joinAsBot(socket, data.sender).then(() => {
          webChannel.channels.forEach((value) => {
            onJoining(value.peerId)
          })
          log('connected', 'Connected to the network')
          log('id', webChannel.myId)
        })

        webChannels.push(webChannel)
        break
      case NEW_CHANNEL:
        log('new_channel', 'New channel request received')
        for (var wc of webChannels) {
          if (!data.which_connector_asked) wc.connectMeToRequests.get(data.sender)(true, socket)
          else wc.initChannel(socket, false, data.sender)
        }
        break
      default:
        log('error', 'Unknown code message')
    }
  })
})

function getDate () {
  var d = new Date()
  return '' + d.toLocaleTimeString() + ' ' + d.toLocaleDateString()
}

function log (label, msg) {
  let datetime = getDate()
  console.log('[', label.toUpperCase(), '] [', datetime, ']', msg)
}

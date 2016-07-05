import {WebChannel} from './WebChannel'

const ADD_BOT_SERVER = 'addBotServer'
const NEW_CHANNEL = 'newChannel'

class Bot {
  constructor (options = {}) {
    if (typeof window !== 'undefined') throw new Error('Bot can be instanciate only in Node\'s environment')
    this.defaults = {
      host: '127.0.0.1',
      port: 9000,
      log: false
    }
    this.settings = Object.assign({}, this.defaults, options)
    this.webChannels = []
    this.onWebChannel = (wc) => {}
    this.server
  }

  listen (options = {}) {
    this.settings = Object.assign({}, this.settings, options)
    let WebSocketServer = require('ws').Server
    this.server = new WebSocketServer({host: this.settings.host, port: this.settings.port}, () => {
      this.log('WebSocketServer', 'Server runs on: ws://' + this.settings.host + ':' + this.settings.port)
    })

    this.server.on('connection', (socket) => {
      this.log('connected', 'Connection of one client')

      socket.on('message', (msg) => {
        var data = {code: ''}
        try {
          data = JSON.parse(msg)
        } catch (e) {}
        switch (data.code) {
          case ADD_BOT_SERVER:
            this.log('add', 'Add request received')
            let webChannel

            webChannel = new WebChannel({'connector': 'WebSocket',
              host: this.settings.host, port: this.settings.port})

            webChannel.joinAsBot(socket, data.sender).then(() => {
              this.onWebChannel(webChannel)
              this.log('connected', 'Connected to the network')
              this.log('id', webChannel.myId)
            })

            this.webChannels.push(webChannel)
            break
          case NEW_CHANNEL:
            this.log('new_channel', 'New channel request received')
            for (var wc of this.webChannels) {
              if (data.wcId === wc.id) {
                if (!data.which_connector_asked) wc.connectMeToRequests.get(data.sender)(true, socket)
                else wc.initChannel(socket, false, data.sender)
              }
            }
            break
          default:
            this.log('error', 'Unknown code message')
        }
      })
    })
  }

  getWebChannels () {
    return this.webChannels
  }

  getServer () {
    return this.server
  }

  log (label, msg) {
    if (this.settings.log) {
      var d = new Date()
      let datetime = '' + d.toLocaleTimeString() + ' ' + d.toLocaleDateString()
      console.log('[', label.toUpperCase(), '] [', datetime, ']', msg)
    }
  }
}

export { Bot }

import {WebChannel} from './WebChannel'
import {CHANNEL_BUILDER, provide} from './serviceProvider'

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

    this.server
    this.webChannels = []

    this.onWebChannel = (wc) => {
      // this.log('connected', 'Connected to the network')
      // this.log('id', wc.myId)
    }

    this.onLaunch = () => {
      // this.log('WebSocketServer', 'Server runs on: ws://' + this.settings.host + ':' + this.settings.port)
    }

    this.onConnection = () => {
      // this.log('connected', 'Connection of one client')
    }

    this.onAddRequest = () => {
      // this.log('add', 'Add request received')
    }

    this.onNewChannelRequest = () => {
      // this.log('new_channel', 'New channel request received')
    }

    this.onCodeError = () => {
      // this.log('error', 'Unknown code message')
    }
  }

  listen (options = {}) {
    this.settings = Object.assign({}, this.settings, options)
    let WebSocketServer = require('ws').Server
    this.server = new WebSocketServer({host: this.settings.host, port: this.settings.port}, () => {
      this.onLaunch()
    })

    this.server.on('connection', (socket) => {
      this.onConnection()

      socket.on('message', (msg) => {
        var data = {code: ''}
        try {
          data = JSON.parse(msg)
        } catch (e) {}
        switch (data.code) {
          case ADD_BOT_SERVER:
            this.addBotServer(socket, data)
            break
          case NEW_CHANNEL:
            this.newChannel(socket, data)
            break
          default:
            this.onCodeError()
        }
      })
    })
  }

  addBotServer (socket, data) {
    let alreadyPresent = false
    this.webChannels.forEach((wc, index) => {
      if (data.wcId === wc.id) alreadyPresent = true
    })

    if (!alreadyPresent) {
      this.onAddRequest()
      let webChannel

      webChannel = new WebChannel({'connector': 'WebSocket',
      host: this.settings.host, port: this.settings.port})

      webChannel.joinAsBot(socket, data.sender).then(() => {
        this.onWebChannel(webChannel)
      })

      this.webChannels.push(webChannel)
    }
  }

  newChannel (socket, data) {
    let channelBuilderService = provide(CHANNEL_BUILDER)
    this.onNewChannelRequest()
    for (var wc of this.webChannels) {
      if (data.wcId === wc.id) {
        channelBuilderService.onChannel(wc, socket, !data.which_connector_asked, data.sender)
        break
      }
    }
  }

  leave (WebChannel) {
    let index = -1
    for (let i = 0; i < this.webChannels.length; i++) {
      if (WebChannel.id === this.webChannels[i].id) {
        index = i
        break
      }
    }
    this.webChannels.splice(index, 1)[0].leave()
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

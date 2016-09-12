import {isBrowser} from 'helper'
import WebChannel from 'WebChannel'
import Channel from 'Channel'
import {CHANNEL_BUILDER, MESSAGE_BUILDER, WEBSOCKET, provide} from 'serviceProvider'
import {JOIN, NEW_CHANNEL} from 'service/MessageBuilderService'

class Bot {
  constructor (options = {}) {
    if (isBrowser()) throw new Error('Bot can be instanciated only in Node\'s environment')
    this.defaults = {
      host: '127.0.0.1',
      port: 9000,
      log: false
    }
    this.settings = Object.assign({}, this.defaults, options)

    this.server
    this.webChannels = []

    this.onWebChannel = wc => {
      // this.log('connected', 'Connected to the network')
      // this.log('id', wc.myId)
    }
  }

  listen (options = {}) {
    return new Promise((resolve, reject) => {
      this.settings = Object.assign({}, this.settings, options)
      let WebSocketServer = require('ws').Server
      this.server = new WebSocketServer({
        host: this.settings.host,
        port: this.settings.port
      }, () => resolve())

      this.server.on('error', () => {
        reject('WebSocketServerError with ws://' + this.settings.host + ':' + this.settings.port)
      })

      this.server.on('connection', socket => {
        let channel = new Channel(socket)
        let msgBld = provide(MESSAGE_BUILDER)
        channel.onMessage = data => {
          let header = msgBld.readHeader(data)
          let msg = msgBld.readInternalMessage(data)
          let wc = this.findWebChannel(msg.wcId)
          switch (header.code) {
            case JOIN:
              if (wc === null) {
                wc = new WebChannel({connector: WEBSOCKET})
                wc.joinAsBot(channel.channel).then(() => this.onWebChannel(wc))
              } else wc.addChannel(channel.channel)
              break
            case NEW_CHANNEL:
              if (wc !== null) {
                provide(CHANNEL_BUILDER).onChannel(wc, channel.channel, msg.oneMsg, header.senderId)
              }
              break
            default:
              channel.close()
          }
        }
      })
    })
  }

  addWebChannel (wc) {
    this.webChannels[this.webChannels.length] = wc
  }

  stopListen () {
    return this.server.close()
  }

  findWebChannel (id) {
    this.webChannels.forEach((wc, index) => {
      if (id === wc.id) {
        if (wc.members.length === 0) this.webChannels.splice(index, 1)
        else return wc
      }
    })
    return null
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

  log (label, msg) {
    if (this.settings.log) {
      var d = new Date()
      let datetime = '' + d.toLocaleTimeString() + ' ' + d.toLocaleDateString()
      console.log('[', label.toUpperCase(), '] [', datetime, ']', msg)
    }
  }
}

export default Bot

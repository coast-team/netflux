import WebChannel from 'WebChannel'
import {provide, WEBSOCKET, CHANNEL_BUILDER, FULLY_CONNECTED} from 'serviceProvider'
import {setListenOnSocket} from 'service/WebSocketService'

const MESSAGE_TYPE_ERROR = 4000
const MESSAGE_UNKNOWN_ATTRIBUTE = 4001

class BotServer {
  constructor (options = {}) {
    this.defaultSettings = {
      connector: WEBSOCKET,
      topology: FULLY_CONNECTED,
      signalingURL: 'wss://sigver-coastteam.rhcloud.com:8443',
      iceServers: [
        {urls: 'stun:turn01.uswest.xirsys.com'}
      ],
      host: 'localhost',
      port: 9000
    }
    this.settings = Object.assign({}, this.defaultSettings, options)

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
      }, () => {
        setListenOnSocket(true)
        resolve()
      })

      this.server.on('error', (err) => {
        console.log('Server error: ', err)
        setListenOnSocket(false)
        reject('WebSocketServerError with ws://' + this.settings.host + ':' + this.settings.port)
      })

      this.server.on('connection', ws => {
        ws.onmessage = msgEvt => {
          try {
            let msg = JSON.parse(msgEvt.data)
            if ('join' in msg) {
              let wc = this.getWebChannel(msg.join)
              if (wc === null) {
                ws.send(JSON.stringify({isKeyOk: false}))
              } else {
                ws.send(JSON.stringify({isKeyOk: true, useThis: true}))
                wc.invite(ws)
              }
            } else if ('wcId' in msg) {
              let wc = this.getWebChannel(msg.wcId)
              if (wc === null) {
                if (wc === null) wc = new WebChannel(this.settings)
                wc.id = msg.wcId
                this.addWebChannel(wc)
                wc.join(ws).then(() => { this.onWebChannel(wc) })
              } else if ('senderId' in msg) {
                provide(CHANNEL_BUILDER).onChannel(wc, ws, msg.senderId)
              } else {
                ws.close(MESSAGE_UNKNOWN_ATTRIBUTE, 'Unsupported message protocol')
              }
            }
          } catch (err) {
            ws.close(MESSAGE_TYPE_ERROR, 'msg')
            console.error(`Unsupported message type: ${err.message}`)
          }
        }
      })
    })
  }

  stopListen () {
    return this.server.close()
  }

  getWebChannel (id) {
    for (let wc of this.webChannels) {
      if (id === wc.id) return wc
    }
    return null
  }

  addWebChannel (wc) {
    this.webChannels[this.webChannels.length] = wc
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
}

export default BotServer

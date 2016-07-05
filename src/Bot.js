class Bot {
  constructor (options = {}) {
    if (typeof window === 'undefined') throw new Error('Bot can be instanciate only in Node\'s environment')
    this.defaults = {
      host: '127.0.0.1',
      port: 8080
    }
    this.settings = Object.assign({}, this.defaults, options)

    this.server
  }

  listen (options = {}) {
    this.settings = Object.assign({}, this.defaults, options)
    // let WebSocketServer = require('ws').Server
    // this.server = new WebSocketServer({host: this.settings.host, port: this.settings.port})
    //
    // this.server.on('connection', (socket) => {
    //   console.log('[CONNECTED] Connection of one client')
    //
    //   socket.on('message', (msg) => {
    //     console.log('[MESSAGE] New message: ', msg)
    //   })
    // })
  }
}

export { Bot }

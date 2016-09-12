import {SIGNALING, randKey} from 'utils/helper'
import WebRTCService from 'src/service/WebRTCService'
import WebSocketService from 'src/service/WebSocketService'
import WebChannelGate from 'src/WebChannelGate'

describe('WebRTCService', () => {
  let signaling = SIGNALING
  let webRTCService
  let webSocketService
  let socket

  beforeEach(() => {
    webRTCService = new WebRTCService()
    webSocketService = new WebSocketService()
  })

  describe('connectOverSignaling', () => {
    it('Should open a data channel', done => {
      const key = randKey()
      const gate = new WebChannelGate()

      gate.open(channel => {
        channel.onmessage = msgEvt => {
          expect(msgEvt.data).toEqual('ping')
          channel.send('pong')
        }
      }, {signaling, key})
        .then(() => webSocketService.connect(signaling))
        .then(ws => {
          socket = ws
          return webRTCService.connectOverSignaling(ws, key)
        })
        .then(channel => {
          channel.onmessage = msgEvt => {
            expect(msgEvt.data).toEqual('pong')
            channel.close()
            gate.close()
            socket.close()
            done()
          }
          channel.send('ping')
        })
        .catch(done.fail)
    })

    xit('Should open a data channel with Node (init.js)', done => {
      webSocketService.connect(signaling)
        .then(ws => {
          socket = ws
          return webRTCService.connectOverSignaling(ws, '12345')
        })
        .then(channel => {
          channel.onmessage = msgEvt => {
            expect(msgEvt.data).toEqual('pong')
            channel.close()
            socket.close()
            done()
          }
          channel.send('ping')
        })
    })
  })

  it('Should fail to open a data channel because of a wrong key', done => {
    webSocketService.connect(signaling)
      .then(ws => {
        socket = ws
        return webRTCService.connectOverSignaling(ws, randKey())
      })
      .then(done.fail)
      .catch(() => {
        socket.close()
        done()
      })
  })
})

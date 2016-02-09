import * as cs from '../constants'
import ServiceProvider from '../ServiceProvider'

export default class ExchangeProtocolService {

  constructor (options = {}) {}

  onmessage (e) {
    let msg = JSON.parse(e.data)
    let channel = e.currentTarget
    let webChannel = channel.webChannel

    switch (msg.code) {
      case cs.USER_DATA:
        webChannel.onmessage(msg.id, msg.data)
        break
      case cs.SERVICE_DATA:
        let service = ServiceProvider.get(msg.service)
        service.onmessage(channel, msg.data)
        break
      case cs.YOUR_NEW_ID:
        // TODO: change names
        webChannel.myID = msg.newID
        channel.peerID = msg.myID
        break
      case cs.JOIN_START:
        // 2.1) Send to the new client the webChannel topology
        webChannel.topology = msg.topology
        webChannel.topologyService = ServiceProvider.get(msg.topology)
        break
      case cs.JOIN_FINISH:
        webChannel.topologyService.addFinish(webChannel, msg.id)
        if (msg.id != webChannel.myID) {
          webChannel.onJoining(msg.id)
        }
        break
    }
  }

  message (code, data) {
    let msg = {code}
    switch (code) {
      case cs.USER_DATA:
        msg.id = data.id
        msg.data = data.data
        break
      case cs.SERVICE_DATA:
        msg.service = data.service
        msg.data = Object.assign({}, data.data)
        break
      case cs.YOUR_NEW_ID:
        msg.newID = data.newID
        msg.myID = data.myID
        break
      case cs.JOIN_START:
        msg.topology = data
        break
      case cs.JOIN_FINISH:
        msg.id = data
        break
    }
    return JSON.stringify(msg)
  }
}

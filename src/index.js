import BotServer from 'BotServer'
import WebChannel from 'WebChannel'
import {WEBSOCKET, WEBRTC, FULLY_CONNECTED} from 'serviceProvider'

let defaultSettings = {
  connector: WEBRTC,
  topology: FULLY_CONNECTED,
  signalingURL: 'wss://sigver-coastteam.rhcloud.com:8443',
  iceServers: [
    {urls: 'stun:turn01.uswest.xirsys.com'}
  ],
  listenOn: ''
}

function create (options) {
  let mySettings = Object.assign({}, defaultSettings, options)
  return new WebChannel(mySettings)
}

export {
  create,
  BotServer,
  WEBSOCKET,
  WEBRTC
}

/**
 * An event handler to be called when the *close* event is received either by the *WebSocket* or by the *RTCDataChannel*.
 * @callback closeEventHandler
 * @param {external:CloseEvent} evt Close event object
 */

 /**
  * An event handler to be called when a *Channel* has been established.
  * @callback channelEventHandler
  * @param {Channel} channel Netflux channel
  */

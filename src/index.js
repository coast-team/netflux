import BotServer from 'BotServer'
import WebChannel from 'WebChannel'
import {WEB_SOCKET, WEB_RTC, FULLY_CONNECTED} from 'ServiceFactory'

/**
 * Create `WebChannel`.
 *
 * @param {WebChannelSettings} options
 * @param {WEB_RTC|WEB_SOCKET} [options.connector=WEB_RTC] Which connector is preferable during connection establishment
 * @param {FULLY_CONNECTED} [options.topology=FULLY_CONNECTED] Fully connected topology is the only one available for now
 * @param {string} [options.signalingURL='wss://sigver-coastteam.rhcloud.com:8443'] Signaling server url
 * @param {RTCIceServer} [options.iceServers=[{urls:'stun:turn01.uswest.xirsys.com'}]] Set of ice servers for WebRTC
 * @param {string} [options.listenOn=''] Server url when the peer is listen on web socket
 *
 * @returns {WebChannel}
 */
function create (options) {
  let defaultSettings = {
    connector: WEB_RTC,
    topology: FULLY_CONNECTED,
    signalingURL: 'wss://sigver-coastteam.rhcloud.com:8443',
    iceServers: [
     {urls: 'stun:turn01.uswest.xirsys.com'}
    ],
    listenOn: ''
  }
  let mySettings = Object.assign({}, defaultSettings, options)
  return new WebChannel(mySettings)
}

export {
  create,
  BotServer,
  WEB_SOCKET,
  WEB_RTC
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

# NPM
```shell
npm install -S netflux
```
Netflux has an optional dependency: `wrtc`. This package provides WebRTC API in NodeJS. It is optional because Netflux can use `WebSocket` instead. For some use cases maybe you still want to connect your server to the peer to peer network via `RTCDataChannel`, then you have to successfully install this dependency.

If you have problems with `wrtc` installation then:
- For Ubuntu 16.04 execute: `sudo apt-get install pkg-config libncurses5-dev libssl-dev libnss3-dev libexpat1-dev`
- For another system, consult `wrtc` home page: https://github.com/js-platform/node-webrtc


# What you need
For fully functional peer to peer network, Netflux needs:
 - Signaling server (default: `wss://sigver-coastteam.rhcloud.com:8443`)
 - STUN server (default: `stun:turn01.uswest.xirsys.com`)
 - TURN server (no default)

Netflux comes with Signaling and STUN servers by default for easier quickstart. You may specify each of those servers ([how to do it](configuration.html)).


## Signaling server
We developed a signaling server called [Sigver](https://github.com/coast-team/sigver). It is the only signaling server (signaling mechanism) which is supported by Netflux for now. It is available online:

```
ws://sigver-coastteam.rhcloud.com:8000
```
or
```
wss://sigver-coastteam.rhcloud.com:8443
```

**Remark**: Due to the rhcloud application hosting specification, following a period of inactivity, the server will be available after a while. Try again a few seconds later.

We recommend to deploy your own instance of Sigver for production.

## STUN/TURN servers
STUN and TURN servers are used by WebRTC.

A few free STUN servers are available online, provided by Xirsys or Google for example. Unfortunately free TURN server is no longer available on the Internet. Thus there is no one by default in Netflux. Some companies like [Xirsys](http://xirsys.com) may help.

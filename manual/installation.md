# Installation

## NPM
```shell
npm install -S netflux
```
Netflux has an optional peer dependency: `wrtc`. This package provides WebRTC API in NodeJS. It is optional because Netflux can use `WebSocket` instead. For some use cases maybe you still want to connect your server to the peer to peer network via `RTCDataChannel`, then you have to successfully install this dependency, checkout [wrtc repository](https://github.com/js-platform/node-webrtc) then.


## What you need
Signaling server is only mandatory server for Netflux, but for a fully functional peer to peer network (to support all use cases) we also need STUN and TURN servers.

Netflux comes with Signaling and STUN servers by default for easier quickstart. For TURN server two solutions are possible: either deploy your own or rent one at [Xirsys](https://xirsys.com/) for example or any other similar services.


### Signaling server
**Default**: `wss://www.coedit.re:20443`.

We developed a Signaling server: [Sigver](https://github.com/coast-team/sigver). It is the only signaling server (signaling mechanism) which is supported by Netflux for now.

**TIP**: we recommend to deploy your own instance of Sigver for production.

### STUN server
**Default**: `stun:stun3.l.google.com:19302`

There many other free STUN servers available in the Web.

### TURN servers
No free TURN server available in the Web. Checkout [Xirsys](https://xirsys.com/) to rent one or deploy your own.

## How to deploy STUN/TURN servers

This guide present a basic configuration for [coturn](https://github.com/coturn/coturn).
It allow us to deploy our own STUN/TURN server in order to connect users behind a NAT or Firewall.

For more informations or options, see coturn [documentation](https://github.com/coturn/coturn/wiki/README).

On most Linux Distribution, the package is in the repo:
`apt-get install coturn`

You must have SQLite installed:
`sudo apt-get install sqlite3 libsqlite3-dev`

Config file can be found at:
`/etc/turnserver.conf`

Simple config file should look like this:
```bash
# you can listen ports 3478 and 5349 instead of 80/443
listening-port=80
tls-listening-port=443

listening-ip=your-ip-address

relay-ip=your-ip-address
external-ip=your-ip-address

realm=yourdomain.com
server-name=yourdomain.com

# webRTC authentication method
lt-cred-mech

# Database location
userdb=/var/lib/turn/turndb

# Add ssl certificate for your server
cert=/etc/ssl/certificate.pem
pkey=/etc/ssl/private.key

no-stdout-log
```

If you don't have any SSL certificate, you may use [Let's Encrypt](https://letsencrypt.org/).

Create a user in order to access your Turn server:
`turnadmin -a -u userName -p password -r yourdomain.com`

Launch your server:
`turnserver`
or in daemon:
`turnserver -o`

Verify that your server is up and running with [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/).

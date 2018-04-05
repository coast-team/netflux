# Installation

## NPM

```shell
npm install -S netflux
```

Netflux has an optional peer dependency: `wrtc`. This package provides WebRTC API in NodeJS, but for now it is not in use as more tests needed. Checkout [wrtc repository](https://github.com/js-platform/node-webrtc) for more info on it.

## What you need

Signaling server is the only mandatory server for Netflux, but for a fully functional peer to peer network which suits all use cases you also need STUN and TURN servers.

> Netflux comes with Signaling and STUN servers by default for easier quickstart.

### Signaling server

> **Default**: `wss://signaling.netflux.coedit.re`

The only signaling mechanism which is supported by Netflux for now is [Sigver](https://github.com/coast-team/sigver) (NodeJS WebSocket server developed by us).

> **TIP**: Your own instance of Sigver for production is recommended.

### STUN server

**Default**: `stun:stun3.l.google.com:19302`

There are many other free STUN servers available in the Web.

### TURN server

There are no free TURN servers available in the Web. Two solutions exist:

* Rent one. Checkout [Xirsys](https://xirsys.com/) for example.
* Deploy your own instance. The paragraphe below provides a guide on how to deploy and configure [`coturn`](https://github.com/coturn/coturn) open source TURN server. Also checkout [_Choosing a TURN server_](https://rtcquickstart.org/guide/multi/turn-server-choice.html) for a list of open source TURN servers.

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

listening-ip=YOUR_IP_ADDRESS
relay-ip=YOUR_IP_ADDRESS

realm=YOUR_DOMAIND.COM
server-name=OUR_DOMAIND.COM

fingerprint

# webRTC authentication method
lt-cred-mech

# WebRTC credentials
user=YOUR_USER_NAME:YOUR_PASSWORD

# Quota
total-quota=100
bps-capacity=0
stable-nonce

# Add ssl certificate for your server
cert=/etc/ssl/certificate.pem
pkey=/etc/ssl/private.key
cipher-list="ECDH+AESGCM:DH+AESGCM:ECDH+AES256:DH+AES256:ECDH+AES128:!DH+AES:!ECDH+3DES:!DH+3DES:!RSA+AES:!RSA+3DES:!ADH:!AECDH:!MD5"
no-loopback-peers
no-multicast-peers
no-stdout-log
```

If you don't have any SSL certificate, you may use [Let's Encrypt](https://letsencrypt.org/).

Launch server:

```turnserver`

or in daemon:

`turnserver -o`

Verify that the server is up and running with [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/).

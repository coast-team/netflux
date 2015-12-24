# Netflux

------
[![devDependency Status](https://david-dm.org/coast-team/netflux/dev-status.svg?style=flat-square)](https://david-dm.org/coast-team/netflux#info=devDependencies)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)
[![Build Status](https://travis-ci.org/coast-team/netflux.svg?branch=master)](https://travis-ci.org/coast-team/netflux)
[![Code Climate](https://codeclimate.com/github/coast-team/netflux/badges/gpa.svg)](https://codeclimate.com/github/coast-team/netflux)
[![Test Coverage](https://codeclimate.com/github/coast-team/netflux/badges/coverage.svg)](https://codeclimate.com/github/coast-team/netflux/coverage)

Abstract peer to peer client transport API. Implementations based on WebRTC and webSocket to be done.

## API specification (*warning*: very early state)

------
### Facade

- **create**(networkTopology: *json*): *Network*
   create a new peer to peer network which might be used to share data and new peer(s).

- **join**(net: *Network*)
   join an existing network via signaling server (the peer inviting you to the network must be online).
   join an existing network via tracking server (acts as signaling server and additionally stores network identifier and list of peers thus allow to join the network even if no other peers online).   

- **leave**(net : *Network*)
   leave an existing network

- **connect**(signalingServerURL: *string*): *Peer*
   establish a direct connection with another peer without creating or joining any network.

------
- **onPeerJoining**(peer: *Peer*, net: *Network*, ...)
   actions to do when a new peer is joining an existing network.

- **onPeerLeaving**(peer: *Peer*, net: *Network*, ...)
   actions to do when another peer is leaving an existing network.

------
- **onJoinRequest**(peer: *Peer*, ...)
   actions to do when a peer (connected to you directly of via a network) asks you to join one of his network.

- **sendJoinRequest**(peer: *Peer*, net: *Network*)
   send a join request to a peer connected to you directly of via a network.
   // peer.sendJoinRequest(net)

------
- **onMessage**(func(net: Network, ...))
   actions to do when a message arrives from a network.

- **send**(net: *Network*, peer: *Peer*, ...)

- **broadcast**(net: *Network*, ...)


### Network

- **send**(peer: *Peer*, ...)

- **broadcast**(...)

- **onMessage**(...)
   actions to do when a message arrives from the network.


### Peer

- **getId**(): *peerid*

- **send**(msg, ...)

- **onMessage**(callback)

- **sendJoinRequest**(net: Network)

- **disconnect**()

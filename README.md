# Netflux

Peer to peer client side transport API based on WebRTC.

## API specification (*warning*: very early state)

- **create**(networkTopology: *string*): *Network*
   create a new peer to peer network which might be used to share data and new peer(s).
- **join**(signallingServerURL: *string*): *Network*
   join an existing network via signalling server (the peer inviting you to the network must be online).
- **join**(trackingServerURL: *string*): *Network*
   join an existing network via tracking server (acts as signalling server and additionally stores network identifier and list of peers thus allow to join the network even if no other peers online).
- **connect**(singallingServerURL: *string*): *Peer*
   establish a connection with another peer without creating or joinning any network.

------
- **onPeerJoinning**(...)
   actions to do when a new peer is joinning an existing network.
- **onPeerLeaving**(...)
   actions to do when another peer is leaving an existing network.

------
- **onJoinRequest**(...)
   actions to do when a peer (connected to you directly of via a network) asks you to join one of his network.
- **sendJointRequest**(peer: *Peer*)
   send a join request to a peer connected to you directly of via a network.

------
- **onMessage**()
   actions to do when a message arrives from a network.

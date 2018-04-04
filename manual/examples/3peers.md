# Examples

Each of the clients in the following examples included `dist/netflux.es5.umd.min.js` script in his browser. Thus Netflux is available under global `netflux` variable.

## 3 browsers/clients

Peers **A**, **B** and **C** will constitute a peer to peer network. We suppose that all of them using the default Signaling server provided by Netflux.

**A** creates the network:

```javascript
// Creates network with default settings
let network = netflux.create()

// When a message  has arrived from the network
network.onMessage = (peerId, msg) => {
  // do something...
}

// When a new peer has joined the network
network.onPeerJoin = (peerId) => {
  // do something...
}

// When one of the network members has left
network.onPeerLeave = (peerId) => {
  // do something...
}

// Allows other peers to join this network
network.open().then(({ key }) => {
  // Other peers can now join this network
})
```

**A** gives **B** the `key`. **B** joins the network:

```javascript
// Creates network with default settings
let network = netflux.create()

network.onMessage = (peerId, msg) => {
  /* do something... */
}

network.onPeerJoin = (peerId) => {
  /* do something... */
}

network.onPeerLeave = (peerId) => {
  /* do something... */
}

// Joins the network with the key provided by A
network.join(key).then(() => {
  /*
      B has joined successfully.
      From now onPeerJoin handler will be called in A's browser and
      onPeerJoin handler will be called in B's browser too
      (because of A who is already the network member).
    */
})
```

**A** or **B** gives **C** the `key`. **C** joins the network, then he sends one message to all member and one private message to **B**:

```javascript
// Creates network with default settings
let network = netflux.create()

network.onMessage = (peerId, msg) => {
  /* do something... */
}

network.onPeerJoin = (peerId) => {
  /* do something... */
}

network.onPeerLeave = (peerId) => {
  /* do something... */
}

// Joins the network with the key provided by A
network.join(key).then(() => {
  /*
      C has joined successfully.
      From now onPeerJoin handler will be called in A's browser once, in B's
      browser once and in C's browser twice (because of A and B).
    */

  // C sends a message to all network members
  network.send('Hello everyone! It is C.')

  // C sends a private message to B
  network.sendTo(idOfB, 'Pss, B, you know, A cannot hear us!')
})
```

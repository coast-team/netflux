# FAQ

## How Netflux chooses between `RTCDataChannel` and `WebSocket`

Netflux operates with `RTCDataChannel` (WebRTC) and `WebSocket` connection technologies.

Technically `RTCDataChannel` may be established between:

* Browser and Browser.
* Browser and Server.
* Server and Server.

On the other hand, a `WebSocket` may be created only between:

* Browser and Server.
* Server and Server.

But in practice:

* All modern browsers support `WebSocket` (Chrome, Firefox, Edge, Safary etc.), but only some of them support `RTCDataChannel` (Chrome, Firefox, Safari soon and Edge one day maybe).
* Servers may or may not listen on `WebSocket` or connect over `WebSocket` and may or may not support `RTCDataChannel`.

This technical diversity pushes us to try all possibilities in order to create a connection between two peers based on their capabilities.

Between two peers, there is always one who initiates the connection, while the other is in a passive state. Lets say peer _A_ wants to connect to peer _B_ (i.e. _A_ is the initiator).

The following algorithm is the same for _A_ and _B_ and is executed each time a `message` is received. It runs through all possiblities in order to establish a connection between these peers (i.e. `return SUCCESS` to _A_ if the connection succeed and `return FAILED` to _A_ if the connection failed). It is important that the initiator peer (i.e. A) must be notified about the algorithm's result, while for the second peer (who is in the passive state) this information has no importance.

`message` variable below persistes the state of the actions for both peers. It is updated by both and is exchanged between them.

```pseudocode
// I received a `message` from another peer

if iCanConnectOnWebSocket(message)
  if connection succeed
    return SUCCESS
  else
    update(message)

if anotherPeerCanConnectOnWebSocket(message)
  send(message)
  return

if iCanConnectOnRTCDataChannel(message)
  if connection succeed
    return SUCCESS
  else
    update(message)

if anotherPeerCanConnectOnRTCDataChannel(message)
  send(message)
  return

if iAmTheInitiator(message)
  return FAILED
else
  send(message)
```

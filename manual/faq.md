# FAQ

## How Netflux chooses between `RTCDataChannel` and `WebSocket`

Netflux operates with `RTCDataChannel` (WebRTC) and `WebSocket` connection technologies.

Technically `RTCDataChannel` may be established between:

- Browser and Browser.
- Browser and Server.
- Server and Server.

On the other hand, a `WebSocket` may be created only between:

- Browser and Server.
- Server and Server.

But in practice:

- All modern browsers support `WebSocket` (Chrome, Firefox, Edge, Safary etc.), but only some of them support `RTCDataChannel` (Chrome, Firefox, Safari soon and Edge one day maybe).
- Servers may or may not listen on `WebSocket` or connect over `WebSocket` and may or may not support `RTCDataChannel`.

This technical diversity pushes us to try all possibilities in order to create a connection between two peers based on their capabilities.

Between two peers, there is always one who initiates the connection, while the other is in a passive state. Lets say peer _A_ wants to connect to peer _B_ (i.e. _A_ is the initiator).

The following algorithm is the same for _A_ and _B_ and is executed each time a `message` is received. It runs through all possiblities in order to establish a connection between these peers (i.e. `return SUCCESS` if the connection succeed and `return FAILED` otherwise). It is important that the initiator peer (i.e. A) must be notified about the algorithm's result, while for the second peer (who is in the passive state) this information has no importance.

`message` variable below persistes the state of the actions for both peers. It is updated by both and is exchanged between them.

```pseudocode
// Pseudocode:
// I received a `message` from another peer

if anotherPeerIsListeningOnWebSocketAndIHaveNotTriedToConnectYet(message)
  if WebSocket connection succeed
    return SUCCESS
  else
    update(message)

if iAmListeningOnWebSocketAndAnotherPeerHasNotTriedToConnectYet(message)
  send(message)
  return

if bothPeersSupportRTCDataChannel(message)
  if iHaveNotTriedToConnectYet(message)
    if RTCDataChannel connection succeed
      return SUCCESS
    else
      update(message)
  if anotherPeerHasNotTriedToConnectYet(message)
    send(message)
    return

if iAmTheInitiator(message)
  return FAILED
else
  send(message)
```

## State description

This section describes what trigger the `WebChannel` (i.e. `WebGroup`) state to change.

Possible values for `WebChannel`, `Signaling` and `Topology` states are:

| WebChannel | description                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JOINING`  | You are about to join the group.                                                                                                                   |
| `JOINED`   | You have successfully joined the group.                                                                                                            |  |
| `LEFT`     | You have successfully left the group or couldn't join. This is also the initial value (i.e. after `new WebChannel()` and before calling `join()`). |

| Signaling state | description                                                                                                                                                                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONNECTING`    | The connection with Signaling server is not yet open (equivalent to `WebSocket.CONNECTING`).                                                                                                                                                                                                          |
| `OPEN`          | The connection with Signaling server is open (equivalent to `WebSocket.OPEN`).                                                                                                                                                                                                                        |
| `CHECKING`      | Signaling server is about to vefiry that you are connected to at least one group member. If so, then the state becomes `CHECKED` and nothing to do, otherwise it prompt you to connect to the group member. After that the state becomes `CHECKED` and the `TopologyService` should rejoin the group. |
| `CHECKED`       | You are connected to at least one group member or you are the only group member.                                                                                                                                                                                                                      |  |
| `CLOSED`        | The connection with Signaling server is closed or couldn't be opened (equivalent to `WebSocket.CLOSED`).                                                                                                                                                                                              |

| Topology state | description                                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CONSTRUCTING` | Thanks to the Signaling server you are connected to one of the group member. From now the topology service is about to create the rest of connections, if necessary, in order to keep the topology structure and assure messages delivery. |
| `CONSTRUCTED`  | The topology is considerated as constructed.                                                                                                                                                                                               |
| `IDLE`         | All connections with group members were closed or topology failed to construct the peer to peer network.                                                                                                                                   |

### Events

#### Member left event

| Singaling | Topology    | adjacent member | not only you left in the group | Result          |
| --------- | ----------- | --------------- | ------------------------------ | --------------- |
| CHECKED   | CONSTRUCTED | true            | true                           | $signalingCheck |

#### Signaling state event

| Singaling | Topology      | connected | rejoinEnabled | Result               |
| --------- | ------------- | --------- | ------------- | -------------------- |
| CLOSED    | IDLE          |           | true          | $rejoin              |
| CLOSED    | IDLE          |           | false         | $leave               |
| CLOSED    | CONSTRUCTED   |           | true          | $connectToSignaling  |
| OPEN      | !CONSTRUCTING |           |               | $signalingCheck      |
| CHECKED   | IDLE          | true      |               | Topology.CONSTRUCTED |
| CHECKED   | CONSTRUCTED   |           |               | WebChannel.JOINED    |

#### Topology state event

| Topology     | Singaling  | rejoinEnabled | Result                               |
| ------------ | ---------- | ------------- | ------------------------------------ |
| CONSTRUCTING |            |               | WebChannel.JOINING                   |
| CONSTRUCTED  | OPEN       |               | $signalingCheck                      |
| CONSTRUCTED  | CHECKED    |               | WebChannel.JOINED & $signalingCheck  |
| CONSTRUCTED  | CLOSED     |               | $connectToSignaling                  |
| IDLE         | CLOSED     | true          | $rejoin                              |
| IDLE         | CLOSED     | false         | $leave                               |
| IDLE         | CONNECTING |               | WebChannel.JOINING                   |
| IDLE         | OPEN       |               | WebChannel.JOINING & $signalingCheck |
| IDLE         | CHECKING   |               | WebChannel.JOINING                   |
| IDLE         | CHECKED    |               | $signalingCheck                      |

#### Join method call

| WebChannel | onLine | Visibility | Result |
| ---------- | ------ | ---------- | ------ |
| LEFT       | true   | visible    | $join  |

#### Leave method call

| WebChannel | Result |
| ---------- | ------ |
| !LEFT      | $leave |

#### onLine() event (online/offline events, navigator.onLine)

| WebChannel | Visibility | rejoinEnabled | Result           |
| ---------- | ---------- | ------------- | ---------------- |
| LEFT       | visible    | true          | $leave.1 & $join |

#### isVisible() event (Page Visibility API)

| WebChannel | onLine | rejoinEnabled | Result           |
| ---------- | ------ | ------------- | ---------------- |
| LEFT       | true   | true          | $leave.1 & $join |

> $join -> consists of three steps:

1.  Initialize WebChannel properties (ids, members etc.), then
2.  Set WebChannel state to JOINING and finally
3.  Connect to Signaling server

> $leave -> consists of two steps

1.  Clean WebChannel properties (ids, members, clean servicies) as if we were doing `new WebChannel()`, then
2.  Set WebChannel state to LEFT

> $rejoin -> consists of executing the following algorithm:

```pseudocode
  Execute $leave.1
    Execute $join.1
    Execute $join.2
    setTimeout
      if (WebChannel.LEFT && visible && onLine && rejoinEnabled) then
        $connectToSignaling
```

> $connectToSignaling -> the third step of the $join process
>
> $signalingCheck -> check with Signaling if still connected with the rest of the group

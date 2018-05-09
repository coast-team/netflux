# WebChannel

This section describes what trigger the `WebChannel` (i.e. `WebGroup`) state to change.

## States description

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

| Topology state | description                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JOINING`      | Thanks to the Signaling server you are connected to one of the group memberf. From now the topology service is about to create the rest of connections, if necessary, in order to keep the topology structure and assure messages delivery. |
| `JOINED`       | The topology is considerated as constructed.                                                                                                                                                                                                |
| `LEFT`         | All connections with group members were closed or topology failed to construct the peer to peer network.                                                                                                                                    |

## Events

### Signaling state event

| Singaling | WebChannel | Topology | connected | rejoinEnabled | Result              |
| --------- | ---------- | -------- | --------- | ------------- | ------------------- |
| CLOSED    |            | LEFT     |           |               | $rejoinOrLeave      |
| CLOSED    |            | JOINED   |           | true          | $connectToSignaling |
| OPEN      |            | !JOINING |           |               | $signalingCheck     |
| CHECKED   | JOINING    | LEFT     | true      |               | Topology.JOINED     |

### Topology state event

| Topology | Singaling  | Result                               |
| -------- | ---------- | ------------------------------------ |
| JOINING  |            | WebChannel.JOINING                   |
| JOINING  | CLOSED     | $connectToSignaling                  |
| JOINED   |            | WebChannel.JOINED                    |
| JOINED   | OPEN       | WebChannel.JOINED & $signalingCheck  |
| JOINED   | CHECKED    | WebChannel.JOINED & $signalingCheck  |
| LEFT     | CLOSED     | $rejoinOrLeave                       |
| LEFT     | CONNECTING | WebChannel.JOINING                   |
| LEFT     | OPEN       | WebChannel.JOINING & $signalingCheck |
| LEFT     | CHECKING   | WebChannel.JOINING                   |
| LEFT     | CHECKED    | $signalingCheck                      |

Otherwiser $leave

### Join method call

| WebChannel | onLine | Visibility | Result |
| ---------- | ------ | ---------- | ------ |
| LEFT       | true   | visible    | $join  |

### Leave method call

| WebChannel | Result |
| ---------- | ------ |
| !LEFT      | $leave |

### Member left event

| Singaling | Topology | adjacent member | not only you left in the group | Result          |
| --------- | -------- | --------------- | ------------------------------ | --------------- |
| CHECKED   | JOINED   | true            | true                           | $signalingCheck |

### onLine() event (online/offline events, navigator.onLine)

| WebChannel | Visibility | rejoinTimer | rejoinEnabled | Result |
| ---------- | ---------- | ----------- | ------------- | ------ |
| LEFT       | visible    | undefined   | true          | $join  |

### isVisible() event (Page Visibility API)

| WebChannel | onLine | rejoinTimer | rejoinEnabled | Result |
| ---------- | ------ | ----------- | ------------- | ------ |
| LEFT       | true   | undefined   | true          | $join  |

> $join -> consists of three steps:

1.  Initialize WebChannel properties (ids, members etc.), then
2.  Set WebChannel state to JOINING and finally
3.  Connect to Signaling server to start joining process

> $leave -> consists of two steps

1.  Clean WebChannel properties (ids, members, clean servicies) as if we were doing `new WebChannel()`, then
2.  Set WebChannel state to LEFT

> $rejoinOrLeave -> consists of executing the following algorithm:

```pseudocode
  Execute $leave.1
  if (rejoinEnabled) then
    Execute $join.1
    Execute $join.2
    setTimeout
      if (WebChannel.LEFT && visible && onLine && rejoinEnabled) then
        $connectToSignaling
  else
    $leave.2
```

> $connectToSignaling -> the third step of the $join process
>
> $signalingCheck -> check with Signaling if still connected with the rest of the group

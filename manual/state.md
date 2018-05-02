# WebChannel

This section describes what trigger the `WebChannel` (i.e. `WebGroup`) state to change.

## States description

Possible values for `WebChannel`, `Signaling` and `Topology` states are:

| WebChannel | description                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JOINING`  | You are about to join the group.                                                                                                                   |
| `JOINED`   | You have successfully joined the group.                                                                                                            |
| `LEAVING`  | You are about to leave the group.                                                                                                                  |
| `LEFT`     | You have successfully left the group or couldn't join. This is also the initial value (i.e. after `new WebChannel()` and before calling `join()`). |

| Signaling state | description                                                                                                                                                                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONNECTING`    | The connection with Signaling server is not yet open (equivalent to `WebSocket.CONNECTING`).                                                                                                                                                                                                          |
| `CHECKING`      | Signaling server is about to vefiry that you are connected to at least one group member. If so, then the state becomes `CHECKED` and nothing to do, otherwise it prompt you to connect to the group member. After that the state becomes `CHECKED` and the `TopologyService` should rejoin the group. |
| `CHECKED`       | You are connected to at least one group member or you are the only group member.                                                                                                                                                                                                                      |
| `CLOSING`       | The connection with Signaling server is in the process of closing (equivalent to `WebSocket.CLOSING`).                                                                                                                                                                                                |
| `CLOSED`        | The connection with Signaling server is closed or couldn't be opened (equivalent to `WebSocket.CLOSED`).                                                                                                                                                                                              |

| Topology state  | description                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JOINING`       | Thanks to the Signaling server you are connected to one of the group memberf. From now the topology service is about to create the rest of connections, if necessary, in order to keep the topology structure and assure messages delivery. |
| `JOINED`        | The topology is considerated as constructed.                                                                                                                                                                                                |
| `DISCONNECTING` | Topology is about to close connections with all group members.                                                                                                                                                                              |
| `DISCONNECTED`  | All connections with group members were closed or topology failed to construct the peer to peer network.                                                                                                                                    |

## Events

> joined = WebChannel.JOINED & clearRejoinTimer() & unsetRejoinTimer()

### Signaling state event

| Singaling state | WebChannel state | Topology state | connected | Result               |
| --------------- | ---------------- | -------------- | --------- | -------------------- |
| CLOSED          |                  | DISCONNECTED   |           | triggerLEFTevent()   |
| CLOSED          | !LEAVING         |                |           | connectToSignaling() |
| OPEN            |                  | DISCONNECTED   |           | check()              |
| OPEN            |                  | JOINED         |           | check()              |
| CHECKED         | JOINING          | DISCONNECTED   | true      | joined               |

### Topology state event

| Topology state | Singaling state | Result             |
| -------------- | --------------- | ------------------ |
| JOINING        |                 | WebChannel.JOINING |
| JOINED         |                 | joined             |
| JOINED         | OPEN            | joined & check()   |
| JOINED         | CHECKED         | joined & check()   |
| DISCONNECTED   | CLOSED          | triggerLEFTevent() |

### Member left event

| Singaling state | Topology state | Result  |
| --------------- | -------------- | ------- |
| CHECKED         | JOINED         | check() |

### Join request

| WebChannel | onLine | Visibility | Result                         |
| ---------- | ------ | ---------- | ------------------------------ |
| LEAVING    |        |            | setPendingRequest()            |
| LEFT       |        | hidden     | setPendingRequest()            |
| LEFT       | false  |            | setPendingRequest()            |
| LEFT       | true   | visible    | WebChannel.JOINING & connect() |

### Leave request

| WebChannel | Result                       |
| ---------- | ---------------------------- |
| JOINING    | WebChannel.LEAVING & leave() |
| JOINED     | WebChannel.LEAVING & leave() |

> joining = WebChannel.JOINING & connect() & setRejoinTimer() & unsetPendingRequest()

### onLine event

| WebChannel | Visibility | rejoinTimer | isPendingRequest | autoRejoin | Result  |
| ---------- | ---------- | ----------- | ---------------- | ---------- | ------- |
| LEFT       | visible    | undefined   | true             |            | joining |
| LEFT       | visible    | undefined   | false            | true       | joining |

### isVisible event

| WebChannel | onLine | rejoinTimer | isPendingRequest | autoRejoin | Result  |
| ---------- | ------ | ----------- | ---------------- | ---------- | ------- |
| LEFT       | true   | undefined   | true             |            | joining |
| LEFT       | true   | undefined   | false            | true       | joining |

### LEFT event

| Visibility | onLine | isPendingRequest | autoRejoin | rejoinTimer | Result  |
| ---------- | ------ | ---------------- | ---------- | ----------- | ------- |
| visible    | true   | true             |            | undefined   | joining |
| visible    | true   | false            | true       | undefined   | joining |

If none of them, then Result: WebChannel.LEFT

### Rejoin timer event

| WebChannel | Visibility | onLine | autoRejoin | Result             |
| ---------- | ---------- | ------ | ---------- | ------------------ |
| LEFT       | visible    | true   | true       | joining            |
|            |            |        |            | unsetRejoinTimer() |

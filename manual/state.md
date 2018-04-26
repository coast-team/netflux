# WebChannel state

This section describes what trigger the `WebChannel` (i.e. `WebGroup`) state to change.

## States description

Possible values for `WebChannel`, `Signaling` and `Topology` states are:

| WebChannel state | description                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JOINING`        | You are about to join the group.                                                                                                                   |
| `JOINED`         | You have successfully joined the group.                                                                                                            |
| `LEAVING`        | You are about to leave the group.                                                                                                                  |
| `LEFT`           | You have successfully left the group or couldn't join. This is also the initial value (i.e. after `new WebChannel()` and before calling `join()`). |

| Signaling state | description                                                                                                                                                                                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONNECTING`    | The connection with Signaling server is not yet open (equivalent to `WebSocket.CONNECTING`).                                                                                                                                                                                                              |
| `CHECKING`      | Signaling server is about to vefiry that you are connected to at least one group member. If so, then the state becomes `CONNECTED` and nothing to do, otherwise it prompt you to connect to the group member. After that the state becomes `CONNECTED` and the `TopologyService` should rejoin the group. |
| `CONNECTED`     | You are connected to at least one group member or you are the only group member.                                                                                                                                                                                                                          |
| `CLOSING`       | The connection with Signaling server is in the process of closing (equivalent to `WebSocket.CLOSING`).                                                                                                                                                                                                    |
| `CLOSED`        | The connection with Signaling server is closed or couldn't be opened (equivalent to `WebSocket.CLOSED`).                                                                                                                                                                                                  |

| Topology state  | description                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONSTRUCTING`  | Thanks to the Signaling server you are connected to one of the group memberf. From now the topology service is about to create the rest of connections, if necessary, in order to keep the topology structure and assure messages delivery. |
| `CONSTRUCTED`   | The topology is considerated as constructed.                                                                                                                                                                                                |
| `DISCONNECTING` | Topology is about to close connections with all group members.                                                                                                                                                                              |
| `DISCONNECTED`  | All connections with group members were closed or topology failed to construct the peer to peer network.                                                                                                                                    |

## Events

### Signaling state event

| Singaling state | Topology state | Result               |
| --------------- | -------------- | -------------------- |
| CLOSED          | DISCONNECTED   | WebChannel.LEFT      |
| CLOSED          | CONSTRUCTING   | connectToSignaling() |
| CLOSED          | CONSTRUCTED    | connectToSignaling() |
| OPEN            | DISCONNECTED   | check()              |
| OPEN            | CONSTRUCTED    | check()              |

### Topology state event

| Topology state | Singaling state | Result                      |
| -------------- | --------------- | --------------------------- |
| CONSTRUCTING   | ANY             | WebChannel.JOINING          |
| CONSTRUCTED    | ANY             | WebChannel.JOINED           |
| CONSTRUCTED    | OPEN            | WebChannel.JOINED & check() |
| CONSTRUCTED    | CONNECTED       | WebChannel.JOINED & check() |
| DISCONNECTED   | CLOSED          | WebChannel.LEFT             |

### Member left event

| Singaling state | Topology state | Result  |
| --------------- | -------------- | ------- |
| CONNECTED       | CONSTRUCTED    | check() |

### Join request

| WebChannel state | onLine | Visibility | Result                                      |
| ---------------- | ------ | ---------- | ------------------------------------------- |
| LEAVING          | ANY    | ANY        | setPendingRequest()                         |
| LEFT             | true   | hidden     | setPendingRequest()                         |
| LEFT             | false  | ANY        | setPendingRequest()                         |
| LEFT             | true   | visible    | WebChannel.JOINING & connectToSignaling()() |

### Leave request

| WebChannel state | Result                       |
| ---------------- | ---------------------------- |
| JOINING          | WebChannel.LEAVING & leave() |
| JOINED           | WebChannel.LEAVING & leave() |

### onLine event

| WebChannel state | Visibility | isPendingRequest | autoRejoin | Result                                      |
| ---------------- | ---------- | ---------------- | ---------- | ------------------------------------------- |
| LEFT             | visible    | true             | ANY        | WebChannel.JOINING & connectToSignaling()() |
| LEFT             | visible    | false            | true       | WebChannel.JOINING & connectToSignaling()() |

### isVisible event

| WebChannel state | onLine | isPendingRequest | autoRejoin | Result                                      |
| ---------------- | ------ | ---------------- | ---------- | ------------------------------------------- |
| LEFT             | true   | true             | ANY        | WebChannel.JOINING & connectToSignaling()() |
| LEFT             | true   | false            | true       | WebChannel.JOINING & connectToSignaling()() |

### WebChannel LEFT event

| Visibility value | onLine | isPendingRequest | autoRejoin | Result                                      |
| ---------------- | ------ | ---------------- | ---------- | ------------------------------------------- |
| visible          | true   | true             | ANY        | WebChannel.JOINING & connectToSignaling()() |
| visible          | true   | false            | true       | WebChannel.JOINING & connectToSignaling()() |

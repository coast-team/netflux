Netflux can create a peer to peer network with the following connection types:
 - `RTCDataChannel` (WebRTC)
 - `WebSocket`

`RTCDataChannel` connection could be established between:
 - Browser & Browser
 - Brower & Server (If server supports)
 - Server & Server (If both servers support)

On the other hand, a `socket` could be created only between:
 - Browser & Server
 - Server & Server

declare var global: any

/**
 * WebRTC missing declarations
 */
interface RTCPeerConnection {
  iceCandidateState: RTCIceConnectionState
  ondatachannel: (event: RTCDataChannelEvent) => void
  createDataChannel (label: string): RTCDataChannel
}

interface RTCDataChannelEvent {
  readonly channel: RTCDataChannel
}

interface RTCDataChannel extends EventTarget {
  label: string
  reliable: boolean
  readyState: string
  bufferedAmount: number
  binaryType: string
  onopen: (event: Event) => void
  onerror: (event: Event) => void
  onclose: (event: Event) => void
  onmessage: (event: Event) => void
  close (): void
  send (data: string)
  send (data: ArrayBuffer)
  send (data: Blob)
}

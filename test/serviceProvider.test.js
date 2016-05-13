import provide, {FULLY_CONNECTED, WEBRTC, MESSAGE_FORMATTER} from '../src/serviceProvider'

it('serviceProvider -> service constant names should be exported', () => {
  expect(WEBRTC).toBeDefined()
  expect(FULLY_CONNECTED).toBeDefined()
})

it('serviceProvider -> should provide a service', () => {
  expect(provide(WEBRTC).name).toEqual('WebRTCService')
  expect(provide(FULLY_CONNECTED).name).toEqual('FullyConnectedService')
})

it('serviceProvider -> FullyConnectedService should be a singleton', () => {
  let fullyConnected1 = provide(FULLY_CONNECTED)
  let fullyConnected2 = provide(FULLY_CONNECTED)
  expect(fullyConnected1 == fullyConnected2).toBeTruthy()
})

it('serviceProvider -> WebRTCService should NOT be a singleton', () => {
  expect(provide(WEBRTC) == provide(WEBRTC)).toBeFalsy()
})

it('serviceProvider -> should return null', () => {
  expect(provide('unexisted service name')).toBeNull()
})

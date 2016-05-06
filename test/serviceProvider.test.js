import * as sp from '../src/serviceProvider'

it('serviceProvider -> service constant names should be exported', () => {
  expect(sp.WEBRTC).toBeDefined()
  expect(sp.FULLY_CONNECTED).toBeDefined()
})

it('serviceProvider -> should provide a service', () => {
  let webRTC = sp.get(sp.WEBRTC)
  let fullyConnected = sp.get(sp.FULLY_CONNECTED)
  expect(webRTC.name).toEqual('WebRTCService')
  expect(fullyConnected.name).toEqual('FullyConnectedService')
})

it('serviceProvider -> FullyConnectedService should be a singleton', () => {
  let fullyConnected1 = sp.get(sp.FULLY_CONNECTED)
  let fullyConnected2 = sp.get(sp.FULLY_CONNECTED)
  expect(fullyConnected1 == fullyConnected2).toBeTruthy()
})

it('serviceProvider -> WebRTCService should NOT be a singleton', () => {
  let webRTC1 = sp.get(sp.WEBRTC)
  let webRTC2 = sp.get(sp.WEBRTC)
  expect(webRTC1 == webRTC2).toBeFalsy()
})

it('serviceProvider -> should return null', () => {
  expect(sp.get('unexisted service name')).toBeNull()
})

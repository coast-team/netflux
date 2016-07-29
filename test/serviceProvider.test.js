import {provide, CHANNEL_BUILDER, FULLY_CONNECTED, MESSAGE_BUILDER, WEBRTC, WEBSOCKET} from 'src/serviceProvider'

describe('Service Provider', () => {

  it('Should provide a service', () => {
    expect(provide(WEBRTC).name).toEqual('WebRTCService')
    expect(provide(FULLY_CONNECTED).name).toEqual('FullyConnectedService')
    expect(provide(WEBSOCKET).name).toEqual('WebSocketService')
    expect(provide(MESSAGE_BUILDER).name).toEqual('MessageBuilderService')
    expect(provide(CHANNEL_BUILDER).name).toEqual('ChannelBuilderService')
  })

  it('Should be a singleton', () => {
    expect(provide(FULLY_CONNECTED)).toBe(provide(FULLY_CONNECTED))
    expect(provide(MESSAGE_BUILDER)).toBe(provide(MESSAGE_BUILDER))
  })

  it('Should NOT be a singleton', () => {
    expect(provide(WEBRTC)).not.toBe(provide(WEBRTC))
    expect(provide(WEBSOCKET)).not.toBe(provide(WEBSOCKET))
    expect(provide(CHANNEL_BUILDER)).not.toBe(provide(CHANNEL_BUILDER))
  })

  it('Should throw an exception', () => {
    expect(() => provide('Inexistent service name')).toThrow()
  })
})

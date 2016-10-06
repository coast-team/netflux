// import {provide, CHANNEL_BUILDER, FULLY_CONNECTED, MESSAGE_BUILDER, WEB_RTC, WEB_SOCKET} from 'src/serviceProvider'
//
// describe('Service Provider', () => {
//   it('Should provide a service', () => {
//     expect(provide(WEB_RTC).id).toEqual(WEB_RTC)
//     expect(provide(FULLY_CONNECTED).id).toEqual(FULLY_CONNECTED)
//     expect(provide(WEB_SOCKET).id).toEqual(WEB_SOCKET)
//     expect(provide(MESSAGE_BUILDER).id).toEqual(MESSAGE_BUILDER)
//     expect(provide(CHANNEL_BUILDER).id).toEqual(CHANNEL_BUILDER)
//   })
//
//   it('Should be a singleton', () => {
//     expect(provide(FULLY_CONNECTED)).toBe(provide(FULLY_CONNECTED))
//     expect(provide(MESSAGE_BUILDER)).toBe(provide(MESSAGE_BUILDER))
//   })
//
//   it('Should NOT be a singleton', () => {
//     expect(provide(WEB_RTC)).not.toBe(provide(WEB_RTC))
//     expect(provide(WEB_SOCKET)).not.toBe(provide(WEB_SOCKET))
//     expect(provide(CHANNEL_BUILDER)).not.toBe(provide(CHANNEL_BUILDER))
//   })
//
//   it('Should throw an exception', () => {
//     expect(() => provide('Inexistent service id')).toThrow()
//   })
// })

import { WebRTCService } from '../src/webRTCService.js'

describe('webRTCService', () => {
  const webRTCService = new WebRTCService()

  describe('_randomString', () => {
    it('Two random strings should be different', () => {
      const TEST_COUNTER = 10
      webRTCService.connect()
      for (let i = 0; i < TEST_COUNTER; i++) {
        const str1 = webRTCService._randomString()
        const str2 = webRTCService._randomString()
        expect(str1).not.toBe(str2)
      }
    })
  })
})

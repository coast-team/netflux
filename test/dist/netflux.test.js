let nf = require('../../dist/netflux.es2015')

describe('Browser (global variable)', () => {
  it('nf must be defined as a global variable', () => {
    expect(nf).toBeDefined()
  })
  it('WebChannel must be defined', () => {
    expect(nf.WebChannel).toBeDefined()
  })
  it('service name constants must be defined', () => {
    expect(nf.WEBRTC).toBeDefined()
    expect(nf.FULLY_CONNECTED).toBeDefined()
  })
})

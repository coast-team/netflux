xdescribe('Browser (global variable)', () => {
  it('netflux must be defined as a global variable', () => {
    expect(window.netflux).toBeDefined()
  })
  it('WebChannel must be defined', () => {
    expect(netflux.WebChannel).toBeDefined()
  })
  it('service name constants must be defined', () => {
    expect(netflux.WEBRTC).toBeDefined()
    expect(netflux.FULLY_CONNECTED).toBeDefined()
  })
})

xdescribe('Distribution for', () => {
  describe('NodeJS (CommonJS) ->', () => {
    var nfNode = require('../../dist/netflux.es2015')
    it('nfNode must be defined', () => {
      expect(nfNode).toBeDefined()
    })
    it('create must be defined', () => {
      expect(nfNode.create).toBeDefined()
    })
    it('join must be defined', () => {
      expect(nfNode.join).toBeDefined()
    })
    it('service name constants must be defined', () => {
      expect(nfNode.WEBRTC_SERVICE).toBeDefined()
      expect(nfNode.FULLYCONNECTED_SERVICE).toBeDefined()
    })
  })
  describe('Browser (global variable)', () => {
    it('nf must be defined as a global variable', () => {
      expect(nf).toBeDefined()
    })
    it('create must be defined', () => {
      expect(nf.create).toBeDefined()
    })
    it('join must be defined', () => {
      expect(nf.join).toBeDefined()
    })
    it('service name constants must be defined', () => {
      expect(nf.WEBRTC_SERVICE).toBeDefined()
      expect(nf.FULLYCONNECTED_SERVICE).toBeDefined()
    })
  })
})

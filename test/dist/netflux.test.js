describe('Distribution for', () => {
  describe('Node (CommonJS)', () => {
    var nfNode = require('../../dist/netflux')

    it('nfNode must be defined', () => {
      expect(nfNode).toBeDefined()
    })
    it('nfNode.join must be defined', () => {
      expect(nfNode.join).toBeDefined()
    })
  })
  describe('Browser (global variable)', () => {
    it('nf must be defined as a global variable', () => {
      expect(window.nf).toBeDefined()
      expect(nf).toBeDefined()
    })
    it('nf.join must be defined', () => {
      expect(window.nf.join).toBeDefined()
      expect(nf.join).toBeDefined()
    })
  })
})

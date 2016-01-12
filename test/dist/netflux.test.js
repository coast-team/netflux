var nfNode = require('../../dist/netflux.js')

describe('Distribution for', () => {
  describe('Node (CommonJS)', () => {
    it('nfNode must be defined', () => {
      expect(nfNode).toBeDefined()
    })
    it('nfNode.create must be defined', () => {
      expect(nfNode.create).toBeDefined()
    })
  })
  describe('Browser (global variable)', () => {
    it('nf must be defined as a global variable', () => {
      expect(window.nf).toBeDefined()
      expect(nf).toBeDefined()
    })
    it('nf.create must be defined', () => {
      expect(window.nf.create).toBeDefined()
      expect(nf.create).toBeDefined()
    })
  })
})

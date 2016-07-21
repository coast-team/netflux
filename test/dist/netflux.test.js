import {WebChannel, Bot} from '../../dist/netflux.es2015'
import {isBrowser} from '../../src/helper.js'

describe('Distributions-> ', () => {
  it('API must exports defined objects', () => {
    expect(WebChannel).toBeDefined()
    expect(Bot).toBeDefined()
  })
  if (isBrowser()) {
    it('netflux must be defined as a global variable', () => {
      expect(netflux).toBeDefined()
      expect(netflux.WebChannel).toBeDefined()
      expect(netflux.Bot).toBeDefined()
    })
  } else {
    it('netflux must be defined as a global variable', () => {
      let netflux = require('../../../dist/netflux.es2015.umd.js')
      expect(netflux).toBeDefined()
      expect(netflux.WebChannel).toBeDefined()
      expect(netflux.Bot).toBeDefined()
    })
  }
})

import { Peer } from '../src/peer.js'

describe('peer', () => {
  it('peer constructor', () => {
    const p = new Peer('12345', 'myConnector')
    p.send()
    p.onMessage()
    p.disconnect()
    expect(p).not.toBe(null)
    expect(p).not.toBeUndefined()
  })
})

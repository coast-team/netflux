import {isBrowser} from 'src/helper'
import {Bot} from 'src/Bot'

describe('Bot instanciation -> ', () => {
  it('in browser should throw an exception ', () => {
    if (isBrowser()) expect(Bot).toThrow()
    else expect(Bot).not.toThrow()
  })
})

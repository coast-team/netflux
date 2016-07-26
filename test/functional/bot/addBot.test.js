import {isBrowser} from 'src/helper'
import Bot from 'src/Bot'

describe('Bot instanciation -> ', () => {
  it('in browser should throw an exception ', () => {
    let constr = () => new Bot()
    if (isBrowser()) expect(constr).toThrow()
    else expect(constr).not.toThrow()
  })
})

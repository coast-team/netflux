import * as service from '../../src/service/service'

it('Service name should be its constructor name', () => {
  class MyService extends service.Interface { constructor () { super() }}
  let obj = new MyService()
  console.log()
  expect(obj.name).toEqual('MyService')
})

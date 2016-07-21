import {ServiceInterface} from 'src/service/service'

it('Service name should be its constructor name', () => {
  class MyService extends ServiceInterface { constructor () { super() }}
  let obj = new MyService()
  console.log()
  expect(obj.name).toEqual('MyService')
})

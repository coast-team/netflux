import ServiceInterface from 'src/service/ServiceInterface'

it('Service name should be its constructor name', () => {
  class MyService extends ServiceInterface { constructor () {super()}}
  expect(new MyService().name).toEqual('MyService')
})

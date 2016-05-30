import {ChannelBuilderInterface} from '../../../src/service/channelBuilder/channelBuilder'

it('All unimplemented methods of channelBuilder.Interface should throw an Exception', () => {
  class MyService extends ChannelBuilderInterface {}
  let obj = new MyService()
  expect(obj.open).toThrow()
  expect(obj.join).toThrow()
  expect(obj.connectMeTo).toThrow()
})

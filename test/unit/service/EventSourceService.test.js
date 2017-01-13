import EventSourceService from 'src/service/EventSourceService'
import * as helper from 'util/helper'

describe('EventSourceService', () => {
  const GOOD_URL = helper.SIGNALING_URL_EVENT_SOURCE
  const WRONG_URL_1 = 'https://github.com:8100/coast-team/netflux'
  const WRONG_URL_2 = helper.SIGNALING_URL
  const esService = new EventSourceService()

  it(`Should connect to ${GOOD_URL}`, done => {
    esService.connect(GOOD_URL)
      .then(res => {
        expect(res.readyState).toBeDefined()
        expect(res.send).toBeDefined()
      })
      .then(done)
      .catch(done.fail)
  })

  it(`Should fail to connect to: ${WRONG_URL_1}`, done => {
    esService.connect(WRONG_URL_1)
      .then(data => done.fail('Connection succeed'))
      .catch(done)
  })

  it(`Should fail to connect to: ${WRONG_URL_2}`, done => {
    esService.connect(WRONG_URL_2)
      .then(data => done.fail('Connection succeed'))
      .catch(done)
  })
})

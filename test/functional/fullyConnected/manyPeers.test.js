import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

xdescribe('Many peers -> ', () => {
  const NB_PEERS = 6
  let wcArray = []

  describe('One door -> ', () => {
    it('Peers should join the same WebChannel', (done) => {
      let counter = 0
      for (let i = 0; i < NB_PEERS; i++) {
        wcArray[i] = new WebChannel({signaling})
      }
      wcArray[0].onJoining = (id) => {
        counter++
        let found = false
        for (let wc of wcArray) {
          if (wc.myId === id) {
            found = true
            break
          }
        }
        expect(found).toBeTruthy()
        if (counter === NB_PEERS - 1) {
          setTimeout(() => {
            wcArray[0].ping().then((delay) => {
              console.log('WebChannel PING for ' + NB_PEERS + ' peers: ' + delay + ' ms')
              done()
            })
          }, 1500)
        }
      }
      for (let i = 1; i < NB_PEERS; i++) {
        wcArray[i].onJoining = (id) => {
          let found = false
          for (let wc of wcArray) {
            if (wc.myId === id) {
              found = true
              break
            }
          }
          expect(found).toBeTruthy()
        }
      }
      wcArray[0].openForJoining().then((data) => {
        console.log('-------------------------------->  INITIATOR ID: ' + wcArray[0].myId)
        for (let i = 1; i < NB_PEERS; i++) {
          wcArray[i].join(data.key)
            .catch(done.fail)
        }
      }).catch(done.fail)
    }, 7000)
  })
})

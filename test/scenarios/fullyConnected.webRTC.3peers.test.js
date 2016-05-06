import WebChannel from '../../src/WebChannel'

var signaling = 'ws://localhost:8000'

var webChannel, webChannel2, webChannel3

it('Client _1 creates a webChannel and open it to enable other clients to join', (done) => {
  webChannel = new WebChannel({signaling})
  webChannel.onJoining = (id) => {
    console.log('CLIENT_1: ' + id + ' HAS JOINED')
  }
  webChannel.onMessage = (id, msg) => {
    console.log('CLIENT_1:' + id + ' -> ' + msg)
    if (id === webChannel3.myId) {
      expect(msg).toEqual('Hello, this is _3')
    } else if (id === webChannel2.myId) {
      expect(msg).toEqual('Hi, I am _2')
      webChannel.send('And I am _1')
    } else {
      done.fail()
    }
  }
  webChannel.openForJoining()
    .then((data) => {
      // WebChannel IS OPENED
      console.log('CLIENT_1: WebChannel is OPENED <--------------- ' + webChannel.myId)

      // Client _2 joins the webChannel
      webChannel2 = new WebChannel({signaling})
      webChannel2.onJoining = (id) => {
        console.log('CLIENT_2: ' + id + ' HAS JOINED')
      }
      webChannel2.onMessage = (id, msg) => {
        console.log('CLIENT_2:' + id + ' -> ' + msg)
        if (id === webChannel3.myId) {
          expect(msg).toEqual('Hello, this is _3')
          webChannel2.send('Hi, I am _2')
        } else if (id === webChannel.myId) {
          expect(msg).toEqual('And I am _1')
          done()
        } else {
          done.fail()
        }
      }
      webChannel2.join(data.key)
        .then((wc) => {
          console.log('CLIENT_2: JOINED <--------------- ' + wc.myId)
          // Client _3 joins the webChannel
          webChannel3 = new WebChannel({signaling})
          webChannel3.onMessage = (id, msg) => {
            console.log('CLIENT_3:' + id + ' -> ' + msg)
            if (id === webChannel2.myId) {
              expect(msg).toEqual('Hi, I am _2')
            } else if (id === webChannel.myId) {
              expect(msg).toEqual('And I am _1')
              done()
            } else {
              console.log('FAILED: ' + id)
              done.fail()
            }
          }
          webChannel3.join(data.key)
            .then((wc) => {
              console.log('CLIENT_3: JOINED <--------------- ' + wc.myId)
              webChannel3.send('Hello, this is _3')
              console.log('TADA')
            })
            .catch((err) => {
              console.log('Err: ' + err.toString())
            })
        })
    })
})

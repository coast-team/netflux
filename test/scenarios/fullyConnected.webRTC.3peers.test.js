var nf2 = require('../../dist/netflux')
var nf3 = require('../../dist/netflux')

describe('Three clients connect via webRTC within fully connected network', () => {
  var key, webChannel, webChannel2, webChannel3

  it('Client #1 creates a webChannel and open it to enable other clients to join', (done) => {
    webChannel = window.nf.create()
    webChannel.onJoining = (id) => {
      console.log('CLIENT#1: ' + id + ' has joined')
    }
    webChannel.onmessage = (id, msg) => {
      console.log('CLIENT#1:' + id + ' -> ' + msg)
      if (id == webChannel3.myID) {
        expect(msg).toEqual('Hello, this is #3')
      } else if (id == webChannel2.myID) {
        expect(msg).toEqual('Hi, I am #2')
        webChannel.send('And I am #1')
      } else {
        done.fail()
      }
    }
    webChannel
      .openForJoining()
      .then((data) => {
        // WebChannel IS OPENED
        console.log('CLIENT#1: webChannel has been opened <--------------- ' + webChannel.myID)
        key = data.key

        // Client #2 joins the webChannel
        nf2
          .join(key)
          .then((wc) => {
            console.log('CLIENT#2: joined the webChannel <--------------- ' + wc.myID)
            webChannel2 = wc
            webChannel2.onJoining = (id) => {
              console.log('CLIENT#2: ' + id + ' has joined')
            }
            webChannel2.onmessage = (id, msg) => {
              console.log('CLIENT#2:' + id + ' -> ' + msg)
              if (id == webChannel3.myID) {
                expect(msg).toEqual('Hello, this is #3')
                webChannel2.send('Hi, I am #2')
              } else if (id == webChannel.myID) {
                expect(msg).toEqual('And I am #1')
                done()
              } else {
                done.fail()
              }
            }
            // Client #3 joins the webChannel
            nf3
              .join(key)
              .then((wc) => {
                console.log('CLIENT#3: joined the webChannel <--------------- ' + wc.myID)
                webChannel3 = wc
                webChannel3.onmessage = (id, msg) => {
                  console.log('CLIENT#3:' + id + ' -> ' + msg)
                  if (id == webChannel2.myID) {
                    expect(msg).toEqual('Hi, I am #2')
                  } else if (id == webChannel.myID) {
                    expect(msg).toEqual('And I am #1')
                    done()
                  } else {
                    done.fail()
                  }
                }

                webChannel3.send('Hello, this is #3')
              })
          })
      })
      .catch(done.fail)
  })
})

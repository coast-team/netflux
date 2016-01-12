var nf1 = require('../../dist/netflux.js')
var nf2 = require('../../dist/netflux.js')

describe('One peer creates a network (webRTC), invites another peer which joins it.', () => {
  let net1, invitingURL
  it('Peer#1: initialize/configure API', () => {
    nf1.onPeerJoining = (peer, net) => {
      // TODO
    }
  })
  it('Peer#1: create network', () => {
    net1 = nf1.create('fullyconnected')
  })
  it('Peer#1: start inviting', () => {
    invitingURL = net1.startInviting()
  })
  //  Peer#1: give URL to Peer#2 by email for example
  it('Peer#2: join network', () => {
    nf2.join(invitingURL)
      .then((net) => {
        // TODO
      })
      .catch((reason) => {
        // TODO
      })
  })
  //  Peer#1: receive peer join notification (execute NF1.onPeerJoining)
  it('Peer#1: stop inviting', () => {
    net1.stopInviting()
  })
})

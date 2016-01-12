import '../../dist/netflux.js'

describe('2 peers in the network send/receive broadcast messages', () => {
  let net1, net2, invitingURL
  it('Peer#1: initialize/configure API', () => {
    NF1.onBroadcastMessage = (peer, net, data) => {
      // TODO
    }
  })
  it('Peer#1: create network', () => {
    netP1 = NF.create('fullyconnected')
  })
  it('Peer#1: start inviting', () => {
    invitingURL = net.startInviting()
  })
  // Peer#1 gives URL to Peer#2 by email for example
  it('Peer#2: initialize/configure API', () => {
    NF2.onPeerJoining = (peer, net) => {
      // TODO
    }
    NF2.onBroadcastMessage = (peer, net, data) => {
      // TODO
    }
  })
  it('Peer#2: join network', () => {
    NF2.onBroadcastMessage = (peer, net, data) => {
      // TODO
    }
    NF.join(invitingURL)
      .then((net) => {
        netP2 = net
        // TODO
      })
      .catch((reason) => {
        // TODO
      })
  })
  it('Peer#1: get join peer notification', () => {
  })
  it('Peer#1: stop inviting', () => {
    netP1.stopInviting()
  })
  it('Peer#1: send broadcast message to the network', () => {
    netP1.broadcast("Hello network! I'm Peer#1.")
  })
  it('Peer#2: get broadcast message', () => {
  })
  it('Peer#2: send broadcast message to the network', () => {
  })
  it('Peer#1: get broadcast message', () => {
  })
  it('Peer#1: send message to Peer#2', () => {
  })
  it('Peer#2: get Peer1\'s message', () => {
  })
  it('Peer#2: send message to Peer#1', () => {
  })
  it('Peer#1: get Peer2\'s message', () => {
  })
})

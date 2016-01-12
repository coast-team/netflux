import { Facade } from '../src/facade.js'

// describe('Netflux', () => {
//   describe('create', () => {
//     it('Fully Connected Topology', () => {
//       const net = NF.create('fullyconnected')
//       expect(net.topology).toBe('fullyconnected')
//       expect(net.peers.length).toBe(0)
//       expect(net.state).toBe('active')
//     })
//   })
//   describe('Create a fully connected network and invite peers to it', () => {
//     let net
//     beforeAll(() => {
//       net = NF.create('fullyconnected')
//     })
//     it('Start inviting', () => {
//       let url = net.startInviting('https://myserver.io')
//       // TODO: finish regular expression
//       expect(url).toMatch(/https?:\/\/.*/)
//       expect(net.isInviting).toBeTruthy()
//     })
//   })
//
//   describe('connect', () => {
//     it('via signaling/tracking server to a network', () => {
//       NF.connect('https://myserver.io/KL76FOEJO03E766GY')
//         .then((net) => {
//           expect(net.state).toBe('active')
//         })
//         .catch((reason) => {
//           expect(true).toBe(false)
//         })
//     })
//   })
//   describe('onPeerJoining', () => {
//     it('to one of an active network', () => {
//       // TODO
//       NF.onPeerJoining = (newPeer, net) => {
//         expect(net.peers.indexOf(newPeer)).toBeGreaterThan(-1)
//       }
//     })
//   })
//   describe('onPeerLeaving', () => {
//     // TODO
//     NF.onPeerLeaving = (oldPeer, net) => {
//       expect(net.peers.indexOf(oldPeer)).toBe(-1)
//     }
//   })
//   describe('onJoinRequest', () => {
//     // TODO
//     NF.onJoinRequest = (fromPeer, fromPeerNetID) => {
//       expect(fromPeer.connector).not.toBe(null)
//     }
//   })
//   describe('sendJoinRequest', () => {
// // TODO
//   })
//   describe('onMessage', () => {
//     // TODO
//   })
// })

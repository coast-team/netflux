import WebSocketService from '../../../src/service/channelBuilder/WebSocketService'

describe('WebSocketService ->', () => {
	const onlineSignaling = 'ws://sigver-coastteam.rhcloud.com:8000'
	const localSignaling = 'ws://localhost:8000'

	it('Should open a socket with the local signaling server', (done) => {
		let webSocketService = new WebSocketService({signaling: localSignaling})
		webSocketService.connect(webSocketService.settings.signaling)
			.then(done)
			.catch((reason) => {
				console.log('Error: ' + reason)
				done.fail(reason)
			})
	})

	it('Should open a socket with the online signaling server', (done) => {
		let webSocketService = new WebSocketService({signaling: onlineSignaling})
		webSocketService.connect(webSocketService.settings.signaling)
			.then(done)
			.catch((reason) => {
				console.log('Error: ' + reason)
				done.fail(reason)
			})
	}, 10000)

	it('Should fail to open a socket because of wrong URL', (done) => {
		let webSocketService = new WebSocketService({signaling: 'https://github.com:8100/coast-team/netflux'})
		webSocketService.connect(webSocketService.settings.signaling)
			.then((data) => {done.fail()})
			.catch(done)
})
})

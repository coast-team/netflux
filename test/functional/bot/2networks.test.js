import {signaling} from 'config'
import WebChannel from 'src/WebChannel'

let host = '127.0.0.1'
let port = 9000
let wcA, wcB, wcC, wcD

describe('2 networks -> ', () => {
  it('Should add the same bot server (A - B then Bot then C - Bot then D)', (done) => {
    wcA = new WebChannel({signaling})
    wcB = new WebChannel({signaling})
    wcC = new WebChannel({signaling})
    wcD = new WebChannel({signaling})

    let joiningPeers = []
    wcA.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wcC.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wcA.leave()
        wcB.leave()
        wcC.leave()
        wcD.leave()
        done()
      }
    }

    // The first network of 2 peers add the bot
    wcA.open()
      .then((data1) => wcB.join(data1.key))
      .then(() => wcA.addBotServer(host, port))
      // The second network add the same bot and then a peer join
      .then(() => wcC.addBotServer(host, port))
      .then(() => wcC.open())
      .then((data2) => wcD.join(data2.key))
      .catch(done.fail)
  })

  it('Should add the same bot server (A - Bot then B then C - Bot then D)', (done) => {
    wcA = new WebChannel({signaling})
    wcB = new WebChannel({signaling})
    wcC = new WebChannel({signaling})
    wcD = new WebChannel({signaling})

    let joiningPeers = []
    wcA.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wcC.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wcA.leave()
        wcB.leave()
        wcC.leave()
        wcD.leave()
        done()
      }
    }

    // The first network add the bot and then a peer join
    wcA.addBotServer(host, port)
      .then(() => wcA.open())
      .then((data1) => wcB.join(data1.key))
      // The second network add the same bot and then a peer join
      .then(() => wcC.addBotServer(host, port))
      .then(() => wcC.open())
      .then((data2) => wcD.join(data2.key))
      .catch(done.fail)
  })

  it('Should add the same bot server (A - Bot then B then C - D then Bot)', (done) => {
    wcA = new WebChannel({signaling})
    wcB = new WebChannel({signaling})
    wcC = new WebChannel({signaling})
    wcD = new WebChannel({signaling})

    let joiningPeers = []
    wcA.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wcC.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wcA.leave()
        wcB.leave()
        wcC.leave()
        wcD.leave()
        done()
      }
    }

    // The first network add the bot and then a peer join
    wcA.addBotServer(host, port)
      .then(() => wcA.open())
      .then((data1) => wcB.join(data1.key))
      // The second network of 2 peers add the bot
      .then(() => wcC.open())
      .then((data2) => wcD.join(data2.key))
      .then(() => wcC.addBotServer(host, port))
      .catch(done.fail)
  })

  it('Should add the same bot server (A - B then Bot then C - D then Bot)', (done) => {
    wcA = new WebChannel({signaling})
    wcB = new WebChannel({signaling})
    wcC = new WebChannel({signaling})
    wcD = new WebChannel({signaling})

    let joiningPeers = []
    wcA.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wcC.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wcA.leave()
        wcB.leave()
        wcC.leave()
        wcD.leave()
        done()
      }
    }

    // The first network of 2 peers add the bot
    wcA.open()
      .then((data1) => wcB.join(data1.key))
      .then(() => wcA.addBotServer(host, port))
      // The second network of 2 peers add the bot
      .then(() => wcC.open())
      .then((data2) => wcD.join(data2.key))
      .then(() => wcC.addBotServer(host, port))
      .catch(done.fail)
  })

  it('Should add the same bot server (A - B then C - D then Network1 - Bot then Network2 - Bot)', (done) => {
    wcA = new WebChannel({signaling})
    wcB = new WebChannel({signaling})
    wcC = new WebChannel({signaling})
    wcD = new WebChannel({signaling})

    let joiningPeers = []
    wcA.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wcC.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wcA.leave()
        wcB.leave()
        wcC.leave()
        wcD.leave()
        done()
      }
    }

    // The first network of 2 peers add the bot after the second network is created
    wcA.open()
      .then((data1) => wcB.join(data1.key))
      // The second network of 2 peers add the bot after the first added
      .then(() => wcC.open())
      .then((data2) => wcD.join(data2.key))
      .then(() => wcA.addBotServer(host, port))
      .then(() => wcC.addBotServer(host, port))
      .catch(done.fail)
  })

  it('Should add the same bot server (A - Bot then C - D then B then Network2 - Bot)', (done) => {
    wcA = new WebChannel({signaling})
    wcB = new WebChannel({signaling})
    wcC = new WebChannel({signaling})
    wcD = new WebChannel({signaling})

    let joiningPeers = []
    wcA.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wcC.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wcA.leave()
        wcB.leave()
        wcC.leave()
        wcD.leave()
        done()
      }
    }

    // The first network add the bot and then a peer join after the second network is created
    wcA.addBotServer(host, port)
      // The second network of 2 peers add the bot after the first is complete
      .then(() => wcC.open())
      .then((data2) => wcD.join(data2.key))
      .then(() => wcA.open())
      .then((data1) => wcB.join(data1.key))
      .then(() => wcC.addBotServer(host, port))
      .catch(done.fail)
  })

  it('Should add the same bot server (A - Bot then C - Bot then B then D)', (done) => {
    wcA = new WebChannel({signaling})
    wcB = new WebChannel({signaling})
    wcC = new WebChannel({signaling})
    wcD = new WebChannel({signaling})

    let joiningPeers = []
    wcA.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wcC.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wcA.leave()
        wcB.leave()
        wcC.leave()
        wcD.leave()
        done()
      }
    }

    // The first network add the bot and then a peer join after the second network added
    wcA.addBotServer(host, port)
      .then(() => wcC.addBotServer(host, port))
      // The second network add the bot and then a peer join at the end
      .then(() => wcA.open())
      .then((data1) => wcB.join(data1.key))
      .then(() => wcC.open())
      .then((data2) => wcD.join(data2.key))
      .catch(done.fail)
  })

  it('Should add the same bot server (A - B then C - Bot then Network1 - Bot then D)', (done) => {
    wcA = new WebChannel({signaling})
    wcB = new WebChannel({signaling})
    wcC = new WebChannel({signaling})
    wcD = new WebChannel({signaling})

    let joiningPeers = []
    wcA.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wcC.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wcA.leave()
        wcB.leave()
        wcC.leave()
        wcD.leave()
        done()
      }
    }

    // The first network of 2 peers add the bot after the second network added
    wcA.open()
      .then((data1) => wcB.join(data1.key))
      // The second network add the bot and then a peer join at the end
      .then(() => wcC.addBotServer(host, port))
      .then(() => wcA.addBotServer(host, port))
      .then(() => wcC.open())
      .then((data2) => wcD.join(data2.key))
      .catch(done.fail)
  })

  it('Should add the same bot server (A - B then Bot then A - C then Bot)', (done) => {
    wcA = [new WebChannel({signaling}), new WebChannel({signaling})]
    wcB = new WebChannel({signaling})
    wcC = new WebChannel({signaling})

    let cpt = 0

    for (let i = 0; i < wcA.length; i++) {
      wcA[i].onJoining = (id) => {
        if (wcA[i].channels.size === 2) {
          cpt++
          if (cpt === wcA.length + 1) done()
        }
      }
    }

    wcB.onJoining = (id) => {
      if (wcB.channels.size === 2) {
        cpt++
        if (cpt === wcA.length + 1) done()
      }
    }

    wcC.onJoining = (id) => {
      if (wcC.channels.size === 2) {
        cpt++
        if (cpt === wcA.length + 1) done()
      }
    }

    // The first network of 2 peers add the bot after the second network added
    wcA[0].open()
      .then((data1) => wcB.join(data1.key))
      .then(() => wcA[0].addBotServer(host, port))
      .then(() => wcA[1].open())
      .then((data2) => wcC.join(data2.key))
      .then(() => wcA[1].addBotServer(host, port))
      .catch(done.fail)
  })
})

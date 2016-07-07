import {signaling} from '../../config'
import {WebChannel} from '../../../src/WebChannel'

let host = '127.0.0.1'
let port = 9000
let wc1, wc2, wc3, wc4

describe('2 networks -> ', () => {
  it('Should add the same bot server (A - B then Bot then C - Bot then D)', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})
    wc3 = new WebChannel({signaling})
    wc4 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wc3.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wc1.leave()
        wc2.leave()
        wc3.leave()
        wc4.leave()
        done()
      }
    }

    // The first network of 2 peers add the bot
    wc1.open().then((data1) => {
      wc2.join(data1.key).then(() => {
        wc1.addBotServer(host, port).then(() => {
          // The second network add the same bot and then a peer join
          wc3.addBotServer(host, port).then(() => {
            wc3.open().then((data2) => {
              wc4.join(data2.key).catch(done.fail)
            }).catch(done.fail) // open
          }).catch(done.fail) // addBotServer
        }).catch(done.fail) // addBotServer
      }).catch(done.fail) // join
    }).catch(done.fail) // open
  })

  it('Should add the same bot server (A - Bot then B then C - Bot then D)', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})
    wc3 = new WebChannel({signaling})
    wc4 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wc3.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wc1.leave()
        wc2.leave()
        wc3.leave()
        wc4.leave()
        done()
      }
    }

    // The first network add the bot and then a peer join
    wc1.open().then((data1) => {
      wc1.addBotServer(host, port).then(() => {
        wc2.join(data1.key).then(() => {
          // The second network add the same bot and then a peer join
          wc3.addBotServer(host, port).then(() => {
            wc3.open().then((data2) => {
              wc4.join(data2.key).catch(done.fail)
            }).catch(done.fail) // open
          }).catch(done.fail) // addBotServer
        }).catch(done.fail) // join
      }).catch(done.fail) // addBotServer
    }).catch(done.fail) // open
  })

  it('Should add the same bot server (A - Bot then B then C - D then Bot)', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})
    wc3 = new WebChannel({signaling})
    wc4 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wc3.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wc1.leave()
        wc2.leave()
        wc3.leave()
        wc4.leave()
        done()
      }
    }

    // The first network add the bot and then a peer join
    wc1.open().then((data1) => {
      wc1.addBotServer(host, port).then(() => {
        wc2.join(data1.key).then(() => {
          // The second network of 2 peers add the bot
          wc3.open().then((data2) => {
            wc4.join(data2.key).then(() => {
              wc3.addBotServer(host, port).then(() => {}).catch(done.fail)
            }).catch(done.fail) // join
          }).catch(done.fail) // open
        }).catch(done.fail) // join
      }).catch(done.fail) // addBotServer
    }).catch(done.fail) // open
  })

  it('Should add the same bot server (A - B then Bot then C - D then Bot)', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})
    wc3 = new WebChannel({signaling})
    wc4 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wc3.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wc1.leave()
        wc2.leave()
        wc3.leave()
        wc4.leave()
        done()
      }
    }

    // The first network of 2 peers add the bot
    wc1.open().then((data1) => {
      wc2.join(data1.key).then(() => {
        wc1.addBotServer(host, port).then(() => {
          // The second network of 2 peers add the bot
          wc3.open().then((data2) => {
            wc4.join(data2.key).then(() => {
              wc3.addBotServer(host, port).then(() => {}).catch(done.fail)
            }).catch(done.fail) // join
          }).catch(done.fail) // open
        }).catch(done.fail) // addBotServer
      }).catch(done.fail) // join
    }).catch(done.fail) // open
  })

  it('Should add the same bot server (A - B then C - D then Network1 - Bot then Network2 - Bot)', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})
    wc3 = new WebChannel({signaling})
    wc4 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wc3.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wc1.leave()
        wc2.leave()
        wc3.leave()
        wc4.leave()
        done()
      }
    }

    // The first network of 2 peers add the bot after the second network is created
    wc1.open().then((data1) => {
      wc2.join(data1.key).then(() => {
        // The second network of 2 peers add the bot after the first added
        wc3.open().then((data2) => {
          wc4.join(data2.key).then(() => {
            wc1.addBotServer(host, port).then(() => {
              wc3.addBotServer(host, port).then(() => {}).catch(done.fail)
            }).catch(done.fail) // addBotServer
          }).catch(done.fail) // join
        }).catch(done.fail) // open
      }).catch(done.fail) // join
    }).catch(done.fail) // open
  })

  it('Should add the same bot server (A - Bot then C - D then B then Network2 - Bot)', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})
    wc3 = new WebChannel({signaling})
    wc4 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wc3.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wc1.leave()
        wc2.leave()
        wc3.leave()
        wc4.leave()
        done()
      }
    }

    // The first network add the bot and then a peer join after the second network is created
    wc1.open().then((data1) => {
      wc1.addBotServer(host, port).then(() => {
        // The second network of 2 peers add the bot after the first is complete
        wc3.open().then((data2) => {
          wc4.join(data2.key).then(() => {
            wc2.join(data1.key).then(() => {
              wc3.addBotServer(host, port).then(() => {}).catch(done.fail)
            }).catch(done.fail) // join
          }).catch(done.fail) // join
        }).catch(done.fail) // open
      }).catch(done.fail) // addBotServer
    }).catch(done.fail) // open
  })

  it('Should add the same bot server (A - Bot then C - Bot then B then D)', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})
    wc3 = new WebChannel({signaling})
    wc4 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wc3.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wc1.leave()
        wc2.leave()
        wc3.leave()
        wc4.leave()
        done()
      }
    }

    // The first network add the bot and then a peer join after the second network added
    wc1.open().then((data1) => {
      wc1.addBotServer(host, port).then(() => {
        // The second network add the bot and then a peer join at the end
        wc3.addBotServer(host, port).then(() => {
          wc2.join(data1.key).then(() => {
            wc3.open().then((data2) => {
              wc4.join(data2.key).then(() => {}).catch(done.fail)
            }).catch(done.fail) // open
          }).catch(done.fail) // join
        }).catch(done.fail) // addBotServer
      }).catch(done.fail) // addBotServer
    }).catch(done.fail) // open
  })

  it('Should add the same bot server (A - B then C - Bot then Network1 - Bot then D)', (done) => {
    wc1 = new WebChannel({signaling})
    wc2 = new WebChannel({signaling})
    wc3 = new WebChannel({signaling})
    wc4 = new WebChannel({signaling})

    let joiningPeers = []
    wc1.onJoining = (id) => {
      joiningPeers.push(id)
    }

    wc3.onJoining = (id) => {
      joiningPeers.push(id)
      if (joiningPeers.length === 4) {
        wc1.leave()
        wc2.leave()
        wc3.leave()
        wc4.leave()
        done()
      }
    }

    // The first network of 2 peers add the bot after the second network added
    wc1.open().then((data1) => {
      wc2.join(data1.key).then(() => {
        // The second network add the bot and then a peer join at the end
        wc3.addBotServer(host, port).then(() => {
          wc1.addBotServer(host, port).then(() => {
            wc3.open().then((data2) => {
              wc4.join(data2.key).then(() => {}).catch(done.fail)
            }).catch(done.fail) // open
          }).catch(done.fail) // addBotServer
        }).catch(done.fail) // addBotServer
      }).catch(done.fail) // join
    }).catch(done.fail) // open
  })
})

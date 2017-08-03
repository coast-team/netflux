import { PartialView } from './PartialView'
import { TopologyInterface } from '../TopologyInterface'
import { Service } from '../../Service'
import { ServiceMessageDecoded } from '../../../Util'
import { WebChannel } from '../../WebChannel'
import { Channel } from '../../../Channel'
import { spray, service, channelBuilder } from '../../../Protobuf'
import { Message } from '../../../typings/Protobuf'

/**
 * Delay in milliseconds between two exchanges
 */
const delay = 1000 * 60 * 2

/**
 * Timeout value in milliseconds for exchanges
 */
const timeout = 1000 * 30

/**
 * Value in milliseconds representing the maximum time expected
 * of message traveling between two peers (used by _clearReceived)
 */
const delayPerConnection = 100 * 300

export const SPRAY = 15



export class SprayService extends Service implements TopologyInterface {

  channels: Set<Channel>
  jps: Map<number, Channel>
  p: PartialView
  received: Array<Array<number|ArrayBuffer>>
  wc: WebChannel
  channelsSubscription: any // Type ??
  interval: NodeJS.Timer
  timeoutExch: NodeJS.Timer
  timeoutReceived: NodeJS.Timer
  deportedJoin: Map<number, number>

  constructor (wc: WebChannel) {
    super(SPRAY, spray.Message, wc._svcMsgStream)
    this.wc = wc
    this.init()
    console.info(this.wc.myId + ' constructor ')
  }

  init () {
    this.channels = new Set()
    this.jps = new Map()
    this.deportedJoin = new Map()
    this.p = new PartialView()
    this.received = [] // [senderId, timestamp] couples of received messages

    this.timeoutExch = setTimeout( () => { this.interval = setInterval( () => { this._exchange(this.wc) }, delay) }, 1000 * 10)

    this.svcMsgStream.subscribe(
      msg => this._handleSvcMsg(msg),
      err => console.error('Spray Message Stream Error', err),
      () => this.leave()
    )

    this.channelsSubscription = this.wc.channelBuilder.channels().subscribe(
      ch => {console.info(this.wc.myId + ` chanBuild => jps.set(${ch.peerId}, ${ch.peerId})`); (this.jps.set(ch.peerId, ch))},
      err => console.error('Spray set joining peer Error', err)
    )

    this.timeoutReceived = setTimeout(() => this._clearReceived(), 5000)
  }

  iJoin (): boolean {
    return this.jps.has(this.wc.myId)
  }

  /**
   * Add a peer to the WebChannel
   *
   * @param  {Channel}            channel
   */
  addJoining (channel: Channel): void {
    let newPeerId = channel.peerId
    console.info(this.wc.myId + ' addJoining ' + newPeerId)
    const peers = this.wc.members.slice()

    let jpsString = '\njps : '
    for (let [key, value] of this.jps) {
      jpsString += `${key} => ${value.peerId}\n`
    }
    console.info(this.wc.myId + ' addJoining => this.jps.set(' + newPeerId + ',' + channel.peerId + ')\n', jpsString)
    this.jps.set(+channel.peerId, channel)

    // First joining peer
    if (this.wc.members.slice().length === 0) {
      channel.send(this.wc._encode({
        recipientId: newPeerId,
        content: super.encode({ joinedPeerIdFinished: newPeerId }),
        meta: { timestamp: Date.now() }
      }))
      this.peerJoined(channel)

      this.p.add(newPeerId)

    // There are at least 2 members in the network
    } else {
      this.p.forEach(([pId, age]) => {
        if (this.deportedJoin.get(newPeerId) === undefined) {
          this.deportedJoin.set(newPeerId, 1)
        } else {
          this.deportedJoin.set(newPeerId, this.deportedJoin.get(newPeerId) + 1)
        }
        this.wc._sendTo({
          recipientId: pId,
          content: super.encode({ connectTo: newPeerId }),
          meta: { timestamp: Date.now() }
        })

        this.wc._sendTo({
          recipientId: pId,
          content: super.encode({ shouldAdd: newPeerId }),
          meta: { timestamp: Date.now() }
        })
      })
    }

    channel.send(this.wc._encode({
      recipientId: newPeerId,
      content: super.encode({ shouldAdd: this.wc.myId }),
      meta: { timestamp: Date.now() }
    }))
  }

  initJoining (ch: Channel): void {
    let jpsString = '\njps : '
    for (let [key, value] of this.jps) {
      jpsString += `${key} => ${value.peerId}\n`
    }
    console.info(this.wc.myId + ' initJoining => this.jps.set(' + this.wc.myId + ',' + ch.peerId + ')\n', jpsString)
    this.jps.set(this.wc.myId, ch)
    this.peerJoined(ch)
  }

  clean (): void {
    // Do nothing
  }

  /**
   * Send message to all WebChannel members
   */
  async send (msg: Message): Promise<void> {
    if (this.wc.state === WebChannel.DISCONNECTED) {
      // console.error(this.wc.myId + ' send break (disconnected) ', msg)
      return
    }

    if (msg.recipientId === undefined) {
      // console.error(this.wc.myId + ' send break (no recipientId)', msg)
      return
    }

    if (msg.recipientId === this.wc.myId) {
      // console.error(this.wc.myId + ' send break (to me)', msg)
      return
    }

    console.info(this.wc.myId + ` send ${msg.senderId} => ${msg.recipientId}`)

    // console.info(this.wc.myId + ' send ' + JSON.stringify(msg))
    // try {
    //   console.info(this.wc.myId + ' content1 : ' + JSON.stringify(super.decode(service.Message.decode(msg.content).content)))
    // } catch (e) {
    //   try {
    //     console.info(this.wc.myId + ' content2 : ' + JSON.stringify(channelBuilder.Message.decode(msg.content)))
    //   } catch (e2) {
    //   }
    // }

    if (msg.meta === undefined || msg.meta.timestamp === undefined) {
      if (msg.meta === undefined) {
        msg.meta = {}
      }
      msg.meta.timestamp = Date.now()
    }

    const bytes = this.wc._encode(msg)

    const listChan = []
    this.p.forEach((arc) => {
      for (let ch of this.channels) {
        if (ch !== undefined && ch.peerId === arc[0]) {
          console.info(this.wc.myId + ' channel found ' + ch.peerId)
          listChan.push(ch)
          return
        }
      }
      console.warn(this.wc.myId + ' channel not found ' + arc[0])
    })

    if (this.jps.has(msg.recipientId)) {
      console.info(this.wc.myId + ' need to send to joining peer')
      for (let [id, ch] of this.jps) {
        if (id === msg.recipientId || id === this.wc.myId) {

          let valH = undefined

          await crypto.subtle.digest('SHA-256', msg.content.buffer as any).then((h) => {valH = h})

          this.received.push([msg.senderId, msg.meta.timestamp, valH])
          let jpsString = '\njps : '
          for (let [key, value] of this.jps) {
            jpsString += `${key} => ${value.peerId}\n`
          }
          // console.warn(this.wc.myId + ' message sent to ' + msg.recipientId + ' (joining peer)', msg, jpsString)
          ch.send((bytes))
          return
        }
      }
      console.error(this.wc.myId + ' can only send to sender')
      return // Security
    }

    let listChanString = ''
    listChan.forEach((ch) => {
      listChanString += ch.peerId + '\n'
    })
    console.info(this.wc.myId + ' listChan : ' + listChanString)

    for (let ch of listChan) {
      if (ch !== undefined && ch.peerId !== msg.senderId) {
        console.info(this.wc.myId + ' sending to ' + ch.peerId)
        ch.send(bytes)
      }
    }

    console.info(this.wc.myId + ` end send ${msg.senderId} => ${msg.recipientId}`)

    let valH = undefined

    await crypto.subtle.digest('SHA-256', msg.content.buffer as any).then((h) => {valH = h})

    this.received.push([msg.senderId, msg.meta.timestamp, valH])
  }

  /**
   * Send message to a specific peer (recipientId)
   */
  async sendTo (msg: Message): Promise<any> {
    if (this.wc.state === WebChannel.DISCONNECTED) {
      // console.error(this.wc.myId + ' sendTo break (disconnected) ', msg)
      return
    }

    if (msg.recipientId === undefined) {
      // console.error(this.wc.myId + ' sendTo break (no recipientId)', msg)
      return
    }

    if (msg.recipientId === this.wc.myId) {
      // console.error(this.wc.myId + ' sendTo break (to me)', msg)
      return
    }

    let jpsString = '\njps : '
    for (let [key, value] of this.jps) {
      jpsString += `${key} => ${value.peerId}\n`
    }

    console.info(this.wc.myId + ` sendTo ${msg.senderId} => ${msg.recipientId}\n`, jpsString)

    // console.info(this.wc.myId + ' sendTo ' + msg.recipientId + "\nContent length : " + Object.keys(msg.content).length);

    // console.info(this.wc.myId + ' sendTo ' + JSON.stringify(msg))
    // try {
    //   console.info(this.wc.myId + ' content1 : ' + JSON.stringify(super.decode(service.Message.decode(msg.content).content)))
    // } catch (e) {
    //   try {
    //     console.info(this.wc.myId + ' content2 : ' + JSON.stringify(channelBuilder.Message.decode(msg.content)))
    //   } catch (e2) {
    //   }
    // }

    if (msg.meta === undefined || msg.meta.timestamp === undefined) {
      if (msg.meta === undefined) {
        msg.meta = {}
      }
      msg.meta.timestamp = Date.now()
    }

    const bytes = this.wc._encode(msg)

    if (this.p.length === 0) {
      console.info(this.wc.myId + ' empty partialView')
      for (let ch of this.channels) {
        if (ch !== undefined && ch.peerId === msg.recipientId) {
          return ch.send(bytes)
        }
      }
    }

    const listChan = []
    this.p.forEach((arc) => {
      for (let ch of this.channels) {
        if (ch !== undefined && ch.peerId === arc[0]) {
          console.info(this.wc.myId + ' channel found ' + ch.peerId)
          listChan.push(ch)
          return
        }
      }
      console.warn(this.wc.myId + ' channel not found ' + arc[0])
    })

    for (let ch of listChan) {
      if (ch !== undefined && ch.peerId === msg.recipientId) {
        let valH = undefined

        await crypto.subtle.digest('SHA-256', msg.content.buffer as any).then((h) => {valH = h})

        this.received.push([msg.senderId, msg.meta.timestamp, valH])
        console.info(this.wc.myId + ' message sent to ' + ch.peerId)
        return ch.send(bytes)
      }
    }

    for (let [id, ch] of this.jps) {
      if (id === msg.recipientId || id === this.wc.myId) {
        let valH = undefined

        await crypto.subtle.digest('SHA-256', msg.content.buffer as any).then((h) => {valH = h})

        this.received.push([msg.senderId, msg.meta.timestamp, valH])
        let jpsString = '\njps : '
        for (let [key, value] of this.jps) {
          jpsString += `${key} => ${value.peerId}\n`
        }
        // console.warn(this.wc.myId + ' message sent to ' + msg.recipientId + ' through broadcast', msg, '\n' + this.p.toString(),
        //  jpsString)
        return ch.send((bytes))
      }
    }

    // console.error(this.wc.myId + ' The recipient could not be found ', msg.recipientId, msg)
    console.error(this.wc.myId + ' The recipient could not be found ', msg.recipientId)
    this.forward(msg)
    return
  }

  forwardTo (msg: Message): void {
    if (this.wc.state === WebChannel.DISCONNECTED) {
      // console.error(this.wc.myId + ' forwardTo break (disconnected) ', msg)
      return
    }

    if (msg.recipientId === undefined) {
      // console.error(this.wc.myId + ' forwardTo break (no recipientId)', msg)
      return
    }

    console.info(this.wc.myId + ` forwardTo ${msg.senderId} => ${msg.recipientId}`)
    this.forward(msg)
  }

  async forward (msg: Message): Promise<void> {
    if (this.wc.state === WebChannel.DISCONNECTED) {
      // console.error(this.wc.myId + ' forward break (disconnected) ', msg)
      return
    }
    if (msg.recipientId === undefined) {
      // console.error(this.wc.myId + ' forward break (no recipientId)', msg)
      return
    }

    if (msg.meta !== undefined && msg.meta.timestamp !== undefined) {
      let rcvdString = ''
      for (let [sId, ts, l] of this.received) {
        if (rcvdString.length !== 0) {
          rcvdString += ', '
        }
        rcvdString += `[${sId},${ts},${l}]`
      }
      // console.info(this.wc.myId + ' received : ' + rcvdString)

      let alreadyReceived = false

      let valH = undefined

      await crypto.subtle.digest('SHA-256', msg.content.buffer as any).then((h) => valH = h)

      this.received.forEach( (message) => {
        if (!alreadyReceived && message[0] === msg.senderId && message[1] === msg.meta.timestamp
           && this.areHashEqual(<ArrayBuffer> message[2], valH)) {
          alreadyReceived = true
        }
      })

      if (alreadyReceived) {
        // console.info(this.wc.myId + ' message already received ', msg)
        console.error(this.wc.myId + ` message already received ${msg.senderId} => ${msg.recipientId}, ${msg.meta.timestamp}`)
        return
      }
    }

    // console.info(this.wc.myId + ` forward ${msg.senderId} => ${msg.recipientId}`, msg)

    let peersId = []
    this.p.forEach( (arc) => {
      peersId.push(arc[0])
    })

    if (peersId.includes(msg.recipientId)) {
      this.sendTo(msg)
    } else {
      this.send(msg)
    }
  }

  leave (): void {
    console.info(this.wc.myId + ' leave ')
    for (let c of this.channels) {
      c.close()
    }
    for (let ch of this.jps.values()) {
      ch.close()
    }
    this.channels.clear()
    clearTimeout(this.timeoutExch)
    clearTimeout(this.timeoutReceived)
    clearInterval(this.interval)
    this.p = new PartialView()
  }

  onChannelClose (closeEvt: CloseEvent, channel: Channel): void {
    let jpsString = '\njps : '
    for (let [key, value] of this.jps) {
      try {
        jpsString += `${key} => ${value.peerId}\n`
      } catch (e) {
        console.error(this.wc.myId + ` ${key} with value ${value}`, e)
      }
    }

    console.info(this.wc.myId + ' onChannelClose ', '\npartialView : ' + this.p.toString(), jpsString)
    // TODO : use _onPeerDown or _onArcDown
    if (this.iJoin()) {
      const firstChannel = this.channels.values().next().value
      if (channel !== undefined && firstChannel !== undefined && firstChannel.peerId === channel.peerId) {
        this.wc._joinFailed()
        for (let ch of this.channels) {
          ch.close()
        }
        this.channels.clear()
        console.info(this.wc.myId + ' jps.clear')
        this.jps.clear()
      } else {
        this.channels.delete(channel)
        console.info(this.wc.myId + ' _onPeerLeave when iJoin ' + channel.peerId)
        this.wc._onPeerLeave(channel.peerId)
      }
    } else {
      for (let [id] of this.jps) {
        if (channel !== undefined && id === channel.peerId) {
          let jpsString = '\njps : '
          for (let [key, value] of this.jps) {
            jpsString += `${key} => ${value.peerId}\n`
          }
          console.info(this.wc.myId + ' onChanClose => this.jps.delete(' + id + ')\n', jpsString)
          this.jps.delete(id)
          jpsString = '\njps : '
          for (let [key, value] of this.jps) {
            jpsString += `${key} => ${value.peerId}\n`
          }
          console.info(this.wc.myId + ' deleted of jps ' + id + '\n', jpsString)
          return
        }
      }
      if (this.channels.has(channel)) {
        this.channels.delete(channel)
        console.info(this.wc.myId + ' _onPeerLeave ' + channel.peerId)
        this.wc._onPeerLeave(channel.peerId)
      }
    }
  }

  onChannelError (evt: Event, channel: Channel): void {
    console.info(this.wc.myId + ' onChannelError ')
    console.error(`Channel error with id: ${channel.peerId}: `, evt)
  }

  /**
   * Executes actions depending on the message stream
   *
   * @param {ServiceMessage} M {channel, senderId, recipientId, msg, timestamp}
   */
  private async _handleSvcMsg (M: ServiceMessageDecoded): Promise<void> {
    if (this.wc.state === WebChannel.DISCONNECTED) {
      console.info(this.wc.myId + ' _handleSvcMsg break (disconnected) ', M)
      return
    }

    const msg = M.msg

    if (M.timestamp !== undefined) {
      let rcvdString = ''
      for (let [sId, ts, l] of this.received) {
        if (rcvdString.length !== 0) {
          rcvdString += ', '
        }
        rcvdString += `[${sId},${ts},${l}]`
      }
      // console.info(this.wc.myId + ' received : ' + rcvdString)
      let alreadyReceived = false

      let valH = undefined

      await crypto.subtle.digest('SHA-256', super.encode(msg).buffer as any)
                        .then((h) => {valH = h})

      this.received.forEach( (message) => {
        if (!alreadyReceived && message[0] === M.senderId && message[1] === M.timestamp
           && this.areHashEqual(<ArrayBuffer> message[2], valH)) {
          alreadyReceived = true
        }
      })

      if (alreadyReceived) {
        // console.info(this.wc.myId + ' message already received ', msg)
        console.error(this.wc.myId + ` message already received ${msg.senderId} => ${msg.recipientId}, ${msg.meta.timestamp}`)
        return
      }

      this.received.push([M.senderId, M.timestamp, valH])
      let rcvd = ''
      this.received.forEach((r) => {
        if (rcvd.length === 0) {
          rcvd += '['
        }
        if (rcvd.length !== 1) {
          rcvd += ', '
        }

        rcvd += `[${r[0]},${r[1]},${r[2]}]`
      })
      if (rcvd.length !== 0) {
        rcvd += ']'
      }
    }


    // if (M.recipientId !== this.wc.myId) {
    //   console.error(this.wc.myId + ' need to modify this line ', msg)
    //   this.forward(msg)
    //   return
    // }

    switch (msg.type) {

    case 'shouldAdd': {

      console.info(this.wc.myId + ' shouldAdd ' + msg.shouldAdd)
      this.p.add(msg.shouldAdd)
      break

    }
    case 'exchangeInit': {

      console.error(M.channel.peerId + ' exchanging with ' + this.wc.myId)
      this._onExchange(this.wc, M.channel.peerId, msg.exchangeInit.sample)
      break

    }
    case 'connectTo': {

      console.info(this.wc.myId + ' connectTo ' + msg.connectTo)
      const peer = msg.connectTo
      let jpsString = '\njps : '
      for (let [key, value] of this.jps) {
        jpsString += `${key} => ${value.peerId}\n`
      }
      console.info(this.wc.myId + ` connectTo => this.jps.set(${peer}, ${M.channel.peerId})\n`, jpsString)
      this.jps.set(peer, M.channel)
      let counter = 0
      const connected = []
      const allCompleted = new Promise(resolve => {
        for (let ch of this.channels) {
          if (ch !== undefined && ch.peerId === peer) {
            console.error(this.wc.myId + ' already connected with ' + peer)
            resolve()
          }
        }
        this.wc.channelBuilder.connectTo(peer)
            .then(ch => {
              console.info(this.wc.myId + ' passed here')

              this.peerJoined(ch)

              this.wc._sendTo({
                recipientId: peer,
                content: super.encode({ joinedPeerIdFinished: this.wc.myId }),
                meta: { timestamp: Date.now() }
              })

              console.info(this.wc.myId + ' counter : ' + counter)
              if (++counter === 1) {
                resolve()
              }
            })
            .catch(err => {
              console.error(this.wc.myId + ' failed to connect to ' + peer, err.message)
              if (++counter === 1) {
                resolve()
              }
            })
      })
      allCompleted.then(() => {

        this.wc._send({
          content: super.encode({ joinedPeerId: peer }),
          meta: { timestamp: Date.now() }
        })

        console.info(this.wc.myId + ' connected to ' + peer + '\npartialView : ' + this.p.toString(), this.wc.members)
      })
      break

    }
    case 'joinedPeerIdFinished': {

      console.error(this.wc.myId + ' joinedPeerIdFinished ' + msg.joinedPeerIdFinished)
      if (this.iJoin() && msg.joinedPeerIdFinished === this.wc.myId) {
        let chanString = '\nchannels :'
        for (let ch of this.channels) {
          chanString += `${ch.peerId}\n`
        }
        console.error(this.wc.myId + ' _joinSucceed ' + M.senderId + ' ' + msg.joinedPeerIdFinished, chanString, this.wc.members)

        this.wc._joinSucceed()

      } else if (this.jps.has(msg.joinedPeerIdFinished)) {
        console.info(this.wc.myId + ' blablabla ' + msg.joinedPeerIdFinished)
        this.peerJoined(this.jps.get(msg.joinedPeerIdFinished))

      }

      let jpsString = '\njps : '
      for (let [key, value] of this.jps) {
        jpsString += `${key} => ${value.peerId}\n`
      }
      console.info(this.wc.myId + ' joinedPeerIdFinished => this.jps.delete(' + msg.joinedPeerIdFinished + ')\n', jpsString)
      this.jps.delete(msg.joinedPeerIdFinished)
      jpsString = '\njps : '
      for (let [key, value] of this.jps) {
        jpsString += `${key} => ${value.peerId}\n`
      }
      console.info(this.wc.myId + ' deleted of jps ' + msg.joinedPeerIdFinished + '\n', jpsString)
      break

    }
    case 'joinedPeerId': {

      console.info(this.wc.myId + ' joinedPeerId ' + msg.joinedPeerId)
      if (this.deportedJoin.get(msg.joinedPeerId)) {
        this.deportedJoin.set(msg.joinedPeerId, this.deportedJoin.get(msg.joinedPeerId) - 1)
        console.info(this.wc.myId + ' still ' + this.deportedJoin.get(msg.joinedPeerId) + ' peers joining ' + msg.joinedPeerId)
      }

      if (this.deportedJoin.get(msg.joinedPeerId) === 0) {
        console.info(this.wc.myId + ' no more peer joining ' + msg.joinedPeerId, this.wc.members)

        this.forward({
          senderId: this.wc.myId,
          recipientId: msg.joinedPeerId,
          isService: true,
          content: super.encode({ joinedPeerIdFinished: msg.joinedPeerId }),
          meta: { timestamp: Date.now() }
        })
        this.deportedJoin.delete(msg.joinedPeerId)

        let ch = this.jps.get(msg.joinedPeerId)
        if (ch === undefined) {
          console.error(this.wc.myId + ' joinedPeerId with undefined channel', msg.joinedPeerId)
          return
        }
        this.peerJoined(ch)
      }
      break

    }
    }
  }

  /**
   * Periodic procedure of exchange (active thread)
   *
   * @param  {WebChannel}    wc
   *
   * @return {Promise<void>}
   */
  private async _exchange (wc: WebChannel): Promise<void> {
    console.error(this.wc.myId + ' _exchange ')
    this.p.incrementAge()
    const oldestArc = this.p.oldest
    let cloneP = new PartialView()
    this.p.forEach( (arc) => {
      cloneP.add(arc[0], arc[1])
    })
    cloneP.remove(oldestArc[0], oldestArc[1])
    let sample = this._getSample(cloneP,
       Math.ceil(this.p.length / 2) - 1)
    sample.add(wc.myId)
    this._replace(sample, oldestArc[0], wc.myId)

    wc._sendTo({
      senderId: wc.myId,
      recipientId: oldestArc[0],
      content: super.encode({ exchangeInit: { sample } }),
      meta: { timestamp: Date.now() }
    })

    // async/await response... with timeout
    // let respSample = await new PartialView();
    await new Promise ((resolve, reject) => {
      wc._svcMsgStream
      .filter(msg => msg.recipientId === wc.myId && msg.type === 'exchangeResp')
      .subscribe(
        msg => {
          resolve(msg.respSample)
        }, err => {
          console.error('SprayService Message Stream Error', err, wc)
          reject()
        })
      setTimeout(() => reject('Exchange response timed out'), timeout)
    })
      .then((respSample) => {
        if (Array.isArray(respSample)) {
          respSample.forEach( (arc) => {
            this.p.add(arc[0], arc[1])
          })
        } else {
          console.error('SprayService Exchange response typeof ', typeof respSample)
        }
      })
      .catch(err => {
        console.error('Failed waiting exchange response ', err)
      })
    this._replace(sample, wc.myId, oldestArc[0])
    sample.forEach( (arc) => {
      for (let ch of this.channels) {
        if (ch.peerId === arc[0]) {
          ch.close()
        }
      }
      this.p.remove(arc[0], arc[1])
    })
  }

  /**
   * Periodic procedure of exchange (passive thread)
   *
   * @param {WebChannel}  wc
   * @param {number}      origineId  peerId
   * @param {PartialView} sample
   */
  private _onExchange (wc: WebChannel, origineId: number, sample: PartialView): void {
    console.info(this.wc.myId + ' _onExchange ')
    let respSample = this._getSample(this.p,
       Math.ceil(this.p.length / 2))
    this._replace(respSample, origineId, wc.myId)

    wc._sendTo({
      senderId: wc.myId,
      recipientId: origineId,
      content: super.encode({ exchangeResp: { respSample } }),
      meta: { timestamp: Date.now() }
    })

    this._replace(respSample, wc.myId, origineId)
    respSample.forEach( (arc) => {
      this.p.remove(arc[0], arc[1])
    })
    sample.forEach( (arc) => {
      this.p.add(arc[0], arc[1])
    })
  }

  /**
   * Get n random arcs in the partial view p
   *
   * @param  {PartialView} p
   * @param  {number}      n
   *
   * @return {PartialView}   partial view of n arcs from p
   */
  private _getSample (p: PartialView, n: number): PartialView {
    console.info(this.wc.myId + ' _getSample ')
    let cloneP = p.slice()
    let arcs = new PartialView()

    while (arcs.length < n && cloneP.length > 0) {
      let randomIndex = Math.floor(Math.random() * cloneP.length)
      let arc = cloneP.splice(randomIndex, 1)[0]
      // TODO verification peer is up
      // if peer is up
      arcs.add(arc[0], arc[1])
      // else launch this._onPeerDown (or this._onArcDown ?)
    }

    return arcs
  }

  /**
   * Replace a peerId in a PartialView by another
   *
   * @param {PartialView} p
   * @param {number}      oldId
   * @param {number}      newId
   */
  private _replace (p: PartialView, oldId: number, newId: number): void {
    console.info(this.wc.myId + ' _replace ')
    p.forEach( (arc) => {
      if (arc[0] === oldId) {
        arc[0] = newId
      }
    })
  }

  /**
   * When a peer is down, we count occurences
   * and duplicate arcs in the partial view
   *
   * @param {number} peerDownId
   */
  private _onPeerDown (peerDownId: number): void {
    console.info(this.wc.myId + ' _onPeerDown ')
    // Count and delete
    let occ = 0
    let toRemove = []
    this.p.forEach( (arc) => {
      if (arc[0] === peerDownId) {
        toRemove.push(arc)
        occ++
      }
    })
    toRemove.forEach( (arc) => {
      this.p.remove(arc[0], arc[1])
    })

    // Duplicate arcs
    for (let i = 0; i < occ; i++) {
      if (Math.random() > 1 / (this.p.length + occ)) { // Choice here : chance of duplication decreases
        let newArcId = this.p[Math.floor(Math.random() * this.p.length)][0]
        this.p.add(newArcId)
      }
    }
  }

  /**
   * When an arc is down but not the peer,
   * we duplicate a random arc of the
   * partial view
   *
   * @param {number} peerId
   * @param {number} age
   */
  private _onArcDown (peerId: number, age: number): void {
    console.info(this.wc.myId + ' _onArcDown ')
    this.p.remove(peerId, age)
    let newArcId = this.p[Math.floor(Math.random() * this.p.length)][0]
    this.p.add(newArcId)
  }

  private _clearReceived (): void {
    // TODO : there are different timestamp bases
    console.error(this.wc.myId + ' _clearReceived ')
    let clearDelay = Math.floor(Math.exp(this.p.length)) * 2 * delayPerConnection

    let i = 0
    while (i < this.received.length) {
      let ts = +this.received[i][1]

      // Bad condition
      if (Date.now() - ts > clearDelay) {
        this.received.splice(i, 1)
      } else {
        i++
      }
    }

    this.timeoutReceived = setTimeout(() => this._clearReceived(), clearDelay)
  }

  peerJoined (ch: Channel): void {
    if (ch === undefined) {
      console.error(this.wc.myId + ' peerJoined on undefined channel')
      return
    }
    console.info(this.wc.myId + ' peerJoined ' + ch.peerId)

    this.channels.add(ch)
    let jpsString = '\njps : '
    for (let [key, value] of this.jps) {
      try {
        jpsString += `${key} => ${value.peerId}\n`
      } catch (e) {
        console.error(this.wc.myId + ` ${key} with value ${value}`, e)
      }
    }

    console.info(this.wc.myId + ' peerJoined => this.jps.delete(' + ch.peerId + ')\n', jpsString)
    this.jps.delete(ch.peerId)
    jpsString = '\njps : '
    for (let [key, value] of this.jps) {
      try {
        jpsString += `${key} => ${value.peerId}\n`
      } catch (e) {
        console.error(this.wc.myId + ` ${key} with value ${value}`, e)
      }
    }

    console.info(this.wc.myId + ' deleted of jps ' + ch.peerId + '\n', jpsString, this.p.toString(), this.wc.members)
    this.wc._onPeerJoin(ch.peerId)
  }

  areHashEqual (h1: ArrayBuffer, h2: ArrayBuffer): Boolean {
    console.info(this.wc.myId + ` areHashEqual (${typeof h1}, ${typeof h2})`)
    let view1 = new DataView(h1)
    let view2 = new DataView(h2)

    if (view1.byteLength !== view2.byteLength) {
      return false
    }

    for (let i = 0; i < view1.byteLength; i += 4) {
      let value1 = view1.getUint32(i)
      let value2 = view2.getUint32(i)

      if (value1 !== value2) {
        return false
      }
    }

    return true
  }
}

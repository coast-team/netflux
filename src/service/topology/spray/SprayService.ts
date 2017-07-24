import { PartialView } from './PartialView'
import { TopologyInterface } from '../TopologyInterface'
import { ServiceMessage } from '../../Service'
import { WebChannel } from '../../WebChannel'
import { Channel } from '../../../Channel'
import { spray, service, channelBuilder } from '../../../Protobuf'

/**
 * Delay in milliseconds between two exchanges
 */
const delay = 1000 * 60 * 2;

/**
 * Timeout value in milliseconds for exchanges
 */
const timeout = 1000 * 60;

/**
 * Value in milliseconds representing the maximum time expected
 * of message traveling between two peers (used by _clearReceived)
 */
const delayPerConnection = 100 * 600;

export const SPRAY = 15;



export class SprayService extends TopologyInterface {

  channels: Set<Channel>;
  jps: Map<number, Channel>;
  p: PartialView;
  received: Array<Array<number>>;
  wc: WebChannel;
  channelsSubscription: any; // Type ??
  interval: NodeJS.Timer;

  constructor (wc: WebChannel) {
    super(SPRAY, spray.Message, wc._svcMsgStream);
    this.wc = wc;
    this.init();
    console.info(this.wc.myId + ' constructor ');
  }

  init () {
    this.channels = new Set();
    this.jps = new Map();
    this.p = new PartialView();
    this.received = []; // [senderId, timestamp] couples of received messages

    setTimeout( () => { this.interval = setInterval( () => { this._exchange(this.wc); }, delay); }, 1000*10);

    this.innerStream.subscribe(
      msg => this._handleSvcMsg(msg),
      err => console.error('Spray Message Stream Error', err),
      () => this.leave()
    );

    this.channelsSubscription = this.wc.channelBuilder.channels().subscribe(
      ch => (this.jps.set(ch.peerId, ch)),
      err => console.error('Spray set joining peer Error', err)
    );

    setTimeout(() => this._clearReceived(), 5000);
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
    console.info(this.wc.myId + ' addJoining ' + channel.peerId);
    const peers = this.wc.members.slice();

    // First joining peer
    if (this.wc.members.slice().length == 0) {
      channel.send(this.wc._encode({
        recipientId: channel.peerId,
        content: super.encode({ joinedPeerId: channel.peerId }),
        meta: { timestamp: Date.now() }
      }));
      this.peerJoined(channel);

      console.log(this.wc.myId + ' shouldAdd ' + channel.peerId);
      this.p.add(channel.peerId);
      console.log(this.wc.myId + ' partialView increased : ' + this.p.toString());

      channel.send(this.wc._encode({
        recipientId: channel.peerId,
        content: super.encode({ shouldAdd: this.wc.myId }),
        meta: { timestamp: Date.now() }
      }));

    // There are at least 2 members in the network
  } else {
    // TODO : modify for spray algo
    console.error(this.wc.myId + ' addJoining with several members ');
    this.jps.set(channel.peerId, channel);
    this.wc._send({ content: super.encode({ joiningPeerId: channel.peerId }) });
    channel.send(this.wc._encode({
      recipientId: channel.peerId,
      content: super.encode({ connectTo: { peers } }),
      meta: { timestamp: Date.now() }
    }));
  }

    // if (peers.length == 0) { // Case of two peers in the network
    //   console.log(this.wc.myId + ' there is nobody in partialView ');
    //
    //   let M1: ServiceMessage = {
    //                             channel: channel,
    //                             senderId: this.wc.myId,
    //                             recipientId: this.wc.myId,
    //                             msg: super.decode(service.Message.decode(super.encode({ shouldAdd: channel.peerId })).content), // decode of encode otherwise the type is not detected
    //                             timestamp: Date.now()
    //                            }
    //   console.log(this.wc.myId + ' sending first shouldAdd to me ');
    //   this._handleSvcMsg(M1);
    //
    //   let M2 = {
    //     recipientId: channel.peerId,
    //     content: super.encode({ shouldAdd: this.wc.myId }),
    //     meta: { timestamp: Date.now() }
    //   }
    //   console.log(this.wc.myId + ' sending first shouldAdd to ' + M2.recipientId + "\n" + JSON.stringify(M2) + "\n content : " + JSON.stringify(super.decode(service.Message.decode(M2.content).content)));
    //   channel.send(this.wc._encode(M2));
    //
    // } else {
    //   peers.forEach( (peer) => {
    //     console.info(this.wc.myId + ' sending shouldAdd message to ' + peer);
    //
    //     let M = this.wc._encode({
    //               recipientId: peer,
    //               content: super.encode({ shouldAdd: channel.peerId }),
    //               meta: { timestamp: Date.now() }
    //             });
    //     channel.send(M);
    //   });
    // }

    console.info(this.wc.myId + ' addJoining finished ' + channel.peerId);
  }

  initJoining (ch: Channel): void {
    console.info(this.wc.myId + ' initJoining ');
    this.jps.set(this.wc.myId, ch)
    this.channels.add(ch);
    this.wc._onPeerJoin(ch.peerId);
    console.info(this.wc.myId + ' _onPeerJoin ' + ch.peerId);
  }

  /**
   * Send message to all WebChannel members
   */
  send (msg: {senderId: number, recipientId: number, isService: boolean, content: Uint8Array, meta: any}): void {
    console.info(this.wc.myId + ' send ' + JSON.stringify(msg));
    try {
      console.info(this.wc.myId + ' content : ' + JSON.stringify(super.decode(service.Message.decode(msg.content).content)));
    } catch (e) {
      try {
        console.info(this.wc.myId + ' content : ' + JSON.stringify(channelBuilder.Message.decode(msg.content)));
      } catch (e2) {

      }
    }

    if (msg.meta == undefined || msg.meta.timestamp == undefined) {
      if (msg.meta == undefined) {
        msg.meta = {};
      }
      msg.meta.timestamp = Date.now();
      console.info(this.wc.myId + ' adding timestamp before sending ' + msg.meta.timestamp, JSON.stringify(msg));
    }

    const bytes = this.wc._encode(msg);

    const listChan = [];
    console.info(this.wc.myId + ' partialView : ' + this.p.toString());
    this.p.forEach((arc) => {
        console.info(this.wc.myId + ' arc : ' + arc + "\nthis.channels.size : " + this.channels.size);
        for (let ch of this.channels) {
          console.info(this.wc.myId + ' arc[0] : ' + arc[0] + "\n ch : " + ch.peerId);
          if (ch.peerId == arc[0]) {
            console.info(this.wc.myId + ' channel found ' + ch.peerId);
            listChan.push(ch);
            return;
          }
        }
        console.error(this.wc.myId + ' channel not found ' + arc[0]);
    });

    for (let ch of listChan) {
      ch.send(bytes);
    }
  }

  /**
   * Send message to a specific peer (recipientId)
   */
  sendTo (msg: {senderId: number, recipientId: number, isService: boolean, content: Uint8Array, meta: any}): any {
    console.info(this.wc.myId + ' sendTo ' + JSON.stringify(msg));
    try {
      console.info(this.wc.myId + ' content : ' + JSON.stringify(super.decode(service.Message.decode(msg.content).content)));
    } catch (e) {
      try {
        console.info(this.wc.myId + ' content : ' + JSON.stringify(channelBuilder.Message.decode(msg.content)));
      } catch (e2) {

      }
    }

    if (msg.meta == undefined || msg.meta.timestamp == undefined) {
      if (msg.meta == undefined) {
        msg.meta = {};
      }
      msg.meta.timestamp = Date.now();
      console.info(this.wc.myId + ' adding timestamp before sending ' + msg.meta.timestamp, JSON.stringify(msg));
    }

    const bytes = this.wc._encode(msg);

    console.info(this.wc.myId + ' partialView : ' + this.p);
    if (this.p.length == 0) {
      console.info(this.wc.myId + ' empty partialView ');
      for (let ch of this.channels) {
        if (ch.peerId === msg.recipientId) {
          return ch.send(bytes);
        }
      }
    }

    const listChan = [];
    this.p.forEach((arc) => {
        for (let ch of this.channels) {
          if (ch.peerId == arc[0]) {
            listChan.push(ch);
            return;
          }
        }
        console.error(this.wc.myId + ' channel not found ' + arc[0]);
    });

    for (let ch of listChan) {
      if (ch.peerId === msg.recipientId) {
        return ch.send(bytes);
      }
    }

    return console.error(this.wc.myId + ' The recipient could not be found ', msg.recipientId);
  }

  forwardTo (msg: {senderId: number, recipientId: number, isService: boolean, content: Uint8Array, meta: any}): void {
    console.info(this.wc.myId + ' forwardTo ' + JSON.stringify(msg));
    try {
      console.info(this.wc.myId + ' content : ' + JSON.stringify(super.decode(service.Message.decode(msg.content).content)));
    } catch (e) {

    }
    this.forward(msg);
  }

  forward (msg: {senderId: number, recipientId: number, isService: boolean, content: Uint8Array, meta: any}): void {
    console.info(this.wc.myId + ' forward ' + JSON.stringify(msg));
    try {
      console.info(this.wc.myId + ' content : ' + JSON.stringify(super.decode(service.Message.decode(msg.content).content)));
    } catch (e) {

    }
    let peersId = [];
    this.p.forEach( (arc) => {
      peersId.push(arc[0]);
    });

    console.log(this.wc.myId + ' peersId : ' + peersId + "\nlength : " + peersId.length);
    console.log(this.wc.myId + ' msg.recipientId : ' + msg.recipientId);
    if (peersId.includes(msg.recipientId)) {
      this.sendTo(msg);
    } else {
      this.send(msg);
    }
  }

  leave (): void {
    console.info(this.wc.myId + ' leave ');
    // TODO
    for (let c of this.channels) {
      c.clearHandlers();
      c.close();
    }
    this.channels.clear();
    clearInterval(this.interval);
  }

  onChannelClose (closeEvt: CloseEvent, channel: Channel): boolean {
    console.info(this.wc.myId + ' onChannelClose ');
    // TODO ?
    for (let c of this.channels) {
      if (c.peerId === channel.peerId) {
        return this.channels.delete(c);
      }
    }
    return false;
  }

  onChannelError (evt: Event, channel: Channel): void {
    console.info(this.wc.myId + ' onChannelError ');
    console.error(`Channel error with id: ${channel.peerId}: `, evt);
  }

  /**
   * Executes actions depending on the message stream
   *
   * @param {ServiceMessage} M {channel, senderId, recipientId, msg, timestamp}
   */
  private _handleSvcMsg (M: ServiceMessage): void {
    const msg = M.msg;
    console.info(this.wc.myId + " new message reception : " + JSON.stringify(msg) + ", timestamp : " + M.timestamp);

    if (M.timestamp != undefined) {
      let alreadyReceived = false;

      this.received.forEach( (message) => {
        if (!alreadyReceived && message[0] == msg.senderId && message[1] == M.timestamp) {
          alreadyReceived = true;
        }
      });

      if (alreadyReceived) {
        console.log(this.wc.myId + " message already received ");
        return;
      }

      this.received.push([M.senderId, M.timestamp]);
      console.info(this.wc.myId + ' received length : ' + this.received.length + "\n" + this.received);
    }


    if (M.recipientId != this.wc.myId) {
      console.error(this.wc.myId + ' received but not for me : ' + JSON.stringify(msg));
      this.forward(msg);
      return;
    }

    console.log(this.wc.myId + ' message type : ' + msg.type);
    switch (msg.type) {

      case 'shouldAdd': {

        console.log(this.wc.myId + ' shouldAdd ' + msg.shouldAdd);
        this.p.add(msg.shouldAdd);
        console.log(this.wc.myId + ' partialView increased : ' + this.p.toString());
        break;

      }
      case 'exchangeInit': {

        console.log(M.channel.peerId + ' exchanging with ' + this.wc.myId);
        this._onExchange(this.wc, M.channel.peerId, msg.exchangeInit.sample);
        break;

      }
      case 'connectTo': {

        console.log(this.wc.myId + ' connectTo ' + msg.connectTo);
        const { peers } = msg.connectTo;

        const promises = [];
        for (let id of peers) {
          promises[promises.length] = this.wc.channelBuilder.connectTo(id);
        }
        Promise.all(promises)
          .then(channels => {
            for (let ch of channels) {
              this.peerJoined(ch)
            }
            // M.channel.send(this.wc._encode({
            //   recipientId: M.channel.peerId,
            //   content: super.encode({ connectedTo: { peers } })
            // }))
          })
          .catch(err => {
            console.error('Failed to join', err)
            // M.channel.send(this.wc._encode({
            //   recipientId: M.channel.peerId,
            //   content: super.encode({ connectedTo: { peers: [] } })
            // }))
            this.wc._joinFailed();
          });
        break;

      }
      case 'joiningPeerId': {

        this.jps.set(msg.joiningPeerId, M.channel);
        break;

      }
      case 'joinedPeerId': {
        if (this.iJoin()) {
          this.wc._joinSucceed();
          console.info(this.wc.myId + ' _joinSucceed ');
        } else {
          console.log(this.wc.myId + ' peerJoined blablabla ');
          this.peerJoined(this.jps.get(msg.joinedPeerId));
        }
        this.jps.delete(msg.joinedPeerId);
        break;

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
    console.log(this.wc.myId + ' _exchange ');
    this.p.incrementAge();
    const oldestArc = this.p.oldest;
    let cloneP = new PartialView();
    this.p.forEach( (arc) => {
      cloneP.add(arc[0], arc[1]);
    });
    cloneP.remove(oldestArc[0], oldestArc[1]);
    let sample = this._getSample(cloneP,
       Math.ceil(this.p.length/2) - 1);
    sample.add(wc.myId);
    this._replace(sample, oldestArc[0], wc.myId);

    wc._sendTo({
      senderId: wc.myId,
      recipientId: oldestArc[0],
      content: super.encode({ exchangeInit: { sample } }),
      meta: { timestamp: Date.now() }
    });

    // async/await response... with timeout
    // let respSample = await new PartialView();
    await new Promise ((resolve, reject) => {
      wc._svcMsgStream
      .filter(msg => msg.recipientId === wc.myId && msg.type == 'exchangeResp')
      .subscribe(
        msg => {
          resolve(msg.respSample);
        }, err => {
          console.error('SprayService Message Stream Error', err, wc);
          reject();
        });
        setTimeout(() => reject('Exchange response timed out'), timeout);
      })
      .then((respSample) => {
        if (Array.isArray(respSample)) {
          respSample.forEach( (arc) => {
            this.p.add(arc[0], arc[1]);
          });
        } else {
          console.error('SprayService Exchange response typeof ',typeof respSample);
        }
      })
      .catch(err => {
        console.error('Failed waiting exchange response ', err);
      });
    this._replace(sample, wc.myId, oldestArc[0]);
    // TODO disconnection
    sample.forEach( (arc) => {
      this.p.remove(arc[0], arc[1]);
    });
  }

  /**
   * Periodic procedure of exchange (passive thread)
   *
   * @param {WebChannel}  wc
   * @param {number}      origineId  peerId
   * @param {PartialView} sample
   */
  private _onExchange (wc: WebChannel, origineId: number, sample: PartialView): void {
    console.log(this.wc.myId + ' _onExchange ');
    let respSample = this._getSample(this.p,
       Math.ceil(this.p.length/2));
    this._replace(respSample, origineId, wc.myId);

    wc._sendTo({
      senderId: wc.myId,
      recipientId: origineId,
      content: super.encode({ exchangeResp: { respSample } }),
      meta: { timestamp: Date.now() }
    });

    this._replace(respSample, wc.myId, origineId);
    respSample.forEach( (arc) => {
      this.p.remove(arc[0], arc[1]);
    });
    sample.forEach( (arc) => {
      this.p.add(arc[0], arc[1]);
    });
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
    console.info(this.wc.myId + ' _getSample ');
    let cloneP = p.slice();
    let arcs = new PartialView();

    while (arcs.length < n && cloneP.length > 0) {
      let randomIndex = Math.floor(Math.random()*cloneP.length);
      let arc = cloneP.splice(randomIndex, 1)[0];
      // TODO verification peer is up
      // if peer is up
      arcs.add(arc[0],arc[1]);
      // else launch this._onPeerDown (or this._onArcDown ?)
    }

    return arcs;
  }

  /**
   * Replace a peerId in a PartialView by another
   *
   * @param {PartialView} p
   * @param {number}      oldId
   * @param {number}      newId
   */
  private _replace (p: PartialView, oldId: number, newId: number): void {
    console.info(this.wc.myId + ' _replace ' + oldId + " by " + newId);
    p.forEach( (arc) => {
      if (arc[0] == oldId) {
        arc[0] = newId;
      }
    });
  }

  /**
   * When a peer is down, we count occurences
   * and duplicate arcs in the partial view
   *
   * @param {number} peerDownId
   */
  private _onPeerDown (peerDownId: number): void {
    console.info(this.wc.myId + ' _onPeerDown ' + peerDownId);
    // Count and delete
    let occ = 0;
    let toRemove = [];
    this.p.forEach( (arc) => {
      if (arc[0] == peerDownId) {
        toRemove.push(arc);
        occ++;
      }
    });
    toRemove.forEach( (arc) => {
      this.p.remove(arc[0], arc[1]);
    });

    // Duplicate arcs
    for (let i = 0; i < occ; i++) {
      if (Math.random() > 1/(this.p.length + occ)) { // Choice here : chance of duplication decreases
        let newArcId = this.p[Math.floor(Math.random() * this.p.length)][0];
        this.p.add(newArcId);
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
    console.info(this.wc.myId + ' _onArcDown ' + peerId);
    this.p.remove(peerId, age);
    let newArcId = this.p[Math.floor(Math.random() * this.p.length)][0];
    this.p.add(newArcId);
  }

  private _clearReceived() : void {
    console.info(this.wc.myId + ' _clearReceived ');
    let clearDelay = Math.floor(Math.exp(this.p.length)) * 2 * delayPerConnection;

    let i = 0;
    while (i < this.received.length) {
      let ts = this.received[i][1];

      if (Date.now() - ts > clearDelay) {
        this.received.splice(i,1);
      } else {
        i++;
      }
    }

    setTimeout(() => this._clearReceived(), clearDelay);
  }

  peerJoined (ch: Channel): void {
    console.info(this.wc.myId + ' peerJoined ');
    this.channels.add(ch);
    this.wc._onPeerJoin(ch.peerId);
    // console.info(this.wc.myId + ' _onPeerJoin ' + ch.peerId);
  }
}

import { PartialView } from './PartialView'
import { TopologyInterface } from '../TopologyInterface'
import { ServiceMessage } from '../../Service'
import { WebChannel } from '../../WebChannel'
import { Channel } from '../../../Channel'
import { spray } from '../../../Protobuf'
import * as log from '../../../log'

/**
 * Delay in milliseconds between two exchanges
 */
const delay = 1000 * 60 * 2;

/**
 * Timeout value in milliseconds for exchanges
 */
const timeout = 1000 * 60;

export const SPRAY = 15;

export class SprayService extends TopologyInterface {
  constructor (wc: WebChannel) {
    super(SPRAY, spray.Message, wc._msgStream);
    (<any> this).wc = wc; // <any> to delete error "property 'wc' does not exist on type 'SprayService'"
    this.init();
    (<any> this).innerMessageSubscritption = this.innerStream.subscribe(
      msg => this._handleSvcMsg(msg),
      err => log.error('SprayService Message Stream Error', err, wc),
      () => {
        this.init();
      }
    );
  }

  init () {
    (<any> this).channels = new Set();
    (<any> this).joiningPeers = new Map();
    (<any> this).pendingRequests = new Map();
    (<any> this).p = new PartialView();
  }

  connectTo (peerId: number): Promise<{}> {
    return new Promise( (resolve, reject) => {
      (<any> this).wc.channelBuilderSvc.connectTo(peerId)
        .then(ch => this.onChannel(ch))
        .then(() => { resolve(); })
    });
  }

  /**
   * Add a peer to the WebChannel
   *
   * @param  {Channel}            channel
   *
   * @return {Promise<number, string>}
   */
  addJoining (channel: Channel): Promise<{}> {
    log.debug((<any> this).wc.myId + ' ADD ' + channel.peerId);
    const wc = channel.webChannel;
    const peers = [];
    for (let i = 0; i < (<any> this).p.length; i++) {
      peers.push((<any> this).p[i][0]);
    }

    if (peers.length == 0) { // Case of two peers in the network
      peers.push(wc.myId);
    }

    peers.forEach( (peer) => {
      wc._sendTo({
        senderId: wc.myId,
        recipientId: peer,
        content: super.encode({shouldAdd: {peerId: channel.peerId}})
      });
    });

    return new Promise((resolve, reject) => {
      (<any> this).pendingRequests.set(channel.peerId, {resolve, reject})
    });
  }

  initJoining (ch: object): void {
    // TODO
  }

  /**
   * Send message to all WebChannel members
   *
   * @param {ArrayBuffer} msg
   */
  send (msg: ArrayBuffer): void {
    // TODO
  }

  /**
   * Send message to a specific peer (recipientId)
   *
   * @param {ArrayBuffer} msg
   */
  sendTo (msg: ArrayBuffer): void {
    // TODO
    let peersId = [];
    (<any> this).p.forEach( (arc) => {
      peersId.push(arc[0]);
    });

    if ((<any> msg).recipientId in peersId) {
      // Send to recipientId
    } else {
      // I don't know... forwardTo...
    }
  }

  forwardTo (msg: object): void {
    // TODO
  }

  forward (msg: object): void {
    // TODO
  }

  leave (): void {
    // TODO
    for (let c of (<any> this).channels) {
      c.clearHandlers();
      c.close();
    }
    (<any> this).channels.clear();
  }

  onChannel (channel: Channel): Promise<{}> {
    // TODO
    return new Promise( (resolve, reject) => {
      return;
    });
  }

  onChannelClose (closeEvt: CloseEvent, channel: Channel): boolean {
    // TODO ?
    for (let c of (<any> this).channels) {
      if (c.peerId === channel.peerId) {
        return (<any> this).channels.delete(c);
      }
    }
    (<any> this).joiningPeers.forEach(jp => jp.channels.delete(channel));
    return false;
  }

  onChannelError (evt: Event, channel: Channel): void {
    console.error(`Channel error with id: ${channel.peerId}: `, evt);
  }

  /**
   * Executes actions depending on the message stream
   *
   * @param {ServiceMessage} M {channel, senderId, recipientId, msg}
   */
  private _handleSvcMsg (M: ServiceMessage): void {
    const wc = M.channel.webChannel;
    const msg = M.msg;
    switch ((<any> msg).type) {
      case 'shouldAdd': {
        (<any> this).p.add(super.decode(msg).peerId);
        this.connectTo(super.decode(msg).peerId)
        .then(failed => {
            log.debug((<any> this).wc.myId + ' shouldConnectTo ', failed);
          });
        setInterval( () => { this._exchange(wc); }, delay);
        break;
      } case 'exchangeInit': {
        log.debug(wc.peerId + ' exchanging with ' + wc.myId);
        this._onExchange(wc, wc.peedId, super.decode(msg).sample);
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
    (<any> this).p.incrementAge();
    const oldestArc = (<any> this).p.oldest;
    let cloneP = new PartialView();
    (<any> this).p.forEach( (arc) => {
      cloneP.add(arc[0], arc[1]);
    });
    cloneP.remove(oldestArc[0], oldestArc[1]);
    let sample = this._getSample(cloneP,
       Math.ceil((<any> this).p.length/2) - 1);
    sample.add(wc.myId);
    this._replace(sample, oldestArc[0], wc.myId);

    wc._sendTo({
      senderId: wc.myId,
      recipientId: oldestArc[0],
      content: super.encode({ exchangeInit: { sample }})
    });

    // async/await response... with timeout
    // let respSample = await new PartialView();
    await new Promise ((resolve, reject) => {
      wc._msgStream
      .filter(msg => msg.recipientId === wc.myId && msg.type == 'exchangeResp')
      .subscribe(
        msg => {
          resolve(super.decode(msg).respSample);
        }, err => {
          log.error('SprayService Message Stream Error', err, wc);
          reject();
        });
        setTimeout(() => reject('Exchange response timed out'), timeout);
      })
      .then((respSample) => {
        if (Array.isArray(respSample)) {
          respSample.forEach( (arc) => {
            (<any> this).p.add(arc[0], arc[1]);
          });
        } else {
          log.error('SprayService Exchange response typeof ',typeof respSample);
        }
      })
      .catch(err => {
        log.error('Failed waiting exchange response ', err);
      });
    this._replace(sample, wc.myId, oldestArc[0]);
    sample.forEach( (arc) => {
      (<any> this).p.remove(arc[0], arc[1]);
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
    let respSample = this._getSample((<any> this).p,
       Math.ceil((<any> this).p.length/2));
    this._replace(respSample, origineId, wc.myId);

    wc._sendTo({
      senderId: wc.myId,
      recipientId: origineId,
      content: super.encode({ exchangeResp: { respSample }})
    });

    this._replace(respSample, wc.myId, origineId);
    respSample.forEach( (arc) => {
      (<any> this).p.remove(arc[0], arc[1]);
    });
    sample.forEach( (arc) => {
      (<any> this).p.add(arc[0], arc[1]);
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
    // Count and delete
    let occ = 0;
    let toRemove = [];
    (<any> this).p.forEach( (arc) => {
      if (arc[0] == peerDownId) {
        toRemove.push(arc);
        occ++;
      }
    });
    toRemove.forEach( (arc) => {
      (<any> this).p.remove(arc[0], arc[1]);
    });

    // Duplicate arcs
    for (let i = 0; i < occ; i++) {
      if (Math.random() > 1/((<any> this).p.length + occ)) { // Choice here : chance of duplication decreases
        let newArcId = (<any> this).p[Math.floor(Math.random() * (<any> this).p.length)][0];
        (<any> this).p.add(newArcId);
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
    (<any> this).p.remove(peerId, age);
    let newArcId = (<any> this).p[Math.floor(Math.random() * (<any> this).p.length)][0];
    (<any> this).p.add(newArcId);
  }
}

import { Subject } from 'rxjs';
import { log } from '../../misc/util';
import { Service } from '../Service';
export var TopologyEnum;
(function (TopologyEnum) {
    TopologyEnum[TopologyEnum["FULL_MESH"] = 0] = "FULL_MESH";
})(TopologyEnum || (TopologyEnum = {}));
export var TopologyState;
(function (TopologyState) {
    TopologyState[TopologyState["CONSTRUCTING"] = 0] = "CONSTRUCTING";
    TopologyState[TopologyState["CONSTRUCTED"] = 1] = "CONSTRUCTED";
    TopologyState[TopologyState["IDLE"] = 2] = "IDLE";
})(TopologyState || (TopologyState = {}));
/**
 * It is responsible to preserve Web Channel
 * structure intact (i.e. all peers have the same vision of the Web Channel).
 * Among its duties are:
 *
 * - Add a new peer into Web Channel.
 * - Remove a peer from Web Channel.
 * - Send a broadcast message.
 * - Send a message to a particular peer.
 *
 * @see FullMesh
 */
export class Topology extends Service {
    constructor(wc, serviceId, proto) {
        super(serviceId, proto);
        this.wc = wc;
        this.wcStream = super.useWebChannelStream(wc);
        this.stateSubject = new Subject();
        this._state = TopologyState.IDLE;
    }
    get onState() {
        return this.stateSubject.asObservable();
    }
    get state() {
        return this._state;
    }
    setJoinedState() {
        this.setState(TopologyState.CONSTRUCTED);
    }
    setState(state) {
        if (this.state !== state) {
            log.topology(`Topology state = ${TopologyState[state]}`);
            this._state = state;
            this.stateSubject.next(state);
        }
    }
}

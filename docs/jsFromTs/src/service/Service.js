import { merge } from 'rxjs/observable/merge';
import { filter, map } from 'rxjs/operators';
/**
 * Services are specific classes. Instance of such class communicates via
 * network with another instance of the same class. Indeed each peer in the
 * network instantiates its own service.
 * Each service has `.proto` file containing the desciption of its
 * communication protocol.
 */
export class Service {
    constructor(serviceId, proto) {
        this.serviceId = serviceId;
        this.proto = proto;
    }
    useWebChannelStream(wc) {
        this.wc = wc;
        this.wcStream = {
            id: this.wc.STREAM_ID,
            message: wc.messageFromStream.pipe(filter(({ serviceId }) => serviceId === this.serviceId), map(({ channel, senderId, recipientId, content }) => ({
                channel,
                senderId,
                recipientId,
                msg: this.decode(content),
            }))),
            send: (content, id) => {
                if (content && !(content instanceof Uint8Array)) {
                    wc.sendOverStream({
                        senderId: this.wc.myId,
                        recipientId: id,
                        serviceId: this.serviceId,
                        content: this.encode(content),
                    });
                }
                else {
                    wc.sendOverStream({
                        senderId: this.wc.myId,
                        recipientId: id,
                        serviceId: this.serviceId,
                        content: content,
                    });
                }
            },
        };
    }
    useSignalingStream(sig) {
        this.sigStream = {
            id: sig.STREAM_ID,
            message: sig.messageFromStream.pipe(filter(({ serviceId }) => serviceId === this.serviceId), map(({ senderId, content }) => ({ senderId, msg: this.decode(content) }))),
            send: (content, id) => {
                if (content && !(content instanceof Uint8Array)) {
                    sig.sendOverStream({
                        recipientId: id,
                        serviceId: this.serviceId,
                        content: this.encode(content),
                    });
                }
                else {
                    sig.sendOverStream({
                        recipientId: id,
                        serviceId: this.serviceId,
                        content: content,
                    });
                }
            },
        };
        this.streams = {
            message: merge(this.wcStream.message.pipe(map(({ senderId, msg }) => ({ streamId: this.wcStream.id, senderId, msg }))), this.sigStream.message.pipe(map(({ senderId, msg }) => ({ streamId: this.sigStream.id, senderId, msg })))),
            sendOver: (streamId, msg, id) => {
                if (streamId === this.wcStream.id) {
                    this.wcStream.send(msg, id);
                }
                else {
                    this.sigStream.send(msg, id);
                }
            },
        };
    }
    /**
     * Encode service message for sending over the network.
     *
     * @param msg Service specific message object
     */
    encode(msg) {
        return this.proto.encode(this.proto.create(msg)).finish();
    }
    /**
     * Decode service message received from the network.
     *
     * @return  Service specific message object
     */
    decode(bytes) {
        return this.proto.decode(bytes);
    }
}

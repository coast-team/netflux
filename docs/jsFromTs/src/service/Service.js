import { merge } from 'rxjs';
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
        return {
            id: wc.STREAM_ID,
            message: wc.messageFromStream.pipe(filter(({ serviceId }) => serviceId === this.serviceId), map(({ channel, senderId, recipientId, content }) => ({
                channel,
                senderId,
                recipientId,
                msg: this.decode(content),
            }))),
            send: (content, id) => {
                if (content && !(content instanceof Uint8Array)) {
                    wc.sendOverStream({
                        senderId: wc.myId,
                        recipientId: id,
                        serviceId: this.serviceId,
                        content: this.encode(content),
                    });
                }
                else {
                    wc.sendOverStream({
                        senderId: wc.myId,
                        recipientId: id,
                        serviceId: this.serviceId,
                        content: content,
                    });
                }
            },
        };
    }
    useSignalingStream(sig) {
        return {
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
    }
    useAllStreams(wc, sig) {
        const wcStream = this.useWebChannelStream(wc);
        const sigStream = this.useSignalingStream(sig);
        return {
            message: merge(wcStream.message.pipe(map(({ senderId, msg }) => ({ streamId: wcStream.id, senderId, msg }))), sigStream.message.pipe(map(({ senderId, msg }) => ({ streamId: sigStream.id, senderId, msg })))),
            sendOver: (streamId, msg, id) => {
                if (streamId === wcStream.id) {
                    wcStream.send(msg, id);
                }
                else {
                    sigStream.send(msg, id);
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

import { merge } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { log } from '../misc/util';
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
            })), filter(({ msg }) => msg && msg.type)),
            send: (content, recipientId) => {
                wc.sendOverStream({
                    senderId: wc.myId,
                    recipientId,
                    serviceId: this.serviceId,
                    content: content instanceof Uint8Array ? content : this.encode(content),
                });
            },
        };
    }
    useSignalingStream(sig) {
        return {
            id: sig.STREAM_ID,
            message: sig.messageFromStream.pipe(filter(({ serviceId }) => serviceId === this.serviceId), map(({ senderId, recipientId, content }) => ({
                senderId,
                recipientId,
                msg: this.decode(content),
            })), filter(({ msg }) => msg && msg.type)),
            send: (content, recipientId, senderId) => {
                sig.sendOverStream({
                    senderId,
                    recipientId,
                    serviceId: this.serviceId,
                    content: content instanceof Uint8Array ? content : this.encode(content),
                });
            },
        };
    }
    useAllStreams(wc, sig) {
        const wcStream = this.useWebChannelStream(wc);
        const sigStream = this.useSignalingStream(sig);
        return {
            message: merge(wcStream.message.pipe(map(({ senderId, recipientId, msg }) => ({
                streamId: wcStream.id,
                senderId,
                recipientId,
                msg,
            }))), sigStream.message.pipe(map(({ senderId, recipientId, msg }) => ({
                streamId: sigStream.id,
                senderId,
                recipientId,
                msg,
            })))),
            sendOver: (streamId, msg, recipientId, senderId) => {
                if (streamId === wcStream.id) {
                    wcStream.send(msg, recipientId);
                }
                else {
                    sigStream.send(msg, recipientId, senderId);
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
        try {
            return this.proto.decode(bytes);
        }
        catch (err) {
            log.warn('Decode service message error: ', err);
        }
        return { type: undefined };
    }
}

import { filter, map } from 'rxjs/operators';
import { service } from '../proto';
/**
 * Services are specific classes. Instance of such class communicates via
 * network with another instance of the same class. Indeed each peer in the
 * network instantiates its own service.
 * Each service has `.proto` file containing the desciption of its
 * communication protocol.
 */
export class Service {
    static encodeServiceMessage(serviceId, content) {
        return service.Message.encode(service.Message.create({
            id: serviceId,
            content,
        })).finish();
    }
    constructor(id, protoMessage, serviceMessageSubject) {
        this.serviceId = id;
        this.protoMessage = protoMessage;
        if (serviceMessageSubject !== undefined) {
            this.setupServiceMessage(serviceMessageSubject);
        }
    }
    /**
     * Encode service message for sending over the network.
     *
     * @param msg Service specific message object
     */
    encode(msg) {
        return service.Message.encode(service.Message.create({
            id: this.serviceId,
            content: this.protoMessage.encode(this.protoMessage.create(msg)).finish(),
        })).finish();
    }
    /**
     * Decode service message received from the network.
     *
     * @return  Service specific message object
     */
    decode(bytes) {
        return this.protoMessage.decode(bytes);
    }
    setupServiceMessage(serviceMessageSubject) {
        this.onServiceMessage = serviceMessageSubject.pipe(filter(({ id }) => id === this.serviceId), map(({ channel, senderId, recipientId, content }) => ({
            channel,
            senderId,
            recipientId,
            msg: this.protoMessage.decode(content),
        })));
    }
}

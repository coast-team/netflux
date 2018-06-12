import { ConnectionError } from './ConnectionError';
export class ConnectionsInProgress {
    constructor(wcStreamId) {
        this.wcStreamId = wcStreamId;
        this.wcStream = new Map();
        this.sigStream = new Map();
    }
    create(streamId, id, connectionTimeout, responseTimeout, onConnectionTimeoutCallback) {
        const connections = this.getByStreamId(streamId);
        const connection = {};
        connection.promise = new Promise((resolveResponse, rejectResponse) => {
            const responseTimer = setTimeout(() => connection.reject(new Error(ConnectionError.RESPONSE_TIMEOUT)), responseTimeout);
            connection.resolve = () => {
                clearTimeout(responseTimer);
                resolveResponse();
                connection.promise = new Promise((resolveConnection, rejectConnection) => {
                    const connectionTimer = setTimeout(() => {
                        onConnectionTimeoutCallback();
                        connection.reject(new Error(ConnectionError.CONNECTION_TIMEOUT));
                    }, connectionTimeout);
                    connection.resolve = () => {
                        clearTimeout(connectionTimer);
                        connections.delete(id);
                        resolveConnection();
                    };
                    connection.reject = (err) => {
                        // This is necessary for some scenarios in order to rid of UnhandledPromiseRejectionWarning errors in NodeJS and similar errors/warnings in browsers
                        connection.promise.catch(() => { });
                        clearTimeout(connectionTimer);
                        connections.delete(id);
                        rejectConnection(err);
                    };
                });
            };
            connection.reject = (err) => {
                // This is necessary for some scenarios in order to rid of UnhandledPromiseRejectionWarning errors in NodeJS and similar errors/warnings in browsers
                connection.promise.catch(() => { });
                clearTimeout(responseTimer);
                connections.delete(id);
                rejectResponse(err);
            };
            connections.set(id, connection);
        });
        return connection;
    }
    get(streamId, id) {
        return this.getByStreamId(streamId).get(id);
    }
    has(streamId, id) {
        return this.getByStreamId(streamId).has(id);
    }
    clean() {
        this.cleanAll(this.wcStream);
        this.cleanAll(this.sigStream);
    }
    cleanAll(connections) {
        connections.forEach((c) => c.reject(new Error(ConnectionError.CLEAN)));
        connections.clear();
    }
    getByStreamId(streamId) {
        return streamId === this.wcStreamId ? this.wcStream : this.sigStream;
    }
}

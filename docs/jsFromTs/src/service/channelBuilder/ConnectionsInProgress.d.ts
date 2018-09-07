export interface IConnectionInProgress {
    promise: Promise<void>;
    resolve: () => void;
    reject: (err: Error) => void;
}
export declare class ConnectionsInProgress {
    private connections;
    constructor();
    create(id: number, connectionTimeout: number, responseTimeout: number, onConnectionTimeoutCallback: () => void): IConnectionInProgress;
    get(id: number): IConnectionInProgress | undefined;
    has(streamId: number, id: number): boolean;
    clean(): void;
}

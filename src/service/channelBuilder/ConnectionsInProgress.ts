import { ConnectionError } from './ConnectionError'

export interface IConnectionInProgress {
  promise: Promise<void>
  resolve: () => void
  reject: (err: Error) => void
}

export class ConnectionsInProgress {
  private wcStream: Map<number, IConnectionInProgress>
  private sigStream: Map<number, IConnectionInProgress>
  private wcStreamId: number

  constructor(wcStreamId: number) {
    this.wcStreamId = wcStreamId
    this.wcStream = new Map()
    this.sigStream = new Map()
  }

  create(
    streamId: number,
    id: number,
    connectionTimeout: number,
    responseTimeout: number
  ): IConnectionInProgress {
    const connections = this.getByStreamId(streamId)
    const connection = {} as IConnectionInProgress
    connection.promise = new Promise((resolveResponse, rejectResponse) => {
      const responseTimer = setTimeout(
        () => connection.reject(new Error(ConnectionError.RESPONSE_TIMEOUT)),
        responseTimeout
      )

      connection.resolve = () => {
        clearTimeout(responseTimer)
        resolveResponse()
        connection.promise = new Promise((resolveConnection, rejectConnection) => {
          const connectionTimer = setTimeout(
            () => connection.reject(new Error(ConnectionError.CONNECTION_TIMEOUT)),
            connectionTimeout
          )

          connection.resolve = () => {
            clearTimeout(connectionTimer)
            connections.delete(id)
            resolveConnection()
          }
          connection.reject = (err) => {
            // This is necessary for some scenarios in order to rid of UnhandledPromiseRejectionWarning errors in NodeJS and similar errors/warnings in browsers
            connection.promise.catch(() => {})
            clearTimeout(connectionTimer)
            connections.delete(id)
            rejectConnection(err)
          }
        })
      }
      connection.reject = (err) => {
        // This is necessary for some scenarios in order to rid of UnhandledPromiseRejectionWarning errors in NodeJS and similar errors/warnings in browsers
        connection.promise.catch(() => {})
        clearTimeout(responseTimer)
        connections.delete(id)
        rejectResponse(err)
      }
      connections.set(id, connection)
    })
    return connection
  }

  get(streamId: number, id: number): IConnectionInProgress | undefined {
    return this.getByStreamId(streamId).get(id)
  }

  has(streamId: number, id: number) {
    return this.getByStreamId(streamId).has(id)
  }

  clean() {
    this.cleanAll(this.wcStream)
    this.cleanAll(this.sigStream)
  }

  private cleanAll(connections: Map<number, IConnectionInProgress>) {
    connections.forEach((c) => c.reject(new Error(ConnectionError.CLEAN)))
    connections.clear()
  }

  private getByStreamId(streamId: number): Map<number, IConnectionInProgress> {
    return streamId === this.wcStreamId ? this.wcStream : this.sigStream
  }
}

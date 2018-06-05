export interface IPendingRequest {
  promise: Promise<void>
  resolve: () => void
  reject: (err: Error) => void
}

export class PendingRequests {
  private wcReqs: Map<number, IPendingRequest>
  private sigReqs: Map<number, IPendingRequest>
  private wcStreamId: number

  constructor(wcStreamId: number) {
    this.wcStreamId = wcStreamId
    this.wcReqs = new Map()
    this.sigReqs = new Map()
  }

  create(
    streamId: number,
    id: number,
    connectionTimeout: number,
    responseTimeout: number
  ): IPendingRequest {
    const reqs = this.getReqsByStreamId(streamId)
    return this.addRequest(reqs, id, connectionTimeout, responseTimeout)
  }

  get(streamId: number, id: number): IPendingRequest | undefined {
    return this.getReqsByStreamId(streamId).get(id)
  }

  has(streamId: number, id: number) {
    return this.getReqsByStreamId(streamId).has(id)
  }

  clean() {
    this.cleanAll(this.wcReqs)
    this.cleanAll(this.sigReqs)
  }

  private cleanAll(requests: Map<number, IPendingRequest>) {
    requests.forEach((req) => req.reject(new Error('clean')))
    requests.clear()
  }

  private getReqsByStreamId(streamId: number): Map<number, IPendingRequest> {
    return streamId === this.wcStreamId ? this.wcReqs : this.sigReqs
  }

  private addRequest(
    requests: Map<number, IPendingRequest>,
    id: number,
    connectionTimeout: number,
    responseTimeout: number
  ): IPendingRequest {
    const req = {} as IPendingRequest
    req.promise = new Promise((resolveResponse, rejectResponse) => {
      const responseTimer = setTimeout(
        () => req.reject(new Error('response_timeout')),
        responseTimeout
      )

      req.resolve = () => {
        clearTimeout(responseTimer)
        resolveResponse()
        req.promise = new Promise((resolveConnection, rejectConnection) => {
          const connectionTimer = setTimeout(
            () => req.reject(new Error('connection_timeout')),
            connectionTimeout
          )

          req.resolve = () => {
            clearTimeout(connectionTimer)
            requests.delete(id)
            resolveConnection()
          }
          req.reject = (err) => {
            // This is necessary for some scenarios in order to rid of UnhandledPromiseRejectionWarning errors in NodeJS and similar errors/warnings in browsers
            req.promise.catch(() => {})
            clearTimeout(connectionTimer)
            requests.delete(id)
            rejectConnection(err)
          }
        })
      }
      req.reject = (err) => {
        // This is necessary for some scenarios in order to rid of UnhandledPromiseRejectionWarning errors in NodeJS and similar errors/warnings in browsers
        req.promise.catch(() => {})
        clearTimeout(responseTimer)
        requests.delete(id)
        rejectResponse(err)
      }
      requests.set(id, req)
    })
    return req
  }
}

export interface IPendingRequest {
  created: number
  promise: Promise<void> | undefined
  resolve: () => void
  reject: (err: Error) => void
}

interface IStreamRequests {
  connectReqs: Map<number, IPendingRequest>
  pingReqs: Map<number, IPendingRequest>
}

export class PendingRequests {
  private wcReqs: IStreamRequests
  private sigReqs: IStreamRequests
  private wcStreamId: number

  constructor(wcStreamId: number) {
    this.wcStreamId = wcStreamId
    this.wcReqs = {
      connectReqs: new Map(),
      pingReqs: new Map(),
    }
    this.sigReqs = {
      connectReqs: new Map(),
      pingReqs: new Map(),
    }
  }

  add(streamId: number, id: number, timeout: number): IPendingRequest {
    const reqs = this.getReqsByStreamId(streamId)
    return this.addRequest(reqs.connectReqs, id, timeout)
  }

  addPing(streamId: number, id: number, timeout: number): IPendingRequest {
    const reqs = this.getReqsByStreamId(streamId)
    return this.addRequest(reqs.pingReqs, id, timeout)
  }

  get(streamId: number, id: number): IPendingRequest | undefined {
    const req = this.getReqsByStreamId(streamId).connectReqs.get(id)
    return req && req.promise ? req : undefined
  }

  getPing(streamId: number, id: number): IPendingRequest | undefined {
    const req = this.getReqsByStreamId(streamId).pingReqs.get(id)
    return req && req.promise ? req : undefined
  }

  getCreatedDate(streamId: number, id: number): number | undefined {
    const req = this.getReqsByStreamId(streamId).pingReqs.get(id)
    return req ? req.created : undefined
  }

  clean() {
    this.cleanAll(this.wcReqs.connectReqs)
    this.cleanAll(this.wcReqs.pingReqs)
    this.cleanAll(this.sigReqs.connectReqs)
    this.cleanAll(this.sigReqs.pingReqs)
  }

  private cleanAll(requests: Map<number, IPendingRequest>) {
    requests.forEach((req) => req.reject(new Error('clean')))
    requests.clear()
  }

  private getReqsByStreamId(streamId: number): IStreamRequests {
    return streamId === this.wcStreamId ? this.wcReqs : this.sigReqs
  }

  private addRequest(
    requests: Map<number, IPendingRequest>,
    id: number,
    timeout: number
  ): IPendingRequest {
    const req = { created: Date.now() } as IPendingRequest
    req.promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => req.reject(new Error(`Request ${timeout}ms timeout`)), timeout)
      const clean = () => {
        clearTimeout(timer)
        req.promise = undefined
      }

      req.resolve = () => {
        clean()
        resolve()
      }
      req.reject = (err) => {
        if (req.promise) {
          // This is necessary for some scenarios in order rid of UnhandledPromiseRejectionWarning errors in NodeJS and similar errors/warnings in browsers
          req.promise.catch(() => {})
        }
        clean()
        reject(err)
      }
      requests.set(id, req)
    })
    return req
  }
}

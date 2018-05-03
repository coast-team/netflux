import { log } from '../../misc/Util'

export interface IPendingRequest {
  date: number
  promise: Promise<void>
  resolve: () => void
  reject: (err: Error) => void
}

export class PendingRequests {
  private requests: Map<number, IPendingRequest>
  private timeoutDates: Map<number, number>

  constructor() {
    this.requests = new Map()
    this.timeoutDates = new Map()
  }

  add(id: number, timeout: number): IPendingRequest {
    const req = { date: global.Date.now() } as IPendingRequest

    req.promise = new Promise((resolve, reject) => {
      // Set request Timeout
      const timer = setTimeout(() => {
        this.requests.delete(id)
        this.timeoutDates.set(id, req.date)
        log.channelBuilder('Timer EXECUTED for ' + id, timer)
        reject(new Error(`Request ${timeout}ms timeout`))
      }, timeout)
      log.channelBuilder('Timer SET for ' + id, timer)

      const beforeFullfilled = () => {
        clearTimeout(timer)
        this.requests.delete(id)
      }

      // Add resolve and reject attrebutes
      req.resolve = () => {
        beforeFullfilled()
        resolve()
      }
      req.reject = (err) => {
        beforeFullfilled()
        reject(err)
      }
      this.requests.set(id, req)
    })
    log.channelBuilder('Pending Request: ', req)
    return req
  }

  get(id: number): IPendingRequest | undefined {
    return this.requests.get(id)
  }

  getTimeoutDate(id: number) {
    return this.timeoutDates.get(id)
  }

  clean() {
    this.requests.forEach((req) => req.reject(new Error('clean')))
    this.requests.clear()
    this.timeoutDates.clear()
  }
}

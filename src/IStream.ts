import { Observable } from 'rxjs/Observable'

export interface IStream<OutMsg, InMsg> {
  readonly STREAM_ID: number
  messageFromStream: Observable<InMsg>
  sendOverStream: (msg: OutMsg, id?: number) => void
}

/**
 * @external JSON
 * @see {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON}
 */
/**
 * @external Error
 * @see {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Error}
 */

import WebChannel from './WebChannel'
import * as service from './serviceProvider'

const WEBRTC = service.WEBRTC
const FULLY_CONNECTED = service.FULLY_CONNECTED

export { WEBRTC, FULLY_CONNECTED, WebChannel }
export * from '../node_modules/webrtc-adapter/out/adapter_no_edge_no_global'

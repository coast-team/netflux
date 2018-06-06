export enum ConnectionError {
  RESPONSE_TIMEOUT = 'Response timeout: remote peer is not responding',
  CONNECTION_TIMEOUT = 'Connection timeout: unable to establish a channel within a specified time',
  DENIED = 'Connection denied: remote peer refused the connection request',
  CLEAN = 'Clean: all connections in progress must be stopped',
  IN_PROGRESS = 'Connection setup is already in progress',
  NEGOTIATION_ERROR = 'All connection possibilities have been tried and none of them worked',
}

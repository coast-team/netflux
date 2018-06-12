export var ConnectionError;
(function (ConnectionError) {
    ConnectionError["RESPONSE_TIMEOUT"] = "Response timeout: remote peer is not responding";
    ConnectionError["CONNECTION_TIMEOUT"] = "Connection timeout: unable to establish a channel within a specified time";
    ConnectionError["DENIED"] = "Connection denied: remote peer refused the connection request";
    ConnectionError["CLEAN"] = "Clean: all connections in progress must be stopped";
    ConnectionError["IN_PROGRESS"] = "Connection setup is already in progress";
    ConnectionError["NEGOTIATION_ERROR"] = "All connection possibilities have been tried and none of them worked";
})(ConnectionError || (ConnectionError = {}));

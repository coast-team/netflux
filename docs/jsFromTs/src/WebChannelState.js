export var WebChannelState;
(function (WebChannelState) {
    WebChannelState[WebChannelState["JOINING"] = 0] = "JOINING";
    WebChannelState[WebChannelState["JOINED"] = 1] = "JOINED";
    WebChannelState[WebChannelState["LEAVING"] = 2] = "LEAVING";
    WebChannelState[WebChannelState["LEFT"] = 3] = "LEFT";
})(WebChannelState || (WebChannelState = {}));

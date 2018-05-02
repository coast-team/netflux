export var TopologyEnum;
(function (TopologyEnum) {
    TopologyEnum[TopologyEnum["FULL_MESH"] = 0] = "FULL_MESH";
})(TopologyEnum || (TopologyEnum = {}));
export var TopologyState;
(function (TopologyState) {
    TopologyState[TopologyState["JOINING"] = 0] = "JOINING";
    TopologyState[TopologyState["JOINED"] = 1] = "JOINED";
    TopologyState[TopologyState["DISCONNECTING"] = 2] = "DISCONNECTING";
    TopologyState[TopologyState["DISCONNECTED"] = 3] = "DISCONNECTED";
})(TopologyState || (TopologyState = {}));

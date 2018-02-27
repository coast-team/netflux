export var TopologyEnum;
(function (TopologyEnum) {
    TopologyEnum[TopologyEnum["FULL_MESH"] = 0] = "FULL_MESH";
})(TopologyEnum || (TopologyEnum = {}));
export var TopologyStateEnum;
(function (TopologyStateEnum) {
    TopologyStateEnum[TopologyStateEnum["JOINING"] = 0] = "JOINING";
    TopologyStateEnum[TopologyStateEnum["JOINED"] = 1] = "JOINED";
    TopologyStateEnum[TopologyStateEnum["STABLE"] = 2] = "STABLE";
    TopologyStateEnum[TopologyStateEnum["DISCONNECTING"] = 3] = "DISCONNECTING";
    TopologyStateEnum[TopologyStateEnum["DISCONNECTED"] = 4] = "DISCONNECTED";
})(TopologyStateEnum || (TopologyStateEnum = {}));

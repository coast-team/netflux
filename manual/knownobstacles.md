# Known WebRTC obstacles

Connection establishment over WebRTC may ancounter different obstacles like NAT, Firewall, port blocking. But besides network obstacles there is also browser configuration that may prevent from connection creation.

## Firefox extensions

Some extensions for Firefox (Privacy Badger for instance) modify WebRTC configuration in browser. Checkout `about:config` and look for `peerconnection.ice`. If the _Status_ column is _default_ then the parameter was not modified.

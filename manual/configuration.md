# Configuration
You can rewrite each of the following settings.

When using [`netflux.create(settings)`](https://doc.esdoc.org/github.com/coast-team/netflux/function/index.html#static-function-create) function, the default `settings` are:

```javascript
{
  connector: WEB_RTC,
  topology: FULLY_CONNECTED,
  signalingURL: 'wss://sigver-coastteam.rhcloud.com:8443'
  iceServers: [
    {urls:'stun:turn01.uswest.xirsys.com'}
  ]
}
```

For [`new BotServer(settings)`](https://doc.esdoc.org/github.com/coast-team/netflux/class/src/BotServer.js~BotServer.html#instance-constructor-constructor) the default `settings` are:

```javascript
{
  connector: WEB_SOCKET,
  topology: FULLY_CONNECTED,
  signalingURL: 'wss://sigver-coastteam.rhcloud.com:8443'
  iceServers: [
    {urls:'stun:turn01.uswest.xirsys.com'}
  ],
  host: 'localhost',
  port: 9000
}
```

Documentation for the settings may be found [here](https://doc.esdoc.org/github.com/coast-team/netflux/typedef/index.html#static-typedef-WebChannelSettings).

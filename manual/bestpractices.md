# Best practices

The behavior of Chrome and Firefox on Linux/MacOS (likely on Windows also, but not tested) concerning holding JS execution, [Online/Offline](https://developer.mozilla.org/en/docs/Online_and_offline_events) and [Page Visibility](https://developer.mozilla.org/en/docs/Web/API/Page_Visibility_API) APIs maybe different when OS goes into sleep mode and resumes from it. That why the practices listed here might be useful for these scenarios and not only.

## Leave WebGroup before Browser/Tab close

Clean leave is always preferable. Other members will be notified immediately.

```Javascript
// "webGroup" variable has been defined earlier.
window.addEventListener('beforeunload', () => {
    webGroup.leave()
})
```

## Listen on Online/Offline events

Maybe useful to not rejoin a web group if the client is offline anyway. Checkout [Online/Offline API doc](https://developer.mozilla.org/en/docs/Online_and_offline_events) for more details and to understand what _Online_ actually means.

```Javascript
// "webGroup" variable has been defined earlier.

window.addEventListener('offline', () => {
    // You are offline, then leave the web group
    webGroup.leave()
})
window.addEventListener('online', () => {
    // You are online again, try to rejoin if necessary.
    webGroup.join()
})
```

**Remark**: It was noticed for Chrome browser on some operating systems that when the OS resumes from a sleep mode, the _Offline_/_Online_ events fired twice in a very short period of time, this may cause a problem for Netflux to rejoin, so consider to do something like:

```Javascript
// "webGroup" variable has been defined earlier.

let timer
window.addEventListener('online', () => {
  if (timer !== undefined) {
    timer = setTimeout(() => {
      webGroup.join()
      timer = undefined
    }, 500)
  }
})
```

## Page Visibility API might be useful in some scenarios

It was noticed that when MacOS goes into sleep mode, Chrome and Firefox do not stop JS execution, but close WebRTC connections and do not allow to create new. However the WebSocket connection is maintained. This cause problem as you are no longer connected to other peers, but the connection with Signaling server is still alive. For this reason it might be useful to do something like (checkout [Page Visibility API doc](https://developer.mozilla.org/en/docs/Web/API/Page_Visibility_API)):

```Javascript
// "webGroup" variable has been defined earlier.

webGroup.onMemberLeave = () => {
  if (webGroup.members.length === 0 && window.document.visibilityState === 'hidden') {
    webGroup.leave()
  }
}

window.addEventListener('visibilitychange', () => {
  if (window.navigator.onLine &&
      window.document.visibilityState === 'visible' &&
      webGroup.state === WebGroupState.LEFT
  ) {
    webGroup.join()
  }
})
```

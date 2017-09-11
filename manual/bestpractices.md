# Best practices
## Leave WebGroup before Browser/Tab close
Clean leave is always preferable. Other members will be notified immediately.
```Javascript
window.addEventListener('beforeunload', () => {
  if (webGroup !== undefined) {
    webGroup.leave()
  }
})
```

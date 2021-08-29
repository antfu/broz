const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('api', {
  moveWindow: (x, y) => ipcRenderer.send('broz-move', { xN: x, yN: y }),
  setPosition: () => ipcRenderer.send('broz-set-position'),
  back: () => ipcRenderer.send('broz-back'),
  forward: () => ipcRenderer.send('broz-forward'),
  loadUrl: url => ipcRenderer.send('broz-load-url', url),
  toggleKiosk: () => ipcRenderer.send('broz-toggle-kiosk'),
})

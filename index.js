const { app, BrowserWindow } = require('electron')

let mainWindow = null

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    show: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
  })

  // injecting a dragable area
  mainWindow.webContents.on('dom-ready', function (e) {
    mainWindow.webContents.executeJavaScript(`;(() => {
const el = document.createElement('div')
el.id = 'inject-zero-drag'
const style = document.createElement('style')
style.innerHTML="#inject-zero-drag{position:fixed;left:10px;top:10px;width:40px;height:40px;border-radius:50%;cursor:grab;-webkit-app-region:drag;z-index:99999999;}#inject-zero-drag:hover{background:#8885;}"
document.body.appendChild(el)
document.body.appendChild(style)
})()`)
  })

  await mainWindow.loadURL(process.argv[2] || 'https://github.com/antfu/zero')
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => app.quit())

app
  .whenReady()
  .then(createWindow)
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

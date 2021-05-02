const { app, BrowserWindow } = require('electron')
const createState = require('electron-window-state')

let win = null

const createWindow = async () => {
  const state = createState({
    defaultWidth: 600,
    defaultHeight: 400,
  })

  win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    show: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
  })

  state.manage(win)

  // injecting a dragable area
  win.webContents.on('dom-ready', () => {
    win.webContents.executeJavaScript(`;(() => {
const el = document.createElement('div')
el.id = 'injected-broz-drag'
const style = document.createElement('style')
style.innerHTML="#injected-broz-drag{position:fixed;left:10px;top:10px;width:40px;height:40px;border-radius:50%;cursor:grab;-webkit-app-region:drag;z-index:99999999;}#injected-broz-drag:hover{background:#8885;}"
document.body.appendChild(el)
document.body.appendChild(style)
})()`)
  })

  let url = process.argv[2] || 'https://github.com/antfu/broz#readme'
  if (!url.includes('://')) {
    url = 'http://' + url
  }

  await win.loadURL(url)
}

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
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

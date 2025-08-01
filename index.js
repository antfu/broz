// @ts-check
const process = require('node:process')
const { cac } = require('cac')
const { clipboard, shell, app, BrowserWindow, Menu, MenuItem } = require('electron')
const createState = require('electron-window-state')

let main = null

const cli = cac('broz')

cli
  .command('[url]', 'launch broz')
  .option('top', 'set window always on top')
  .option('height <height>', 'set initial window height')
  .option('width <width>', 'set initial window width')
  .option('frame', 'set window has a frame')
  .action(async (url, options) => {
    const args = {
      url: url || 'https://github.com/antfu/broz#readme',
      top: options.top || false,
      height: options.height ? Number(options.height) : undefined,
      width: options.width ? Number(options.width) : undefined,
      frame: options.frame || false,
    }

    app.setName('Broz')
    app.on('window-all-closed', () => app.quit())

    try {
      await app.whenReady()
      main = createMainWindow(args)

      await main.loadURL(
        args.url.includes('://')
          ? args.url
          : `http://${args.url}`,
      )
    }
    catch (e) {
      console.error(e)
      process.exit(1)
    }
  })

cli.help()
cli.parse()

const windowSizes = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 960, height: 540 },
  { width: 640, height: 360 },
  { width: 1000, height: 1000 },
  { width: 500, height: 500 },
]

function createMainWindow(args) {
  const state = createState({
    defaultWidth: 960,
    defaultHeight: 540,
  })

  const main = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: args.width ?? state.width,
    height: args.height ?? state.height,
    show: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
    frame: args.frame,
  })

  state.manage(main)
  const debouncedSaveWindowState = debounce(
    event => state.saveState(event.sender),
    500,
  )

  main.on('resize', debouncedSaveWindowState)
  main.on('move', debouncedSaveWindowState)

  const menu = Menu.getApplicationMenu()
  // @ts-ignore
  menu.insert(1, new MenuItem({
    label: 'Broz',
    submenu: [
      {
        label: 'Copy URL',
        click: () => {
          const win = BrowserWindow.getFocusedWindow() || main
          clipboard.writeText(win.webContents.getURL())
        },
      },
      {
        label: 'Open in System Browser',
        click: () => {
          const win = BrowserWindow.getFocusedWindow() || main
          shell.openExternal(win.webContents.getURL())
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Resize',
        submenu: windowSizes.map(({ width, height }) => ({

          label: `${width} x ${height} (${getRatio(width, height)})`,
          click: () => {
            const win = BrowserWindow.getFocusedWindow() || main
            win.setSize(width, height, true)
            state.saveState(win)
          },
        })),
      },
      {
        label: 'Flip Size',
        click: () => {
          const win = BrowserWindow.getFocusedWindow() || main
          const [width, height] = win.getSize()
          main.setSize(height, width)
          state.saveState(win)
        },
      },
      {
        label: 'Center Window',
        click: () => {
          const win = BrowserWindow.getFocusedWindow() || main
          main.center()
          state.saveState(win)
        },
      },
    ],
  }))
  Menu.setApplicationMenu(menu)

  configureWindow(main, args)

  return main
}

/**
 * @param {BrowserWindow} win
 */
function configureWindow(win, args) {
  // injecting a dragable area
  win.webContents.on('dom-ready', () => {
    win.webContents.executeJavaScript(`;(() => {
const el = document.createElement('div')
el.id = 'injected-broz-drag'
const style = document.createElement('style')
style.innerHTML="#injected-broz-drag{position:fixed;left:10px;top:10px;width:40px;height:40px;border-radius:50%;cursor:grab;-webkit-app-region:drag;z-index:2147483647;}#injected-broz-drag:hover{background:#8885;}"
document.body.appendChild(el)
document.body.appendChild(style)

const rootStyle = document.createElement('style')
rootStyle.innerHTML="::-webkit-scrollbar {display: none;}"
document.head.appendChild(rootStyle)

})()`)
  })

  win.webContents.setWindowOpenHandler(() => {
    const [x, y] = win.getPosition()
    const [width, height] = win.getSize()
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        x: x + 50,
        y: y + 50,
        width,
        height,
      },
    }
  })

  win.webContents.on('before-input-event', (event, input) => {
    if (input.control || input.meta) {
      if (input.key === ']') {
        win.webContents.goForward()
        event.preventDefault()
      }
      else if (input.key === '[') {
        win.webContents.goBack()
        event.preventDefault()
      }
      else if (input.key === '-') {
        win.webContents.emit('zoom-changed', event, 'out')
        event.preventDefault()
      }
      else if (input.key === '=') {
        win.webContents.emit('zoom-changed', event, 'in')
        event.preventDefault()
      }
    }
  })

  win.webContents.on('did-create-window', (win) => {
    configureWindow(win, args)
  })

  win.webContents.on('zoom-changed', (event, zoomDirection) => {
    const currentZoom = win.webContents.getZoomFactor()
    if (zoomDirection === 'in')
      win.webContents.zoomFactor = currentZoom + 0.15

    if (zoomDirection === 'out')
      win.webContents.zoomFactor = currentZoom - 0.15
  })

  if (args.top)
    win.setAlwaysOnTop(true, 'floating')

  return win
}

function debounce(fn, delay) {
  let timeoutID = null
  return function (...args) {
    clearTimeout(timeoutID)
    timeoutID = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

function getRatio(width, height) {
  const gcd = (a, b) => b ? gcd(b, a % b) : a
  const r = gcd(width, height)
  return `${width / r}:${height / r}`
}

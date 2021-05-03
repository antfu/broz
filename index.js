// @ts-check

const { platform } = require('os')
const { app, BrowserWindow } = require('electron')
const createState = require('electron-window-state')
const yargs = require('yargs')

let main = null

yargs
  .scriptName('broz')
  .usage('$0 [url]')
  .showHelpOnFail(false)
  .alias('h', 'help')
  .alias('v', 'version')
  .command(
    '* [url]',
    'launch broz',
    args => args
      .positional('url', {
        type: 'string',
        default: 'https://github.com/antfu/broz#readme',
        desc: 'launch broz with url, the http:// protocol can be omitted',
      })
      .option('top', {
        type: 'boolean',
        default: false,
        desc: 'set window always on top',
      }),
    async(args) => {
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
    },
  )
  .help()
  .parse()

function createMainWindow(args) {
  const state = createState({
    defaultWidth: 960,
    defaultHeight: 540,
  })

  // windows frameless workaround
  // https://www.electronjs.org/docs/api/frameless-window#create-a-frameless-window
  const frameless = platform() === 'win32'

  const main = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    show: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
    frame: !frameless,
  })

  state.manage(main)
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
style.innerHTML="#injected-broz-drag{position:fixed;left:10px;top:10px;width:40px;height:40px;border-radius:50%;cursor:grab;-webkit-app-region:drag;z-index:99999999;}#injected-broz-drag:hover{background:#8885;}"
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
      if (input.key.toLowerCase() === ']') {
        win.webContents.goForward()
        event.preventDefault()
      }
      else if (input.key.toLowerCase() === '[') {
        win.webContents.goBack()
        event.preventDefault()
      }
    }
  })

  win.webContents.on('did-create-window', (win) => {
    configureWindow(win, args)
  })

  if (args.top)
    win.setAlwaysOnTop(true, 'floating')

  return win
}

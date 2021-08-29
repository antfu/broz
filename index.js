// @ts-check
const path = require('path')
const { app, BrowserWindow, ipcMain } = require('electron')
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
    args =>
      args
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

        await main.loadURL(args.url.includes('://') ? args.url : `http://${args.url}`)

        let [w, h] = main.getSize()

        main.on('resized', () => {
          [w, h] = main.getSize()
        })

        // main.webContents.openDevTools()
        ipcMain.on('broz-move', (event, data) => {
          main.setBounds({
            width: w,
            height: h,
            x: data.xN,
            y: data.yN,
          })
        })

        ipcMain.on('broz-back', (event) => {
          main.webContents.goBack()
        })

        ipcMain.on('broz-forward', (event) => {
          main.webContents.goForward()
        })

        ipcMain.on('broz-load-url', async(event, url) => {
          await main.loadURL(url.includes('://') ? url : `http://${url}`)
        })
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

  const main = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    show: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
    frame: false,
    webPreferences: {
      preload: path.resolve(app.getAppPath(), 'preload.js'),
    },
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
      const brozElementStyle = document.createElement('style')
      brozElementStyle.innerHTML = \`::-webkit-scrollbar{display: none;}*,::before,::after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}*{--tw-ring-inset:var(--tw-empty,/*!*/ /*!*/);--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59, 130, 246, 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}:-moz-focusring{outline:1px dotted ButtonText}:-moz-ui-invalid{box-shadow:none}::moz-focus-inner{border-style:none;padding:0}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}[type='search']{-webkit-appearance:textfield;outline-offset:-2px}abbr[title]{-webkit-text-decoration:underline dotted;text-decoration:underline dotted}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";line-height:1.5}input{font-family:inherit;font-size:100%;line-height:1.15;margin:0;padding:0;line-height:inherit;color:inherit}input::placeholder{opacity:1;color:#9ca3af}input::webkit-input-placeholder{opacity:1;color:#9ca3af}input::-moz-placeholder{opacity:1;color:#9ca3af}input:-ms-input-placeholder{opacity:1;color:#9ca3af}input::-ms-input-placeholder{opacity:1;color:#9ca3af}svg{display:block;vertical-align:middle}.bg-light-900{--tw-bg-opacity:1;background-color:rgba(221, 225, 227, var(--tw-bg-opacity))}.bg-light-100{--tw-bg-opacity:1;background-color:rgba(252, 252, 252, var(--tw-bg-opacity))}.hover:bg-light-500:hover{--tw-bg-opacity:1;background-color:rgba(242, 242, 242, var(--tw-bg-opacity))}.rounded{border-radius:0.25rem}.cursor-pointer{cursor:pointer}.flex{display:-webkit-box;display:-ms-flexbox;display:-webkit-flex;display:flex}.flex-row{-webkit-box-orient:horizontal;-webkit-box-direction:normal;-ms-flex-direction:row;-webkit-flex-direction:row;flex-direction:row}.items-center{-webkit-box-align:center;-ms-flex-align:center;-webkit-align-items:center;align-items:center}.h-12{height:3rem}.h-10{height:2.5rem}.mx-2{margin-left:0.5rem;margin-right:0.5rem}.mt-2{margin-top:0.5rem}.p-2{padding:0.5rem}.w-10{width:2.5rem}.gap-2{grid-gap:0.5rem;gap:0.5rem}#broz-bar{z-index: 999999;position:fixed;top:0px;left:0px;opacity:0;}#broz-bar:hover{opacity:1;}\`
      document.head.appendChild(brozElementStyle)
      
      const brozElement = document.createElement('div')
      brozElement.id = 'broz-bar'
      brozElement.className = 'rounded flex flex-row bg-light-900 h-12 mx-2 mt-2 p-2 gap-2 items-center cursor-pointer'
      brozElement.insertAdjacentHTML('afterbegin', '<div id="broz-move" class="rounded bg-light-100 h-10 p-2 w-10 hover:bg-light-500"> <svg viewBox="0 0 32 32"> <path d="M29 15h-2a11 11 0 0 0-22 0H3a13 13 0 0 1 26 0z" fill="currentColor"></path> <path d="M25 28h-2V15a7 7 0 1 0-14 0v13H7V15a9 9 0 0 1 18 0z" fill="currentColor"></path> <path d="M21 20H11v-5a5 5 0 0 1 10 0zm-8-2h6v-3a3 3 0 0 0-6 0z" fill="currentColor" ></path> </svg> </div><div id="broz-back" class="rounded bg-light-100 h-10 p-2 w-10 hover:bg-light-500"> <svg viewBox="0 0 32 32"> <path d="M10 16L20 6l1.4 1.4l-8.6 8.6l8.6 8.6L20 26z" fill="currentColor"></path> </svg> </div><div id="broz-forward" class="rounded bg-light-100 h-10 p-2 w-10 hover:bg-light-500"> <svg viewBox="0 0 32 32"> <path d="M22 16L12 26l-1.4-1.4l8.6-8.6l-8.6-8.6L12 6z" fill="currentColor"></path> </svg> </div><input id="broz-url" class="rounded bg-light-100 h-10 p-2" placeholder="antfu.me"/>')
      document.body.appendChild(brozElement)

      let dragging = false
      let startX = 0
      let startY = 0
      document.getElementById('broz-move').addEventListener('mousedown', (e) => {
        dragging = true
        startX = e.pageX
        startY = e.pageY
        e.preventDefault()
        e.stopPropagation()
      })

      let enableCall = true;
      document.addEventListener('mousemove', (e) => {
        if (dragging) {
          if (!enableCall) return;
          e.preventDefault()
          e.stopPropagation()

          enableCall = false;
          window.api.moveWindow(e.screenX - 36, e.screenY - 36);
          setTimeout(() => enableCall = true, 8);
        }
      })

      document.addEventListener('mouseup', (e) => {
        dragging = false
        e.preventDefault()
        e.stopPropagation()
        // console.log(e)
        window.api.setPosition();
      })

      document.getElementById('broz-back').addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        window.api.back();
      })
      document.getElementById('broz-forward').addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        window.api.forward();
      })
      document.getElementById('broz-url').addEventListener('change', (e) => {
        e.preventDefault()
        e.stopPropagation()
        window.api.loadUrl(e.target.value);
      })

      })()
    `)
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

  if (args.top) win.setAlwaysOnTop(true, 'floating')

  return win
}

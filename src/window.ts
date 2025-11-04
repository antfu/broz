import type { CommandOptions } from './types'
import { BrowserWindow, clipboard, Menu, MenuItem, shell } from 'electron'
import createState from 'electron-window-state'
import { WINDOW_SIZES } from './constants'
import { debounce, getRatio } from './utils'

export function createMainWindow(args: CommandOptions): BrowserWindow {
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
  menu?.insert(1, new MenuItem({
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
        submenu: WINDOW_SIZES.map(({ width, height }) => ({

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

function configureWindow(win: BrowserWindow, args: CommandOptions) {
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

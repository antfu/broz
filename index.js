// @ts-check
const process = require("node:process");
const { cac } = require("cac");
const {
  clipboard,
  shell,
  app,
  BrowserWindow,
  Menu,
  MenuItem,
} = require("electron");
const createState = require("electron-window-state");

let main = null;

const cli = cac("broz");

cli
  .command("[url]", "launch broz")
  .option("top", "set window always on top")
  .option("height <height>", "set initial window height")
  .option("width <width>", "set initial window width")
  .option("frame", "set window has a frame")
  .action(async (url, options) => {
    const args = {
      url: url || "https://github.com/antfu/broz#readme",
      top: options.top || false,
      height: options.height ? Number(options.height) : undefined,
      width: options.width ? Number(options.width) : undefined,
      frame: options.frame || false,
    };

    app.setName("Broz");
    app.on("window-all-closed", () => app.quit());

    try {
      await app.whenReady();
      main = createMainWindow(args);

      await main.loadURL(
        args.url.includes("://") ? args.url : `http://${args.url}`
      );
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

cli.help();
cli.parse();

const windowSizes = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 960, height: 540 },
  { width: 640, height: 360 },
  { width: 1000, height: 1000 },
  { width: 500, height: 500 },
];

function createMainWindow(args) {
  const state = createState({
    defaultWidth: 960,
    defaultHeight: 540,
  });

  const main = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: args.width ?? state.width,
    height: args.height ?? state.height,
    show: true,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: -100, y: -100 },
    frame: args.frame,
  });

  state.manage(main);
  const debouncedSaveWindowState = debounce(
    (event) => state.saveState(event.sender),
    500
  );

  main.on("resize", debouncedSaveWindowState);
  main.on("move", debouncedSaveWindowState);

  const menu = Menu.getApplicationMenu();
  // @ts-ignore
  menu.insert(
    1,
    new MenuItem({
      label: "Broz",
      submenu: [
        {
          label: "Copy URL",
          click: () => {
            const win = BrowserWindow.getFocusedWindow() || main;
            clipboard.writeText(win.webContents.getURL());
          },
        },
        {
          label: "Open in System Browser",
          click: () => {
            const win = BrowserWindow.getFocusedWindow() || main;
            shell.openExternal(win.webContents.getURL());
          },
        },
        {
          type: "separator",
        },
        {
          label: "Developer Tools",
          accelerator: "F12",
          click: () => {
            const win = BrowserWindow.getFocusedWindow() || main;
            if (win.webContents.isDevToolsOpened()) {
              win.webContents.closeDevTools();
            } else {
              win.webContents.openDevTools();
            }
          },
        },
        {
          type: "separator",
        },
        {
          label: "Resize",
          submenu: windowSizes.map(({ width, height }) => ({
            label: `${width} x ${height} (${getRatio(width, height)})`,
            click: () => {
              const win = BrowserWindow.getFocusedWindow() || main;
              win.setSize(width, height, true);
              state.saveState(win);
            },
          })),
        },
        {
          label: "Flip Size",
          click: () => {
            const win = BrowserWindow.getFocusedWindow() || main;
            const [width, height] = win.getSize();
            main.setSize(height, width);
            state.saveState(win);
          },
        },
        {
          label: "Center Window",
          click: () => {
            const win = BrowserWindow.getFocusedWindow() || main;
            main.center();
            state.saveState(win);
          },
        },
      ],
    })
  );
  Menu.setApplicationMenu(menu);

  configureWindow(main, args);

  return main;
}

/**
 * @param {BrowserWindow} win
 */
function configureWindow(win, args) {
  // injecting a dragable area
  win.webContents.on("dom-ready", () => {
    win.webContents.executeJavaScript(`;(() => {
const el = document.createElement('div')
el.id = 'injected-broz-drag'
const style = document.createElement('style')
style.innerHTML="#injected-broz-drag{position:fixed;left:10px;top:10px;width:40px;height:40px;border-radius:50%;cursor:grab;-webkit-app-region:drag;z-index:2147483647;background:rgba(0,0,0,0.3);transition:all 0.3s ease;display:none;}#injected-broz-drag:hover{background:rgba(136,136,136,0.8);transform:scale(1.1);}"
document.body.appendChild(el)
document.body.appendChild(style)

// Make drag bar draggable to different positions
let dragBarDragging = false;
let dragBarOffsetX, dragBarOffsetY;

el.addEventListener('mousedown', (e) => {
  if (e.button === 0) { // Left click
    dragBarDragging = true;
    dragBarOffsetX = e.clientX - el.offsetLeft;
    dragBarOffsetY = e.clientY - el.offsetTop;
    el.style.cursor = 'grabbing';
    e.preventDefault();
  }
});

document.addEventListener('mousemove', (e) => {
  if (dragBarDragging) {
    const newX = Math.max(0, Math.min(window.innerWidth - 40, e.clientX - dragBarOffsetX));
    const newY = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragBarOffsetY));
    el.style.left = newX + 'px';
    el.style.top = newY + 'px';
  }
});

document.addEventListener('mouseup', () => {
  if (dragBarDragging) {
    dragBarDragging = false;
    el.style.cursor = 'grab';
  }
});

const rootStyle = document.createElement('style')
rootStyle.innerHTML="::-webkit-scrollbar {display: none;}"
document.head.appendChild(rootStyle)

// Predefined positions for drag bar (4 corners only)
const positions = [
  { left: '10px', top: '10px' },                               // Top-left
  { left: 'calc(100vw - 50px)', top: '10px' },                // Top-right  
  { left: 'calc(100vw - 50px)', top: 'calc(100vh - 50px)' },  // Bottom-right
  { left: '10px', top: 'calc(100vh - 50px)' },                // Bottom-left
];

let currentPositionIndex = 0;

// Double-click to cycle through positions
el.addEventListener('dblclick', (e) => {
  e.preventDefault();
  currentPositionIndex = (currentPositionIndex + 1) % positions.length;
  const pos = positions[currentPositionIndex];
  el.style.left = pos.left;
  el.style.top = pos.top;
});

// Keyboard shortcuts for drag bar
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + D to toggle drag bar visibility
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault();
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
  
  // Ctrl/Cmd + R to reset drag bar position
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault();
    el.style.left = '10px';
    el.style.top = '10px';
    currentPositionIndex = 0;
  }
  
  // Ctrl/Cmd + Arrow keys to move to adjacent corners
  if ((e.ctrlKey || e.metaKey) && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    
    // Show drag bar if hidden
    if (el.style.display === 'none') {
      el.style.display = 'block';
      // Set initial position if not set
      if (!el.style.left || !el.style.top) {
        el.style.left = '10px';
        el.style.top = '10px';
      }
    }
    
    // Get current position (with fallback to default)
    const currentLeft = el.style.left || '10px';
    const currentTop = el.style.top || '10px';
    
    // Determine current corner and move accordingly
    let newLeft = currentLeft;
    let newTop = currentTop;
    
    if (e.key === 'ArrowRight') {
      // Always move to right side, keep current vertical position
      newLeft = 'calc(100vw - 50px)';
    } else if (e.key === 'ArrowLeft') {
      // Always move to left side, keep current vertical position
      newLeft = '10px';
    } else if (e.key === 'ArrowDown') {
      // Always move to bottom side, keep current horizontal position
      newTop = 'calc(100vh - 50px)';
    } else if (e.key === 'ArrowUp') {
      // Always move to top side, keep current horizontal position
      newTop = '10px';
    }
    
    el.style.left = newLeft;
    el.style.top = newTop;
  }
});
let isDragging = false;
let startX, startY;

// Add right-click functionality to the drag bar
el.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Create context menu for drag bar
  const menu = document.createElement('div');
  menu.id = 'drag-bar-menu';
  menu.style.cssText = \`
    position: fixed;
    left: \${e.clientX}px;
    top: \${e.clientY}px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 2147483648;
    min-width: 150px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
  \`;
  
  const menuItems = [
    { text: 'Move to Top-Left', action: () => { el.style.left = '10px'; el.style.top = '10px'; } },
    { text: 'Move to Top-Right', action: () => { el.style.left = 'calc(100vw - 50px)'; el.style.top = '10px'; } },
    { text: 'Move to Bottom-Left', action: () => { el.style.left = '10px'; el.style.top = 'calc(100vh - 50px)'; } },
    { text: 'Move to Bottom-Right', action: () => { el.style.left = 'calc(100vw - 50px)'; el.style.top = 'calc(100vh - 50px)'; } },
    { text: 'Hide Drag Bar', action: () => { el.style.display = 'none'; } },
  ];
  
  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.textContent = item.text;
    menuItem.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;';
    menuItem.addEventListener('mouseenter', () => menuItem.style.background = '#f0f0f0');
    menuItem.addEventListener('mouseleave', () => menuItem.style.background = 'white');
    menuItem.addEventListener('click', () => {
      item.action();
      menu.remove();
    });
    menu.appendChild(menuItem);
  });
  
  document.body.appendChild(menu);
  
  // Remove menu when clicking elsewhere
  const removeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', removeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', removeMenu), 100);
});

// Keep global right-click for other areas (optional - remove if you don't want global right-click drag)
document.addEventListener('contextmenu', (e) => {
  // Check if the click is NOT on the drag bar
  if (e.target.id !== 'injected-broz-drag') {
    e.preventDefault(); // Prevent default right-click menu
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    document.body.style.cursor = 'grabbing';
    
    // Create a temporary drag overlay
    const dragOverlay = document.createElement('div');
    dragOverlay.id = 'broz-drag-overlay';
    dragOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483648;cursor:grabbing;-webkit-app-region:drag;';
    document.body.appendChild(dragOverlay);
  }
});

document.addEventListener('mouseup', (e) => {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = '';
    const overlay = document.getElementById('broz-drag-overlay');
    if (overlay) overlay.remove();
  }
});

document.addEventListener('mouseleave', (e) => {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = '';
    const overlay = document.getElementById('broz-drag-overlay');
    if (overlay) overlay.remove();
  }
});

})()`);
  });

  win.webContents.setWindowOpenHandler(() => {
    const [x, y] = win.getPosition();
    const [width, height] = win.getSize();
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        x: x + 50,
        y: y + 50,
        width,
        height,
      },
    };
  });

  win.webContents.on("before-input-event", (event, input) => {
    if (input.control || input.meta) {
      if (input.key === "]") {
        win.webContents.goForward();
        event.preventDefault();
      } else if (input.key === "[") {
        win.webContents.goBack();
        event.preventDefault();
      } else if (input.key === "-") {
        win.webContents.emit("zoom-changed", event, "out");
        event.preventDefault();
      } else if (input.key === "=") {
        win.webContents.emit("zoom-changed", event, "in");
        event.preventDefault();
      }
    }

    // F12 for Developer Tools (toggle)
    if (input.key === "F12") {
      const win = BrowserWindow.getFocusedWindow() || main;
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win.webContents.openDevTools();
      }
      event.preventDefault();
    }
  });

  win.webContents.on("did-create-window", (win) => {
    configureWindow(win, args);
  });

  win.webContents.on("zoom-changed", (event, zoomDirection) => {
    const currentZoom = win.webContents.getZoomFactor();
    if (zoomDirection === "in") win.webContents.zoomFactor = currentZoom + 0.15;

    if (zoomDirection === "out")
      win.webContents.zoomFactor = currentZoom - 0.15;
  });

  if (args.top) win.setAlwaysOnTop(true, "floating");

  return win;
}

function debounce(fn, delay) {
  let timeoutID = null;
  return function (...args) {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

function getRatio(width, height) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const r = gcd(width, height);
  return `${width / r}:${height / r}`;
}

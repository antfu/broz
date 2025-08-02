<samp>

broz

a simple, frameless browser for screenshots

$ npx broz antfu.me

<br>

<img width="500" src="https://user-images.githubusercontent.com/11247099/116829776-5e669980-abd8-11eb-810f-03ec0c0a67cb.png"/>

<details>
<summary>FAQ</summary>

### Enhanced Drag Bar System

The browser now features an enhanced drag bar system with multiple positioning methods:

#### Drag Bar Visibility

- **Hidden by default** - The drag bar is initially hidden to avoid interference with webpage content
- **Toggle visibility**: <kbd>Ctrl</kbd>+<kbd>D</kbd> (or <kbd>⌘D</kbd> on Mac)

#### Multiple Positioning Methods

**1. Free Dragging**

- Left-click and drag the drag bar to position it anywhere on the screen
- Automatically constrained within viewport boundaries

**2. Keyboard Shortcuts**

- <kbd>Ctrl</kbd>+<kbd>D</kbd> - Toggle drag bar visibility
- <kbd>Ctrl</kbd>+<kbd>R</kbd> - Reset drag bar to top-left corner
- <kbd>Ctrl</kbd>+<kbd>Arrow Keys</kbd> - Move drag bar to specific edges:
  - <kbd>Ctrl</kbd>+<kbd>←</kbd> - Move to left edge (preserves vertical position)
  - <kbd>Ctrl</kbd>+<kbd>→</kbd> - Move to right edge (preserves vertical position)
  - <kbd>Ctrl</kbd>+<kbd>↑</kbd> - Move to top edge (preserves horizontal position)
  - <kbd>Ctrl</kbd>+<kbd>↓</kbd> - Move to bottom edge (preserves horizontal position)

**3. Double-Click Cycling**

- Double-click the drag bar to cycle through the 4 corner positions:
  - Top-left → Top-right → Bottom-right → Bottom-left → (repeat)

**4. Right-Click Context Menu**

- Right-click the drag bar for a context menu with preset position options:
  - Move to Top-Left
  - Move to Top-Right
  - Move to Bottom-Left
  - Move to Bottom-Right
  - Hide Drag Bar

#### Smart Corner Navigation

The arrow key system allows seamless movement between all four corners:

- Use combinations like <kbd>Ctrl</kbd>+<kbd>←</kbd> then <kbd>Ctrl</kbd>+<kbd>↓</kbd> to reach bottom-left
- Each direction moves to the absolute position while preserving the other axis

#### Additional Features

- **Smooth animations** with hover effects for better user experience
- **Global right-click drag** - Right-click anywhere (except the drag bar) to drag the entire window

### Close the Window

You can do that by either:

- End the process in Terminal by <kbd>^C</kbd> / <kbd>Ctrl</kbd>+<kbd>C</kbd>
- Keyboard shortcuts <kbd>⌘W</kbd> / <kbd>⌘Q</kbd> / <kbd>Alt</kbd>+<kbd>F4</kbd>
- Menu:
  ![](https://user-images.githubusercontent.com/11247099/116905572-bef5e500-ac71-11eb-9c10-2ebc7986adbd.png)

### Change the URL

Just close it and create another :)

### Developer Tools

- <kbd>F12</kbd> - Toggle Developer Tools (also available in menu)

### Navigation

- <kbd>⌘[</kbd> - Backward
- <kbd>⌘]</kbd> - Forward
- <kbd>⌘+</kbd> / <kbd>⌘=</kbd> - Zoom in
- <kbd>⌘-</kbd> - Zoom out

The rest is basically the same as Chrome.

</details>

</samp>

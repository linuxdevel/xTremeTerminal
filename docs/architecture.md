# Architecture

Technical architecture overview for xTremeTerminal, covering design decisions, component relationships, and data flow.

## Design Principles

### 1. Separation of Concerns

The codebase is organized into three layers:

```
┌─────────────────────────┐
│      Components         │  TUI rendering + user interaction
│   (src/components/)     │  Depends on: OpenTUI, Services
├─────────────────────────┤
│       Services          │  Business logic + state management
│    (src/services/)      │  Depends on: nothing (pure logic)
├─────────────────────────┤
│       Utilities         │  Pure functions, mappings
│     (src/utils/)        │  Depends on: nothing
└─────────────────────────┘
```

- **Services** have zero TUI dependency. They can be tested without a renderer.
- **Components** own their OpenTUI renderables and manage their lifecycle.
- **Utilities** are pure functions with no side effects.

### 2. App as Orchestrator

`src/app.ts` is the central coordinator. It:
- Creates the renderer
- Instantiates all components and services
- Wires them together via callbacks
- Routes keyboard events to the appropriate component
- Manages global state (which component is focused, etc.)

Components never communicate directly with each other. They communicate through the App.

### 3. State Flows Down, Events Flow Up

```
     App (state owner)
      │         ▲
      │ state   │ events
      ▼         │
   Components ──┘
```

The App passes state into components (e.g., "these are the open tabs"). Components emit events back to the App (e.g., "user clicked tab X"). The App processes the event, updates state, and pushes new state to affected components.

## Component Architecture

### Layout Hierarchy

```
renderer.root
└── RootContainer (column)
    ├── TabBar (height: 1)
    ├── MiddleRow (row, flexGrow: 1)
    │   ├── Sidebar (width: 25)
    │   │   └── FileTree
    │   │       └── ScrollBox
    │   │           └── TreeItems...
    │   └── EditorArea (flexGrow: 1)
    │       └── ScrollBox
    │           └── LineNumbers + Textarea/Code
    └── StatusBar (height: 1)
```

### Component Lifecycle

Each component follows a consistent pattern:

```typescript
class SomeComponent {
  // 1. Construction: create renderables
  constructor(renderer: CliRenderer, options: Options) {
    this.container = new BoxRenderable(renderer, { ... })
    // ... create children
  }

  // 2. Rendering: update visual state
  render(state: SomeState): void {
    // Update renderable properties based on state
  }

  // 3. Event callbacks: communicate with App
  onSomeAction: (data: EventData) => void

  // 4. Cleanup: destroy renderables
  destroy(): void {
    this.container.destroy()
  }
}
```

## Service Architecture

### FileService

Handles all file system I/O. Uses `node:fs/promises` for async operations.

```
FileService
├── readDirectory(path) → FileEntry[]
├── readFileContent(path) → string
├── writeFileContent(path, content) → void
├── createFile(dir, name) → string
├── createDirectory(dir, name) → string
├── renameFile(old, new) → string
├── deleteFile(path) → void
├── deleteDirectory(path) → void
├── buildTree(root) → FileEntry[]
├── expandDirectory(entry) → FileEntry[]
├── isTextFile(path) → boolean
└── getFileStats(path) → FileStats
```

### TabManager

Manages the state of all open tabs. Pure data management, no rendering.

```
TabManager
├── tabs: TabState[]
├── activeTabId: string | null
├── openTab(path, content) → TabState
├── closeTab(id) → TabState | null
├── switchToTab(id) → TabState
├── nextTab() / previousTab() → TabState
├── updateTabContent(id, content) → void
├── updateTabCursor(id, line, col) → void
├── findTabByPath(path) → TabState | null
└── hasUnsavedTabs() → boolean
```

### History

Per-tab undo/redo stack. Each tab gets its own History instance.

```
History
├── undoStack: EditOperation[]
├── redoStack: EditOperation[]
├── push(operation) → void
├── undo() → EditOperation | null
├── redo() → EditOperation | null
├── merge(operation) → boolean
├── canUndo() / canRedo() → boolean
└── clear() → void
```

### Clipboard

Simple internal buffer for copy/cut/paste operations.

```
Clipboard
├── buffer: string
├── copy(text) → void
├── cut(text) → string
├── paste() → string
├── hasContent() → boolean
└── clear() → void
```

## Data Flow Examples

### Opening a File from the File Tree

```
1. User presses Enter on a file in FileTree
2. FileTree calls: onFileSelect(filePath)
3. App receives the event
4. App checks: TabManager.findTabByPath(filePath)
   - If tab exists: TabManager.switchToTab(id)
   - If not: FileService.readFileContent(filePath) → content
             TabManager.openTab(filePath, content) → tab
5. App updates: TabBar.render(tabs, activeId)
                Editor.loadFile(filePath, content)
                StatusBar.update(statusState)
```

### Saving a File

```
1. User presses Ctrl+S
2. App receives keypress (global handler)
3. App gets: Editor.content, Editor.currentFilePath
4. App calls: FileService.writeFileContent(path, content)
5. On success: TabManager.markModified(activeId, false)
               TabBar.render(tabs, activeId)
               StatusBar.showMessage("File saved", "success")
6. On error: StatusBar.showMessage("Error: ...", "error")
```

### Undo Operation

```
1. User presses Ctrl+Z
2. App receives keypress
3. App gets: activeTab.history.undo() → operation
4. If operation exists:
   - Apply reverse operation to editor content
   - Editor.setContent(newContent)
   - TabManager.updateTabContent(id, newContent)
```

## Focus Management

xTremeTerminal has two focus zones:

1. **File Tree** - receives arrow keys for navigation, n/N/F2/Delete for file ops
2. **Editor** - receives all text input, editing shortcuts

Switching focus:
- **Tab** key or clicking switches focus between tree and editor
- When search dialog or command palette is open, they capture all input
- Overlays (confirm dialog, search) are modal -- they must be dismissed before returning to normal input

```
Focus Priority (highest to lowest):
1. Confirm Dialog (modal)
2. Command Palette (modal)
3. Search Dialog (modal)
4. Editor (when focused)
5. File Tree (when focused)
```

## Testing Architecture

### Three Test Layers

```
┌───────────────────────────────────────────────────┐
│  Integration Tests (tests/integration/)            │
│  Full user workflows with simulated keyboard input │
│  Uses: headless renderer, temp directories         │
├───────────────────────────────────────────────────┤
│  Component Tests (tests/component/)                │
│  Individual components with a renderer             │
│  Uses: headless renderer (OTUI_NO_NATIVE_RENDER)   │
├───────────────────────────────────────────────────┤
│  Unit Tests (tests/unit/)                          │
│  Services and utilities in isolation               │
│  Uses: no renderer, mocked file system             │
└───────────────────────────────────────────────────┘
```

### Test Helpers

- `tests/helpers/setup.ts` - Creates a headless renderer for component/integration tests, provides temp directory utilities
- `tests/helpers/key-simulator.ts` - Simulates keyboard input sequences by emitting KeyEvent objects through the renderer's keyInput handler

### Headless Renderer for Tests

```typescript
const renderer = await createCliRenderer({
  exitOnCtrlC: false,
  useAlternateScreen: false,
})
// Set OTUI_NO_NATIVE_RENDER=true in environment
```

This allows tests to create renderables and simulate input without needing an actual terminal.

## Technology Choices

### Why OpenTUI?

- **Same library as OpenCode** - proven at scale in a real product
- **Built-in Tree-sitter** - syntax highlighting without additional dependencies
- **Yoga layout engine** - CSS Flexbox in the terminal, responsive layouts
- **Imperative API** - direct control over renderables, good for stateful components
- **Rich component library** - Text, Box, Input, Textarea, ScrollBox, Code, etc.

### Why Bun?

- **Required by OpenTUI** - OpenTUI uses Bun-specific FFI for native rendering
- **Fast startup** - important for a CLI tool
- **Built-in test runner** - no need for Jest/Vitest
- **TypeScript-first** - runs .ts files directly without compilation

### Why Imperative API (not SolidJS/React)?

- **Direct control** - easier to manage complex stateful interactions (editor, tree)
- **Less overhead** - no reactive framework runtime
- **Predictable rendering** - explicit render calls, no virtual DOM diffing
- **Simpler testing** - components are regular classes with methods

## File Format Support

xTremeTerminal edits plain text files. It intentionally does not support:
- Binary file editing (hex editors are better for this)
- Rich text / WYSIWYG editing
- Image viewing (beyond file tree icons)

Detection of "editable" files:
1. Check file extension against known binary list
2. Read first 8KB and check for null bytes
3. If null bytes found → binary → show warning
4. Otherwise → text → open for editing

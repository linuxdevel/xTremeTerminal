# Phase 8: Status Bar & Command Palette

## Goal
Build a fully functional status bar showing editor state, and a command palette for quick access to all operations.

## Dependencies
- All previous phases (status bar shows info from editor, tabs, file tree)

## Steps

### 8.1 Create Status Bar Component (`src/components/status-bar.ts`)
The status bar sits at the bottom of the screen, 1 row tall:

```
 index.ts | Ln 3, Col 12 | TypeScript | UTF-8 | 4 spaces | Modified
```

Layout (flexDirection: "row"):
- Left section: filename (or "Untitled")
- Center section: cursor position (Ln X, Col Y)
- Right section: language, encoding, indent style, modified indicator

```typescript
class StatusBar {
  private container: BoxRenderable
  private sections: {
    filename: TextRenderable
    cursor: TextRenderable
    language: TextRenderable
    encoding: TextRenderable
    indent: TextRenderable
    modified: TextRenderable
  }

  update(state: StatusBarState): void
  showMessage(text: string, type: "info" | "error" | "warning", timeout?: number): void
}

interface StatusBarState {
  filename: string | null
  cursorLine: number
  cursorColumn: number
  language: string | null
  encoding: string           // always "UTF-8" for now
  indentStyle: string         // "4 spaces" or "Tab"
  isModified: boolean
  totalLines: number
}
```

Temporary messages (like "File saved", "Error: permission denied") replace the status bar content briefly then fade back to normal state.

### 8.2 Create Command Palette Component (`src/components/command-palette.ts`)
Searchable overlay listing all available commands:

```
┌────────────────────────────────────────┐
│ > search commands...                    │
├────────────────────────────────────────┤
│   Save File                  Ctrl+S    │
│   New File                   Ctrl+N    │
│ > Close Tab                  Ctrl+W    │  ← selected
│   Find                       Ctrl+F    │
│   Find & Replace             Ctrl+H    │
│   Toggle Sidebar             Ctrl+B    │
│   Undo                       Ctrl+Z    │
│   Redo                       Ctrl+Y    │
│   ...                                  │
└────────────────────────────────────────┘
```

```typescript
interface Command {
  id: string
  label: string
  shortcut: string | null     // Display text like "Ctrl+S"
  category: string            // "File", "Edit", "View", "Navigation"
  action: () => void
}

class CommandPalette {
  private container: BoxRenderable       // Absolute, centered overlay
  private searchInput: InputRenderable
  private commandList: ScrollBoxRenderable
  private commands: Command[]
  private filteredCommands: Command[]
  private selectedIndex: number
  private isVisible: boolean

  // Register all available commands
  registerCommands(commands: Command[]): void

  // Show/hide
  show(): void
  hide(): void

  // Navigation
  moveUp(): void
  moveDown(): void
  execute(): void             // Run selected command

  // Filtering
  filterCommands(query: string): void
}
```

### 8.3 Register All Commands
In `app.ts`, register commands from all phases:

**File commands:**
- Save File (Ctrl+S)
- New File (Ctrl+N)
- Close Tab (Ctrl+W)

**Edit commands:**
- Undo (Ctrl+Z)
- Redo (Ctrl+Y)
- Find (Ctrl+F)
- Find & Replace (Ctrl+H)
- Select All (Ctrl+A)

**View commands:**
- Toggle Sidebar (Ctrl+B)
- Command Palette (Ctrl+Shift+P)

**Navigation commands:**
- Next Tab (Ctrl+Tab)
- Previous Tab (Ctrl+Shift+Tab)
- Go to File (Ctrl+P)

**File Tree commands:**
- New File (n)
- New Directory (N)
- Rename (F2)
- Delete (Delete)

### 8.4 Keyboard Shortcut Help (F1)
When F1 is pressed, show a help overlay listing all keyboard shortcuts in a readable format. This can reuse the command palette UI or be a separate simple overlay.

### 8.5 Integrate Status Bar into Layout
- Status bar is always visible at the bottom
- Updated whenever:
  - Cursor moves in editor
  - Tab switches
  - File is saved/modified
  - Language is detected
  - Error occurs (temporary message)

### 8.6 Write Tests

**Component tests:**
- `tests/component/status-bar.test.ts`:
  - Renders filename correctly
  - Renders cursor position correctly
  - Updates when state changes
  - Shows modified indicator when modified
  - Temporary messages display and auto-dismiss
  - Shows "Untitled" when no file is open

## Files Created/Modified
- `src/components/status-bar.ts` (new)
- `src/components/command-palette.ts` (new)
- `src/components/layout.ts` (modified - add status bar)
- `src/app.ts` (modified - wire status bar updates, command palette, register commands)
- `tests/component/status-bar.test.ts` (new)

## Acceptance Criteria
- [ ] Status bar shows filename, cursor position, language, encoding
- [ ] Status bar updates in real-time as cursor moves
- [ ] Status bar shows "Modified" for unsaved files
- [ ] Temporary messages (save confirmation, errors) display briefly
- [ ] Ctrl+Shift+P opens command palette
- [ ] Command palette is searchable (filters as you type)
- [ ] Arrow keys navigate the command list
- [ ] Enter executes the selected command
- [ ] Escape closes the command palette
- [ ] F1 shows keyboard shortcut help
- [ ] All tests pass

## OpenTUI Components Used
- `BoxRenderable` - Status bar container, command palette container
- `TextRenderable` - Status sections, command labels
- `InputRenderable` - Command palette search input
- `ScrollBoxRenderable` - Command list (for scrolling)

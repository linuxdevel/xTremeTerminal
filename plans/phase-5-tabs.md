# Phase 5: Tab Management

## Goal
Implement a tab bar and tab state management system to support multiple open files with independent editor state per tab.

## Dependencies
- Phase 3 completed (editor core)
- Phase 4 completed (syntax highlighting)

## Steps

### 5.1 Create Tab Manager Service (`src/services/tab-manager.ts`)
Pure business logic for tab state management:

```typescript
interface TabState {
  id: string                  // Unique tab ID
  filePath: string | null     // null for untitled files
  title: string               // Display name (filename or "Untitled")
  isModified: boolean         // Has unsaved changes
  cursorLine: number          // Saved cursor position
  cursorColumn: number
  scrollTop: number           // Saved scroll position
  language: string | null     // Detected language
  content: string             // Current buffer content
}

class TabManager {
  private tabs: TabState[]
  private activeTabId: string | null

  // Tab operations
  openTab(filePath: string, content: string): TabState
  closeTab(id: string): TabState | null       // Returns next active tab
  switchToTab(id: string): TabState
  nextTab(): TabState
  previousTab(): TabState
  newUntitledTab(): TabState

  // State management
  updateTabContent(id: string, content: string): void
  updateTabCursor(id: string, line: number, col: number): void
  updateTabScroll(id: string, scrollTop: number): void
  markModified(id: string, modified: boolean): void
  renameTab(id: string, newPath: string): void

  // Queries
  getActiveTab(): TabState | null
  getTab(id: string): TabState | null
  getAllTabs(): TabState[]
  findTabByPath(path: string): TabState | null
  hasUnsavedTabs(): boolean

  // Events
  onTabChange: (tab: TabState) => void
  onTabClose: (tab: TabState) => void
  onTabListChange: (tabs: TabState[]) => void
}
```

### 5.2 Create Tab Bar Component (`src/components/tab-bar.ts`)
Visual tab bar showing open files:

```
 [index.ts] [● app.ts] [theme.ts]
```

- Each tab shows the filename
- Active tab has accent-colored background (`BG_PRIMARY`) and text (`ACCENT`)
- Inactive tabs have `BG_SECONDARY` background, `FG_SECONDARY` text
- Modified tabs show a `●` dot before the filename
- Tabs are clickable (for mouse support) and navigable via keyboard

```typescript
class TabBar {
  private container: BoxRenderable
  private tabElements: Map<string, BoxRenderable>

  render(tabs: TabState[], activeId: string): void
  onTabClick: (id: string) => void
  onTabClose: (id: string) => void
}
```

### 5.3 Integrate Tabs with Editor
In `app.ts`:
- When opening a file from the tree:
  1. Check if tab already exists for this path (`findTabByPath`)
  2. If yes, switch to that tab
  3. If no, create new tab, load file, switch to it
- When switching tabs:
  1. Save current tab's cursor position and scroll offset
  2. Load new tab's content into editor
  3. Restore cursor and scroll position
  4. Update tab bar rendering

### 5.4 Tab Keyboard Shortcuts
- **Ctrl+Tab** - Switch to next tab
- **Ctrl+Shift+Tab** - Switch to previous tab
- **Ctrl+W** - Close current tab
- **Ctrl+N** - Open new untitled tab

### 5.5 Unsaved Changes on Close
When closing a tab with unsaved changes:
- Show a simple text prompt: "Save changes to {filename}? [Y/n/Cancel]"
- Y: Save then close
- n: Discard and close
- Cancel/Escape: Cancel close operation

### 5.6 Write Tests

**Unit tests:**
- `tests/unit/tab-manager.test.ts`:
  - Opening a tab adds it to the list
  - Opening same file path reuses existing tab
  - Closing a tab removes it and returns next active
  - Closing last tab returns null
  - nextTab/previousTab cycle through tabs
  - Modified state tracking works correctly
  - Cursor and scroll positions are saved/restored
  - newUntitledTab creates unique titles ("Untitled", "Untitled-2", etc.)
  - findTabByPath returns correct tab or null

**Component tests:**
- `tests/component/tab-bar.test.ts`:
  - Renders correct number of tab elements
  - Active tab has accent styling
  - Modified tabs show dot indicator
  - Tab click emits callback with correct ID

**Integration tests:**
- `tests/integration/multi-tab-workflow.test.ts`:
  - Open file from tree -> tab appears
  - Open second file -> second tab appears, first still accessible
  - Switch tabs -> editor content changes
  - Close tab with unsaved changes -> prompt appears
  - Ctrl+Tab cycles through tabs in order

## Files Created/Modified
- `src/services/tab-manager.ts` (new)
- `src/components/tab-bar.ts` (new)
- `src/components/layout.ts` (modified - add tab bar)
- `src/app.ts` (modified - wire tabs to editor and file tree)
- `src/components/editor.ts` (modified - support content swapping)
- `tests/unit/tab-manager.test.ts` (new)
- `tests/component/tab-bar.test.ts` (new)
- `tests/integration/multi-tab-workflow.test.ts` (new)

## Acceptance Criteria
- [ ] Opening files creates tabs in the tab bar
- [ ] Clicking/switching tabs swaps the editor content
- [ ] Cursor and scroll position are preserved per tab
- [ ] Modified indicator (dot) shows on unsaved tabs
- [ ] Active tab is visually distinct (accent color)
- [ ] Ctrl+Tab and Ctrl+Shift+Tab cycle tabs
- [ ] Ctrl+W closes current tab
- [ ] Closing unsaved tab shows confirmation prompt
- [ ] Opening same file twice reuses existing tab
- [ ] All tests pass

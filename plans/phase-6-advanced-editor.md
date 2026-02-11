# Phase 6: Advanced Editor Features

## Goal
Add undo/redo history, clipboard operations (copy/cut/paste with text selection), and search & replace functionality.

## Dependencies
- Phase 5 completed (tabs, full editor working)

## Steps

### 6.1 Create History Service (`src/services/history.ts`)
Undo/redo stack for text operations:

```typescript
interface EditOperation {
  type: "insert" | "delete" | "replace"
  position: number             // Offset in text
  oldText: string              // Text before change (for undo)
  newText: string              // Text after change (for redo)
  timestamp: number
}

class History {
  private undoStack: EditOperation[]
  private redoStack: EditOperation[]
  private maxSize: number       // Limit stack size (default: 1000)

  push(operation: EditOperation): void    // Record an edit
  undo(): EditOperation | null            // Pop from undo, push to redo
  redo(): EditOperation | null            // Pop from redo, push to undo
  clear(): void                           // Reset both stacks
  canUndo(): boolean
  canRedo(): boolean
  merge(operation: EditOperation): boolean // Merge consecutive typing into one operation
}
```

Merge logic: Consecutive single-character inserts within 500ms at adjacent positions merge into one operation, so undoing doesn't go character by character.

### 6.2 Create Clipboard Service (`src/services/clipboard.ts`)
Internal clipboard buffer (not system clipboard, to avoid terminal complexity):

```typescript
class Clipboard {
  private buffer: string

  copy(text: string): void      // Store text
  cut(text: string): string     // Store and return for deletion
  paste(): string               // Retrieve stored text
  hasContent(): boolean
  clear(): void
}
```

Note: System clipboard integration (via OSC 52 escape sequences) can be added in Phase 9 as polish.

### 6.3 Integrate Undo/Redo into Editor
- Track content changes via TextareaRenderable's `onContentChange` callback
- On each change, push an EditOperation to History
- **Ctrl+Z** triggers `history.undo()` and applies the reverse operation
- **Ctrl+Y** (or Ctrl+Shift+Z) triggers `history.redo()`
- Each tab has its own History instance (stored in TabState)
- Clear history when switching to a different file

### 6.4 Integrate Clipboard into Editor
- TextareaRenderable should support text selection natively
- **Ctrl+C** copies selected text to clipboard buffer
- **Ctrl+X** cuts selected text (copies + deletes)
- **Ctrl+V** pastes clipboard content at cursor position
- **Ctrl+A** selects all text
- Note: Ctrl+C for exit only works when NOT in the editor (when sidebar is focused or no selection)

### 6.5 Create Search Dialog Component (`src/components/search-dialog.ts`)
Overlay dialog for find & replace:

```
┌─────────────────────────────────────┐
│ Find:    [search term          ] ↑↓ │
│ Replace: [replacement          ]    │
│ [Replace] [Replace All] [Close]     │
│ 3 of 12 matches                     │
└─────────────────────────────────────┘
```

```typescript
class SearchDialog {
  private container: BoxRenderable        // Positioned absolute, overlay
  private searchInput: InputRenderable
  private replaceInput: InputRenderable
  private matchCount: TextRenderable
  private currentMatch: number

  // State
  private searchTerm: string
  private replaceTerm: string
  private matches: SearchMatch[]
  private isVisible: boolean
  private showReplace: boolean           // Ctrl+F = find only, Ctrl+H = find+replace

  // Methods
  show(mode: "find" | "replace"): void
  hide(): void
  findNext(): void
  findPrevious(): void
  replaceOne(): void
  replaceAll(): void

  // Events
  onSearchChange: (term: string) => void
  onNavigate: (match: SearchMatch) => void
  onReplace: (match: SearchMatch, replacement: string) => void
  onReplaceAll: (term: string, replacement: string) => void
}
```

### 6.6 Search Highlighting in Editor
- When search is active, highlight all matches in the editor
- Current match has distinct highlight (brighter)
- Navigating matches scrolls the editor to the match position
- Match count updates live as the search term changes

### 6.7 Write Tests

**Unit tests:**
- `tests/unit/history.test.ts`:
  - Push operations and undo retrieves them in reverse order
  - Redo retrieves undone operations
  - Redo stack clears on new edit after undo
  - Merge consecutive character inserts
  - Respects max size limit
  - Clear resets both stacks
  - canUndo/canRedo report correctly

- `tests/unit/clipboard.test.ts`:
  - Copy stores text
  - Paste retrieves stored text
  - Cut returns text for deletion
  - hasContent reports correctly
  - Multiple copies overwrite buffer
  - Clear empties buffer

**Component tests:**
- `tests/component/search-dialog.test.ts`:
  - Show/hide toggles visibility
  - Typing in search input fires onSearchChange
  - findNext/findPrevious cycle through matches
  - Replace replaces current match
  - Replace all replaces all matches
  - Match count displays correctly
  - Escape closes dialog

**Integration tests:**
- `tests/integration/search-replace.test.ts`:
  - Open file, Ctrl+F, type search term, matches highlight
  - Navigate matches with Enter or arrow buttons
  - Ctrl+H opens replace mode
  - Replace one match, verify content changed
  - Replace all, verify all matches changed
  - Close search, highlighting removed

- `tests/integration/undo-redo.test.ts`:
  - Edit file, Ctrl+Z undoes change, content reverts
  - Ctrl+Y redoes change, content restored
  - Multiple edits, multiple undos work in sequence
  - Undo after save still works

## Files Created/Modified
- `src/services/history.ts` (new)
- `src/services/clipboard.ts` (new)
- `src/components/search-dialog.ts` (new)
- `src/components/editor.ts` (modified - undo/redo, clipboard, search integration)
- `src/app.ts` (modified - wire search dialog, undo/redo shortcuts)
- `tests/unit/history.test.ts` (new)
- `tests/unit/clipboard.test.ts` (new)
- `tests/component/search-dialog.test.ts` (new)
- `tests/integration/search-replace.test.ts` (new)
- `tests/integration/undo-redo.test.ts` (new)

## Acceptance Criteria
- [ ] Ctrl+Z undoes the last edit
- [ ] Ctrl+Y redoes an undone edit
- [ ] Consecutive character typing merges into one undo operation
- [ ] Ctrl+C copies selected text
- [ ] Ctrl+X cuts selected text
- [ ] Ctrl+V pastes at cursor position
- [ ] Ctrl+F opens find dialog
- [ ] Ctrl+H opens find & replace dialog
- [ ] Search matches are highlighted in the editor
- [ ] Navigate between matches with dialog controls
- [ ] Replace and Replace All work correctly
- [ ] Escape closes the search dialog
- [ ] All tests pass

## OpenTUI Components Used
- `InputRenderable` - Search and replace text inputs
- `BoxRenderable` - Dialog container (absolute positioned)
- `TextRenderable` - Match count, labels, buttons

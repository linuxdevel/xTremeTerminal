# Phase 3: Text Editor Core

## Goal
Implement the core text editing component using OpenTUI's TextareaRenderable, with file loading, saving, cursor movement, line numbers, and basic editing operations.

## Dependencies
- Phase 2 completed (file tree, file service)

## Steps

### 3.1 Create Language Detection Utility (`src/utils/language-detect.ts`)
Map file extensions to Tree-sitter language identifiers:

```typescript
const LANGUAGE_MAP: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "tsx",
  ".js": "javascript",
  ".jsx": "jsx",
  ".json": "json",
  ".md": "markdown",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
  ".zig": "zig",
  ".html": "html",
  ".css": "css",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",
  ".sh": "bash",
  ".bash": "bash",
  // ... more languages
}

function detectLanguage(filePath: string): string | null
```

### 3.2 Create Editor Component (`src/components/editor.ts`)
The editor is the main editing area. It uses `TextareaRenderable` for editable text:

```typescript
class Editor {
  private textarea: TextareaRenderable
  private lineNumbers: LineNumberRenderable
  private scrollBox: ScrollBoxRenderable
  private container: BoxRenderable

  // State
  private filePath: string | null
  private isModified: boolean
  private language: string | null

  // Methods
  loadFile(path: string): Promise<void>     // Read file, set content
  saveFile(): Promise<void>                  // Write content to file
  newFile(): void                            // Create empty buffer

  // Accessors
  get content(): string
  get cursorLine(): number
  get cursorColumn(): number
  get modified(): boolean
  get currentFilePath(): string | null

  // Events
  onModifiedChange: (modified: boolean) => void
  onCursorChange: (line: number, col: number) => void
  onSave: (path: string) => void

  // Lifecycle
  focus(): void
  blur(): void
  destroy(): void
}
```

### 3.3 Layout Structure for Editor
```
┌──────────────────────────────────────┐
│ Line Numbers │ TextareaRenderable     │
│  (gutter)    │ (editable text)        │
│              │                        │
│   1          │ import { foo } from... │
│   2          │                        │
│   3          │ function hello() {     │
│   4          │   console.log("hi")   │
│   5          │ }                      │
└──────────────────────────────────────┘
```

Use `ScrollBoxRenderable` wrapping `LineNumberRenderable` which wraps `TextareaRenderable`:
- LineNumberRenderable's `target` is the textarea
- ScrollBox handles vertical scrolling
- Gutter styled with `FG_MUTED` text on `BG_SECONDARY` background

### 3.4 TextareaRenderable Configuration
```typescript
const textarea = new TextareaRenderable(renderer, {
  id: "editor-textarea",
  width: "100%",
  height: "100%",
  backgroundColor: BG_PRIMARY,
  focusedBackgroundColor: BG_PRIMARY,
  textColor: FG_PRIMARY,
  focusedTextColor: FG_PRIMARY,
  cursorColor: ACCENT,
  selectionBg: BG_SELECTION,
  wrapMode: "none",          // No word wrap for code editing
  onContentChange: (event) => { /* mark as modified */ },
  onCursorChange: (event) => { /* update status bar */ },
})
```

### 3.5 File Loading and Saving
- **Load:** Read file via `FileService.readFileContent()`, set `textarea.initialValue` or equivalent
- **Save:** Get `textarea.plainText`, write via `FileService.writeFileContent()`
- **Modified tracking:** Set `isModified = true` on content change, `false` after save
- **Error handling:** Show error in status bar if file read/write fails

### 3.6 Wire Editor to File Tree
In `app.ts`:
- When `FileTree.onFileSelect(path)` fires, call `Editor.loadFile(path)`
- Update tab bar and status bar with file info
- Handle binary file detection (show "Binary file - cannot edit" message)

### 3.7 Basic Keyboard Shortcuts in Editor
- **Ctrl+S** - Save file
- Cursor movement is handled natively by TextareaRenderable:
  - Arrow keys, Home, End, Page Up/Down
  - Ctrl+Left/Right for word movement (if supported)

### 3.8 Write Tests

**Unit tests:**
- `tests/unit/language-detect.test.ts`:
  - Returns correct language for known extensions
  - Returns null for unknown extensions
  - Handles files with no extension
  - Case-insensitive matching

**Component tests:**
- `tests/component/editor.test.ts`:
  - Loads file content into textarea
  - Reports modified state on content change
  - Reports cursor position changes
  - Save writes content back to file
  - Handles empty files
  - Handles non-existent files gracefully

**Integration tests:**
- `tests/integration/open-and-edit.test.ts`:
  - Navigate file tree, select file, verify editor loads content
  - Edit text, press Ctrl+S, verify file saved to disk
  - Open file, verify line numbers display correctly
  - Open non-existent path, verify error handling

## Files Created/Modified
- `src/utils/language-detect.ts` (new)
- `src/components/editor.ts` (new)
- `src/components/layout.ts` (modified - add editor to main area)
- `src/app.ts` (modified - wire editor to file tree, handle Ctrl+S)
- `tests/unit/language-detect.test.ts` (new)
- `tests/component/editor.test.ts` (new)
- `tests/integration/open-and-edit.test.ts` (new)

## Acceptance Criteria
- [ ] Selecting a file in the tree loads it into the editor
- [ ] Text is editable with full cursor movement
- [ ] Line numbers display in the gutter
- [ ] Ctrl+S saves the file to disk
- [ ] Modified state is tracked and reported
- [ ] Cursor position (line/col) is tracked
- [ ] Binary files show a warning instead of content
- [ ] All unit tests pass
- [ ] All component tests pass
- [ ] All integration tests pass

## OpenTUI Components Used
- `TextareaRenderable` - Editable text buffer
- `LineNumberRenderable` - Line number gutter
- `ScrollBoxRenderable` - Scrollable container
- `BoxRenderable` - Container layout

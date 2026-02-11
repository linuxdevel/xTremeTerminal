# Phase 2: File Tree Browser

## Goal
Build a fully functional file/directory browser in the sidebar with tree-view navigation, file icons, and keyboard-driven interaction.

## Dependencies
- Phase 1 completed (layout shell, theme, keybindings)

## Steps

### 2.1 Create File Service (`src/services/file-service.ts`)
Pure business logic for file system operations (no TUI dependency):

```typescript
interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  isExpanded: boolean    // for directories
  depth: number          // nesting level
  children?: FileEntry[]
  size?: number
  modified?: Date
}
```

Methods:
- `readDirectory(path: string): Promise<FileEntry[]>` - List directory contents sorted (dirs first, then files, alphabetical)
- `readFileContent(path: string): Promise<string>` - Read file as text
- `writeFileContent(path: string, content: string): Promise<void>` - Write file
- `getFileStats(path: string): Promise<FileStats>` - Get size, modified date
- `isTextFile(path: string): Promise<boolean>` - Detect binary vs text
- `buildTree(rootPath: string): Promise<FileEntry[]>` - Build initial tree (one level deep)
- `expandDirectory(entry: FileEntry): Promise<FileEntry[]>` - Lazy-load children

### 2.2 Create File Icons Utility (`src/utils/file-icons.ts`)
Map file extensions and names to unicode icons:
- Folders: `📁` (collapsed), `📂` (expanded)
- TypeScript: `TS`, JavaScript: `JS`
- JSON: `{}`, Markdown: `MD`
- Images, configs, etc.
- Default file icon: `📄`
- Use simple text-based icons for maximum terminal compatibility

### 2.3 Create File Tree Component (`src/components/file-tree.ts`)
Build the tree view using `ScrollBoxRenderable` + `TextRenderable` items:

```typescript
class FileTree {
  private scrollBox: ScrollBoxRenderable
  private items: FileEntry[]        // flattened visible items
  private selectedIndex: number     // currently highlighted item
  private rootPath: string

  // Rendering
  render(): void              // Rebuild visible item list
  renderItem(entry, index)    // Render single tree item with icon + indent

  // Navigation
  moveUp(): void
  moveDown(): void
  expandOrEnter(): void       // Expand dir or open file
  collapseOrParent(): void    // Collapse dir or go to parent
  scrollToSelected(): void    // Keep selected item visible

  // Events (callbacks set by App)
  onFileSelect: (path: string) => void
  onDirectoryToggle: (entry: FileEntry) => void
}
```

Visual rendering per item:
```
  ▶ src/               # collapsed directory
  ▼ src/               # expanded directory
    📄 index.ts        # file with indent
    📄 app.ts
    ▶ components/      # nested collapsed
```

### 2.4 Keyboard Handling for File Tree
When the file tree is focused:
- **Up/Down arrows** - Move selection up/down
- **Enter** or **Right arrow** - Expand directory / open file
- **Left arrow** - Collapse directory / move to parent
- **Home** - Jump to first item
- **End** - Jump to last item
- **Page Up/Down** - Scroll by page

### 2.5 Integrate File Tree into Layout
- Add FileTree component to the sidebar area in layout.ts
- Wire up file tree events in app.ts
- Pass the current working directory (or CLI argument) as root path
- Handle the `onFileSelect` callback (placeholder for Phase 3)

### 2.6 Style the File Tree
- Selected item: `BG_HIGHLIGHT` background, `FG_PRIMARY` text
- Directory names: `ACCENT` color
- File names: `FG_PRIMARY` color
- Icons: appropriate colors
- Indent: 2 spaces per depth level
- Scrollbar: styled with theme colors

### 2.7 Write Tests

**Unit tests:**
- `tests/unit/file-service.test.ts`:
  - `readDirectory` returns sorted entries (dirs first)
  - `readDirectory` handles empty directories
  - `readDirectory` handles permission errors gracefully
  - `buildTree` returns one level deep
  - `expandDirectory` loads children lazily
  - `isTextFile` correctly identifies binary vs text
- `tests/unit/file-icons.test.ts`:
  - Returns correct icons for known extensions
  - Returns folder icons for directories
  - Returns default icon for unknown extensions

**Component tests:**
- `tests/component/file-tree.test.ts`:
  - Renders directory tree with correct indentation
  - Arrow key navigation moves selection
  - Enter expands/collapses directories
  - Selection scrolls into view
  - File selection emits callback

## Files Created/Modified
- `src/services/file-service.ts` (new)
- `src/utils/file-icons.ts` (new)
- `src/components/file-tree.ts` (new)
- `src/components/layout.ts` (modified - add file tree to sidebar)
- `src/app.ts` (modified - wire file tree events)
- `tests/unit/file-service.test.ts` (new)
- `tests/unit/file-icons.test.ts` (new)
- `tests/component/file-tree.test.ts` (new)

## Acceptance Criteria
- [ ] File tree renders in the sidebar showing current directory contents
- [ ] Directories can be expanded/collapsed with Enter or arrow keys
- [ ] Files show appropriate icons based on extension
- [ ] Keyboard navigation works (up/down/enter/left/right)
- [ ] Long file lists scroll with ScrollBox
- [ ] Selected item is visually highlighted
- [ ] All unit tests pass
- [ ] All component tests pass

## OpenTUI Components Used
- `ScrollBoxRenderable` - Scrollable container for the tree
- `BoxRenderable` - Row container per tree item
- `TextRenderable` - File/directory names and icons

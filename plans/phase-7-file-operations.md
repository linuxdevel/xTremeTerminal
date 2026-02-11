# Phase 7: File Operations

## Goal
Add file management operations: create new files/directories, rename, and delete -- all accessible from the file tree with keyboard shortcuts and confirmation dialogs.

## Dependencies
- Phase 5 completed (tabs, so new files can open in tabs)
- Phase 2 completed (file tree, file service)

## Steps

### 7.1 Extend File Service (`src/services/file-service.ts`)
Add file management operations:

```typescript
// New methods
createFile(dirPath: string, name: string): Promise<string>       // Returns full path
createDirectory(dirPath: string, name: string): Promise<string>
renameFile(oldPath: string, newName: string): Promise<string>    // Returns new path
deleteFile(path: string): Promise<void>
deleteDirectory(path: string): Promise<void>                     // Recursive
moveFile(oldPath: string, newPath: string): Promise<void>
copyFile(srcPath: string, destPath: string): Promise<void>
exists(path: string): Promise<boolean>
```

Error handling:
- File already exists -> throw with descriptive message
- Permission denied -> throw with descriptive message
- Directory not empty (for non-recursive delete) -> throw

### 7.2 Create Confirm Dialog Component (`src/components/confirm-dialog.ts`)
Reusable confirmation overlay:

```
┌──────────────────────────────────┐
│  Delete "utils.ts"?              │
│                                  │
│  This action cannot be undone.   │
│                                  │
│       [Yes]    [No]              │
└──────────────────────────────────┘
```

```typescript
class ConfirmDialog {
  private container: BoxRenderable    // Absolute positioned overlay
  private titleText: TextRenderable
  private messageText: TextRenderable
  private isVisible: boolean

  show(options: {
    title: string
    message: string
    confirmLabel?: string     // default: "Yes"
    cancelLabel?: string      // default: "No"
    onConfirm: () => void
    onCancel: () => void
  }): void

  hide(): void
}
```

Also create an inline text input for rename operations:
```typescript
class InlineInput {
  // Shows an InputRenderable at a specific position (e.g., over a tree item)
  show(initialValue: string, onSubmit: (value: string) => void, onCancel: () => void): void
  hide(): void
}
```

### 7.3 Create New File
- Shortcut: **Ctrl+N** (creates new untitled tab in editor)
- From file tree: Press **n** key when a directory is selected
  1. Show inline input in the tree at the selected position
  2. User types filename and presses Enter
  3. Create file via `FileService.createFile()`
  4. Refresh file tree
  5. Open the new file in a tab
- If target is a file, create in its parent directory

### 7.4 Create New Directory
- From file tree: Press **Shift+N** when a directory is selected
  1. Show inline input in the tree
  2. User types directory name and presses Enter
  3. Create directory via `FileService.createDirectory()`
  4. Refresh file tree
  5. Expand the parent directory

### 7.5 Rename File/Directory
- Shortcut: **F2** when file tree is focused
  1. Show inline input pre-filled with current name
  2. User edits name and presses Enter
  3. Rename via `FileService.renameFile()`
  4. If file is open in a tab, update tab title and path
  5. Refresh file tree

### 7.6 Delete File/Directory
- Shortcut: **Delete** key when file tree is focused
  1. Show confirmation dialog: "Delete {name}? This cannot be undone."
  2. If confirmed:
     - Close any open tab for this file
     - Delete via `FileService.deleteFile()` or `deleteDirectory()`
     - Refresh file tree
  3. If cancelled: do nothing

### 7.7 File Preview
When navigating the file tree (without pressing Enter to open):
- Show a small preview of the file content in the editor area
- Preview is read-only, dimmed, and disappears when pressing Enter (full open) or navigating away
- Only preview text files, show file info for binary/large files

### 7.8 Write Tests

**Unit tests:**
- `tests/unit/file-service.test.ts` (extended):
  - createFile creates a new file with empty content
  - createFile throws if file exists
  - createDirectory creates a new directory
  - renameFile changes file name on disk
  - renameFile returns new path correctly
  - deleteFile removes file
  - deleteDirectory removes directory and contents
  - exists returns true/false correctly
  - Permission error handling

**Component tests:**
- `tests/component/confirm-dialog.test.ts`:
  - Show displays the dialog with correct title/message
  - Yes button triggers onConfirm
  - No button / Escape triggers onCancel
  - Dialog is hidden after action

**Integration tests:**
- `tests/integration/file-operations.test.ts`:
  - Create new file from tree, verify file exists on disk
  - Create new directory, verify it appears in tree
  - Rename file, verify old path gone, new path exists
  - Rename open file, verify tab title updates
  - Delete file with confirmation, verify removed from disk and tree
  - Delete cancelled, verify file still exists
  - Delete open file, verify tab closes

## Files Created/Modified
- `src/services/file-service.ts` (modified - add create/rename/delete)
- `src/components/confirm-dialog.ts` (new)
- `src/components/file-tree.ts` (modified - add inline input, delete/rename shortcuts)
- `src/app.ts` (modified - wire file operations)
- `tests/unit/file-service.test.ts` (modified - add new tests)
- `tests/component/confirm-dialog.test.ts` (new)
- `tests/integration/file-operations.test.ts` (new)

## Acceptance Criteria
- [ ] Ctrl+N creates a new untitled tab
- [ ] Press 'n' in tree creates a new file in selected directory
- [ ] Press 'N' in tree creates a new directory
- [ ] F2 renames the selected file/directory
- [ ] Rename updates open tabs with the new filename
- [ ] Delete key deletes with confirmation dialog
- [ ] Deleting an open file closes its tab
- [ ] Confirmation dialog shows and responds to Yes/No/Escape
- [ ] File tree refreshes after all operations
- [ ] Error messages display in status bar on failure
- [ ] All tests pass

## OpenTUI Components Used
- `BoxRenderable` - Dialog container (absolute positioned)
- `TextRenderable` - Dialog text
- `InputRenderable` - Inline rename/create input

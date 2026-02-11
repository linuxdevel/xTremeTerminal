# Phase 9: Polish & Edge Cases

## Goal
Handle terminal resize, large files, binary detection, exit confirmation, error resilience, and responsive layout adjustments. Final polish pass over the entire application.

## Dependencies
- All previous phases completed

## Steps

### 9.1 Terminal Resize Handling
```typescript
renderer.on("resize", (width, height) => {
  // Recalculate layout
  // If terminal is too small (< 40 cols or < 10 rows), show warning
  // Adjust sidebar width proportionally
  // Reflow editor content
})
```

- Minimum terminal size: 40 columns x 10 rows
- If below minimum, show a centered message: "Terminal too small. Resize to at least 40x10."
- Sidebar width: fixed at 25 columns, but hides automatically below 60 columns

### 9.2 Sidebar Toggle (Ctrl+B)
- Toggle sidebar visibility
- When hidden, editor takes full width
- When shown, editor shrinks to accommodate sidebar
- Remember toggle state across tab switches

### 9.3 Large File Handling
- Files over 1MB: show warning before loading, offer to open anyway
- Files over 10MB: refuse to open, show size in status bar
- Use `ScrollBoxRenderable` with `viewportCulling: true` for performance
- Line count limits: warn above 50,000 lines

### 9.4 Binary File Detection
In `FileService.isTextFile()`:
- Check first 8KB of file for null bytes
- If null bytes found, it's binary -> show "Binary file - cannot edit" in editor area
- Known binary extensions (`.png`, `.jpg`, `.zip`, etc.) skip content check

### 9.5 Exit Confirmation
When user presses Ctrl+C or the app is about to exit:
1. Check `TabManager.hasUnsavedTabs()`
2. If unsaved tabs exist, show confirmation:
   ```
   You have unsaved changes in 3 files. Exit anyway? [Y/n]
   ```
3. Y or Enter: destroy renderer and exit
4. n or Escape: cancel exit, return to editor

### 9.6 Error Resilience
- Wrap all file operations in try/catch
- Display user-friendly error messages in status bar
- Never crash the TUI on unhandled errors
- Add process-level error handlers:
  ```typescript
  process.on("uncaughtException", (error) => {
    // Log to file, show in status bar
  })
  process.on("unhandledRejection", (error) => {
    // Log to file, show in status bar
  })
  ```

### 9.7 File Watcher (Optional Enhancement)
- Watch open files for external changes
- If a file changes on disk while open:
  - If not modified in editor: reload silently
  - If modified in editor: show prompt "File changed on disk. Reload?"

### 9.8 Performance Optimization
- Debounce file tree refresh (don't refresh on every keystroke during rename)
- Debounce status bar cursor updates (don't update every character movement)
- Lazy-load file tree directories (only expand when requested)
- Viewport culling for large files in editor

### 9.9 Accessibility
- All interactive elements should be reachable via keyboard
- Focus indicators should be clearly visible
- Status bar messages should be descriptive

### 9.10 Write Tests

**Integration tests:**
- `tests/integration/large-file.test.ts`:
  - Open file over 1MB shows warning
  - File over 10MB is refused
  - Large file with many lines scrolls correctly
  - Viewport culling works (performance)

- `tests/integration/sidebar-toggle.test.ts`:
  - Ctrl+B hides sidebar
  - Ctrl+B again shows sidebar
  - Editor expands to full width when sidebar hidden
  - File tree state preserved when sidebar hidden/shown
  - Layout adjusts correctly after toggle

Additional edge case tests:
- Open file that gets deleted externally
- Open file with no read permission
- Very long filenames in tree and tab bar
- Very long lines in editor (horizontal scroll)
- Empty directory in file tree
- Deeply nested directory structure

## Files Created/Modified
- `src/app.ts` (modified - resize handling, exit confirmation, error handlers)
- `src/components/layout.ts` (modified - sidebar toggle, minimum size check)
- `src/components/editor.ts` (modified - large file handling, binary detection)
- `src/components/file-tree.ts` (modified - responsive width)
- `src/services/file-service.ts` (modified - binary detection, file size checks)
- `tests/integration/large-file.test.ts` (new)
- `tests/integration/sidebar-toggle.test.ts` (new)

## Acceptance Criteria
- [ ] Terminal resize adjusts layout correctly
- [ ] "Terminal too small" warning shows below minimum size
- [ ] Ctrl+B toggles sidebar
- [ ] Large files show warning / are refused
- [ ] Binary files show warning instead of content
- [ ] Exit with unsaved changes shows confirmation
- [ ] File operation errors display in status bar
- [ ] App never crashes on unhandled errors
- [ ] Performance is acceptable with large files (viewport culling)
- [ ] All tests pass

## Final Verification Checklist
- [ ] Run full test suite: `bun test`
- [ ] Run with coverage: `bun test --coverage`
- [ ] Test manually with various file types
- [ ] Test with very large terminal and very small terminal
- [ ] Test all keyboard shortcuts listed in docs/keyboard-shortcuts.md
- [ ] Verify clean exit with `renderer.destroy()`
- [ ] Verify all documentation is accurate and up to date

# Phase 11: Bug Fixes, Menu Bar, Help System & UX Improvements

## Overview

This phase addresses bugs found during user testing and adds a menu bar with help system. Five items to implement:

1. **Fix tab switching keybinding** — `Ctrl+Tab` doesn't work in WSL/Windows Terminal
2. **Fix cursor position tracking** — Status bar always shows `Ln 1, Col 1`
3. **Disable Ctrl+C quit** — Prevent accidental termination; Ctrl+C only copies when selection exists
4. **Exit confirmation for unsaved changes** — `Ctrl+Q` warns before quitting if files are modified
5. **Menu bar + Help system** — Top menu bar with File and Help menus, triggered by `Ctrl+M`

---

## 1. Fix Tab Switching Keybinding

### Problem
`Ctrl+Tab` is intercepted by WSL/Windows Terminal to switch between terminal instances, so it never reaches xTerm.

### Solution
Change tab switching to `Alt+Right` / `Alt+Left` (meta modifier, which passes through terminals).

### Files to Modify
- `src/keybindings.ts` — Change `KB_NEXT_TAB` and `KB_PREV_TAB` definitions
- `src/app.ts` — Update `registerCommands()` shortcut labels
- `docs/keyboard-shortcuts.md` — Update docs
- `docs/user-guide.md` — Update docs
- `tests/unit/keybindings.test.ts` — Update test expectations

### Implementation
```typescript
export const KB_NEXT_TAB: KeyBinding = {
  key: "right",
  meta: true,
  description: "Next tab",
};

export const KB_PREV_TAB: KeyBinding = {
  key: "left",
  meta: true,
  description: "Previous tab",
};
```

---

## 2. Fix Cursor Position Tracking

### Problem
The status bar always shows `Ln 1, Col 1` even when navigating through a file.

### Root Cause Analysis
The `onCursorChange` callback in `editor.ts` fires and calls `updateStatusBar()` in `app.ts`. The status bar reads from `editor.state` which returns `{ cursorLine: this._cursorLine, cursorColumn: this._cursorColumn }`. These ARE updated by the `onCursorChange` event. However, the TextareaRenderable's `onCursorChange` event may not fire on every keystroke if the keystroke is handled externally via `handleKeyPress()` rather than through internal focus-based event processing.

### Solution
After `editor.handleKeyPress()` in app.ts, always call `updateStatusBar()` to ensure cursor position is refreshed. Also verify that the textarea's onCursorChange callback fires properly.

### Files to Modify
- `src/app.ts` — Add `updateStatusBar()` call after editor key delegation

---

## 3. Disable Ctrl+C Quit

### Problem
Users accidentally kill xTerm by pressing Ctrl+C out of habit.

### Solution
Remove Ctrl+C as a quit shortcut entirely. Ctrl+C should ONLY copy text when there is a selection in the editor. When there's no selection, Ctrl+C should do nothing (it's already consumed by the editor returning false, then app would previously quit — we remove that fallback).

### Files to Modify
- `src/app.ts` — Remove the Ctrl+C quit handler block
- `src/components/editor.ts` — Ctrl+C with no selection now returns true (consume it, do nothing)
- `docs/keyboard-shortcuts.md` — Remove Ctrl+C as exit shortcut
- `docs/user-guide.md` — Update exit section

---

## 4. Exit Confirmation for Unsaved Changes

### Problem
`Ctrl+Q` quits immediately even if files have unsaved changes.

### Solution
When `quit()` is called and there are unsaved tabs, show the existing `ConfirmDialog` asking whether to exit. Only if confirmed, call `forceQuit()`.

### Files to Modify
- `src/app.ts` — Split `quit()` into `quit()` + `forceQuit()`, add unsaved check

### Implementation
```typescript
quit(): void {
  const unsavedTabs = this.tabManager.getAllTabs().filter(t => t.isModified);
  if (unsavedTabs.length > 0) {
    this._previousFocus = this._focus;
    this.confirmDialog.show({
      title: "Unsaved Changes",
      message: `${unsavedTabs.length} file(s) have unsaved changes. Exit?`,
      confirmLabel: "Exit",
      cancelLabel: "Cancel",
      onConfirm: () => this.forceQuit(),
      onCancel: () => this.setFocus(this._previousFocus === "confirm" ? "editor" : this._previousFocus),
    });
    return;
  }
  this.forceQuit();
}

private forceQuit(): void {
  this._isRunning = false;
  // ... existing cleanup ...
}
```

---

## 5. Menu Bar + Help System

### 5a. Keybinding Changes

| Old Binding | New Binding | Action |
|-------------|-------------|--------|
| `Ctrl+H` (Find & Replace) | `Ctrl+Shift+H` | Find and Replace |
| — (new) | `Ctrl+M` | Open menu bar |

### 5b. Menu Bar Component (`src/components/menu-bar.ts`)

A horizontal menu bar at the top of the screen with dropdown menus.

**Layout:**
```
 File  Help
```

**Behavior:**
- `Ctrl+M` opens the menu bar (focuses first menu item "File")
- Left/Right arrows switch between menu items
- Enter or Down arrow opens the dropdown
- Up/Down arrows navigate within dropdown
- Enter selects a dropdown item
- Escape closes the menu

**File menu items:**
- Open File → focuses the file tree (Ctrl+E behavior)
- Save File → saves current file (Ctrl+S behavior)
- Exit → quit with unsaved check

**Help menu items:**
- Search Docs → opens help search dialog
- Help Topics → shows list of help topics
- About → shows about dialog

### 5c. Help Dialog (`src/components/help-dialog.ts`)

Modal overlay that shows help content.

**Modes:**
1. **Search mode** — Input field where user types a search term. Searches through all docs/*.md files for matching content and displays results.
2. **Topics mode** — Shows a selectable list of help topics:
   - Keyboard Shortcuts
   - Getting Started
   - User Guide
   - Configuration
   - Architecture

When a topic is selected, displays the content of the corresponding doc file in a scrollable text view.

### 5d. About Dialog (`src/components/about-dialog.ts`)

Simple modal overlay showing:
- App name: xTerm
- Version (from package.json)
- Author info
- License: GPL-3.0
- Project link: https://github.com/linuxdevel/xTremeTerminal
- Press Escape to close

### 5e. Layout Changes

The layout needs a new row for the menu bar at the very top:

```
┌─────────────────────────────────────────────┐
│  Menu Bar (height: 1)                        │  ← NEW
├─────────────────────────────────────────────┤
│  Tab Bar (height: 1)                         │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Editor Area                      │
├──────────┴──────────────────────────────────┤
│  Status Bar (height: 1)                      │
└─────────────────────────────────────────────┘
```

### 5f. Focus Target

Add `"menu"` and `"help"` to the `FocusTarget` type.

---

## Files Summary

### New Files
- `src/components/menu-bar.ts`
- `src/components/help-dialog.ts`
- `src/components/about-dialog.ts`

### Modified Files
- `src/keybindings.ts` — New bindings, changed bindings
- `src/app.ts` — Menu/help/about integration, exit confirmation, cursor fix, Ctrl+C removal
- `src/components/layout.ts` — Add menu bar row
- `src/components/editor.ts` — Ctrl+C behavior change (consume when no selection)
- `src/theme.ts` — Menu bar colors if needed
- `docs/keyboard-shortcuts.md` — Update all changed shortcuts
- `docs/user-guide.md` — Update all changed shortcuts, add menu/help section
- `tests/unit/keybindings.test.ts` — Update test expectations

---

## Implementation Order

1. Update keybindings (tab keys, Ctrl+Shift+H for replace, Ctrl+M for menu)
2. Fix cursor position tracking
3. Disable Ctrl+C quit
4. Add exit confirmation
5. Create menu bar component
6. Update layout for menu bar
7. Create help dialog
8. Create about dialog
9. Wire everything into app.ts
10. Update docs
11. Update tests
12. Run tests and fix failures

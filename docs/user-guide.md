# User Guide

This is the complete usage manual for xTerm, covering all features from file browsing to advanced text editing.

## Table of Contents

- [Interface Overview](#interface-overview)
- [File Tree Browser](#file-tree-browser)
- [Text Editor](#text-editor)
- [Tabs](#tabs)
- [Search and Replace](#search-and-replace)
- [File Operations](#file-operations)
- [Menu Bar](#menu-bar)
- [Command Palette](#command-palette)
- [Help System](#help-system)
- [Status Bar](#status-bar)

---

## Interface Overview

xTerm uses a VS Code-style layout with five main areas:

```
┌─────────────────────────────────────────────────────────┐
│  Menu Bar                                                │
├─────────────────────────────────────────────────────────┤
│  Tab Bar                                                 │
├──────────────┬──────────────────────────────────────────┤
│              │                                           │
│  File Tree   │  Editor                                   │
│  (Sidebar)   │                                           │
│              │                                           │
├──────────────┴──────────────────────────────────────────┤
│  Status Bar                                              │
└─────────────────────────────────────────────────────────┘
```

### Menu Bar
A top-level menu bar with **File** and **Help** menus. Open it with **F10** and navigate with arrow keys.

### Tab Bar
Shows all currently open files. The active tab is highlighted with an accent color. Tabs with unsaved changes show a dot indicator.

### File Tree (Sidebar)
An expandable/collapsible directory tree on the left side. Toggle visibility with **Ctrl+B**.

### Editor
The main text editing area with line numbers, syntax highlighting, and cursor.

### Status Bar
Shows current file info: filename, cursor position, language, encoding, and modification state. Also displays temporary messages for operations like save or errors.

---

## File Tree Browser

The file tree shows the directory structure starting from the directory where xTerm was launched (or the path provided as a CLI argument).

### Navigation

| Key | Action |
|-----|--------|
| Up / Down | Move selection up / down |
| Enter / Right | Expand directory or open file |
| Left | Collapse directory or move to parent |
| Home | Jump to first item |
| End | Jump to last item |
| Page Up / Down | Scroll by page |

### Visual Indicators

- `▶` Collapsed directory
- `▼` Expanded directory
- Icons are shown based on file type (e.g., TypeScript, JavaScript, JSON, Markdown)
- The selected item is highlighted with a distinct background color

### File Filtering

Press **Ctrl+P** to activate file search/filter mode. Type a filename pattern to filter the tree and quickly jump to a file.

### Directory Loading

Directories are loaded lazily -- children are only read from disk when you expand a directory. This keeps the tree responsive even in large projects.

---

## Text Editor

### Basic Editing

xTerm provides a full text editor with all standard editing operations:

- **Type** to insert text at the cursor position
- **Backspace** deletes the character before the cursor
- **Delete** deletes the character after the cursor
- **Enter** inserts a new line

### Cursor Movement

| Key | Action |
|-----|--------|
| Arrow keys | Move cursor one character/line |
| Home | Move to beginning of line |
| End | Move to end of line |
| Page Up | Move up one page |
| Page Down | Move down one page |
| Ctrl+Left | Move to previous word |
| Ctrl+Right | Move to next word |

### Text Selection

Hold **Shift** while pressing movement keys to select text:

| Key | Action |
|-----|--------|
| Shift+Arrow | Select character by character |
| Shift+Home | Select to line start |
| Shift+End | Select to line end |
| Ctrl+A | Select all text |

### Clipboard

| Key | Action |
|-----|--------|
| Ctrl+C | Copy selected text |
| Ctrl+X | Cut selected text |
| Ctrl+V | Paste clipboard content |

Note: xTerm uses an internal clipboard buffer. System clipboard integration may be available depending on your terminal's OSC 52 support. Ctrl+C only copies when text is selected; it does not exit the application.

### Undo / Redo

| Key | Action |
|-----|--------|
| Ctrl+Z | Undo last change |
| Ctrl+Y | Redo last undone change |

Undo history is maintained per-tab. Consecutive character typing is merged into single undo operations so you don't have to undo character by character.

### Saving Files

| Key | Action |
|-----|--------|
| Ctrl+S | Save the current file |

The status bar shows a confirmation message when the file is saved, and the modified indicator on the tab disappears.

### Syntax Highlighting

xTerm automatically detects the programming language based on the file extension and applies syntax highlighting using Tree-sitter. Supported languages include:

- TypeScript / JavaScript / JSX / TSX
- Python
- Rust
- Go
- Zig
- HTML / CSS
- JSON / YAML / TOML
- Markdown
- Bash / Shell
- And more

The detected language is shown in the status bar.

### Line Numbers

Line numbers are displayed in a gutter on the left side of the editor. The current line is highlighted.

---

## Tabs

xTerm supports multiple open files using a tabbed interface.

### Opening Tabs

- **Select a file** in the file tree and press **Enter** -- it opens in a new tab
- If the file is already open, xTerm switches to the existing tab instead of opening a duplicate

### Switching Tabs

| Key | Action |
|-----|--------|
| Alt+Right | Switch to the next tab |
| Alt+Left | Switch to the previous tab |

### Closing Tabs

| Key | Action |
|-----|--------|
| Ctrl+W | Close the current tab |

If the file has unsaved changes, xTerm will ask for confirmation before closing:

```
Save changes to filename.ts? [Y/n/Cancel]
```

- **Y** or **Enter**: Save and close
- **n**: Discard changes and close
- **Cancel** or **Escape**: Cancel, keep the tab open

### Tab Indicators

- Active tab: highlighted background with accent color
- Modified tab: shows a **dot** before the filename
- Each tab independently tracks: cursor position, scroll position, undo history

### Creating New Files

| Key | Action |
|-----|--------|
| Ctrl+N | Create a new untitled tab |

---

## Search and Replace

### Find

Press **Ctrl+F** to open the search dialog:

```
┌─────────────────────────────────────┐
│ Find:    [search term          ] ↑↓ │
│ 3 of 12 matches                     │
└─────────────────────────────────────┘
```

- Type your search term -- matches are highlighted in real-time
- Press **Enter** or the down arrow to jump to the next match
- Press **Shift+Enter** or the up arrow to jump to the previous match
- Press **Escape** to close the search dialog

### Find and Replace

Press **Ctrl+Shift+H** to open the find and replace dialog:

```
┌─────────────────────────────────────┐
│ Find:    [search term          ] ↑↓ │
│ Replace: [replacement          ]    │
│ [Replace] [Replace All] [Close]     │
│ 3 of 12 matches                     │
└─────────────────────────────────────┘
```

- **Replace**: Replace the current match and move to the next
- **Replace All**: Replace all matches at once
- Match count updates as you type

---

## File Operations

### From the File Tree

| Key | Action |
|-----|--------|
| n | Create a new file in the selected directory |
| N (Shift+n) | Create a new directory |
| F2 | Rename the selected file or directory |
| Delete | Delete the selected file or directory |

### Create New File/Directory

1. Select a directory in the file tree (or a file -- its parent directory will be used)
2. Press **n** for a new file or **N** for a new directory
3. Type the name and press **Enter**
4. The new item appears in the tree and (for files) opens in a new tab

### Rename

1. Select the file or directory in the file tree
2. Press **F2**
3. Edit the name and press **Enter**
4. If the file is open in a tab, the tab title updates automatically

### Delete

1. Select the file or directory in the file tree
2. Press **Delete**
3. A confirmation dialog appears: "Delete {name}? This action cannot be undone."
4. Press **Y** to confirm or **N** / **Escape** to cancel
5. If the file was open in a tab, the tab is closed

---

## Menu Bar

Press **F10** to open the menu bar at the top of the screen.

### File Menu

| Item | Shortcut | Action |
|------|----------|--------|
| Open File | Ctrl+E | Focus the file tree |
| Save File | Ctrl+S | Save the current file |
| Exit | Ctrl+Q | Exit xTerm |

### Help Menu

| Item | Action |
|------|--------|
| Search Docs | Search through documentation files |
| Help Topics | Browse help topics |
| About | Show About dialog |

### Navigation

- Use **Left / Right** arrows to switch between menus
- Press **Enter** or **Down** to open a dropdown
- Use **Up / Down** arrows to navigate dropdown items
- Press **Enter** to execute an item
- Press **Escape** to close

---

## Command Palette

Press **Ctrl+Shift+P** to open the command palette:

```
┌────────────────────────────────────────┐
│ > search commands...                    │
├────────────────────────────────────────┤
│   Save File                  Ctrl+S    │
│   New File                   Ctrl+N    │
│   Close Tab                  Ctrl+W    │
│   Find                       Ctrl+F    │
│   Toggle Sidebar             Ctrl+B    │
│   ...                                  │
└────────────────────────────────────────┘
```

- Type to filter commands by name
- Use **Up / Down** arrows to navigate
- Press **Enter** to execute the selected command
- Press **Escape** to close without executing

---

## Help System

xTerm includes a built-in help system accessible from the **Help** menu (F10, then navigate to Help).

### Help Topics

Browse through available documentation topics:

- **Keyboard Shortcuts** — Complete shortcut reference
- **Getting Started** — Quick start guide
- **User Guide** — This document
- **Configuration** — Configuration options
- **Architecture** — Technical design

Navigate with **Up / Down** arrows and press **Enter** to view a topic. Press **Escape** to go back to the topic list.

### Search Documentation

Search through all documentation files for specific keywords. Type your query and matching lines from all help files are shown with their source file and line number.

### About Dialog

Shows application information: version, author, license, and project link.

---

## Status Bar

The status bar at the bottom shows:

```
 index.ts | Ln 3, Col 12 | TypeScript | UTF-8 | 4 spaces | Modified
```

| Section | Description |
|---------|-------------|
| Filename | Name of the current file (or "Untitled") |
| Ln, Col | Current cursor position (line and column) |
| Language | Detected programming language |
| Encoding | File encoding (UTF-8) |
| Indent | Indentation style (spaces or tabs) |
| Modified | Shows when the file has unsaved changes |

### Temporary Messages

The status bar also displays temporary messages:
- "File saved" after Ctrl+S
- Error messages for failed operations (e.g., "Error: Permission denied")
- These messages appear briefly then return to the normal display

---

## Exiting

Press **Ctrl+Q** to exit xTerm. If you have unsaved changes, a confirmation dialog will appear:

```
Unsaved Changes — 3 file(s) have unsaved changes. Exit?
[Exit] [Cancel]
```

- **Exit**: Exit immediately (changes are lost)
- **Cancel** or **Escape**: Cancel and return to the editor

---

## Tips and Tricks

1. **Toggle the sidebar** with Ctrl+B to get more editor space when you don't need the file tree
2. **Use the command palette** (Ctrl+Shift+P) when you forget a shortcut
3. **Use the menu bar** (F10) for quick access to file operations and help
4. **Ctrl+P** quickly filters the file tree to find files by name
5. **Ctrl+E** focuses the file tree, **Ctrl+G** focuses the editor -- quick panel switching
6. **Tabs preserve state** -- your cursor position and scroll are remembered per tab
7. **Search documentation** from the Help menu to find answers without leaving the editor

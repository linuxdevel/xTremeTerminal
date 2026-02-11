// src/help-content.ts — Embedded documentation content for the compiled binary
//
// When xTremeTerminal is compiled into a standalone binary (bun build --compile),
// external doc files in docs/ are not bundled. This module embeds the
// documentation content directly so the help system works in release builds.

export interface EmbeddedDoc {
  readonly filename: string;
  readonly title: string;
  readonly content: string;
}

export const EMBEDDED_DOCS: readonly EmbeddedDoc[] = [
  {
    filename: "keyboard-shortcuts.md",
    title: "Keyboard Shortcuts",
    content: `# Keyboard Shortcuts

Complete reference of all keyboard shortcuts in xTremeTerminal.

---

## Global Shortcuts

These work regardless of which component is focused.

| Shortcut | Action |
|----------|--------|
| Ctrl+Q | Exit xTremeTerminal (with unsaved changes confirmation) |
| Ctrl+B | Toggle sidebar visibility |
| Ctrl+Shift+P | Open command palette |
| F10 | Open menu bar |

---

## File Operations

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save current file |
| Ctrl+N | New untitled file (opens in new tab) |

---

## Tab Management

| Shortcut | Action |
|----------|--------|
| Alt+Right | Switch to next tab |
| Alt+Left | Switch to previous tab |
| Ctrl+W | Close current tab |

---

## Navigation

| Shortcut | Action |
|----------|--------|
| Ctrl+E | Focus file tree |
| Ctrl+G | Focus editor |

---

## Editor - Cursor Movement

| Shortcut | Action |
|----------|--------|
| Up / Down / Left / Right | Move cursor by one character or line |
| Home | Move to beginning of current line |
| End | Move to end of current line |
| Page Up | Move up one page |
| Page Down | Move down one page |
| Ctrl+Left | Move to previous word boundary |
| Ctrl+Right | Move to next word boundary |
| Ctrl+Home | Move to beginning of file |
| Ctrl+End | Move to end of file |

---

## Editor - Text Selection

| Shortcut | Action |
|----------|--------|
| Shift+Up | Select line above |
| Shift+Down | Select line below |
| Shift+Left | Extend selection left by one character |
| Shift+Right | Extend selection right by one character |
| Shift+Home | Select to beginning of line |
| Shift+End | Select to end of line |
| Ctrl+Shift+Left | Select to previous word boundary |
| Ctrl+Shift+Right | Select to next word boundary |
| Ctrl+A | Select all text |

---

## Editor - Editing

| Shortcut | Action |
|----------|--------|
| Backspace | Delete character before cursor |
| Delete | Delete character after cursor |
| Enter | Insert new line |
| Tab | Insert indentation (4 spaces) |
| Ctrl+Z | Undo last change |
| Ctrl+Y | Redo last undone change |
| Ctrl+Shift+Z | Redo (alternative) |

---

## Editor - Clipboard

| Shortcut | Action |
|----------|--------|
| Ctrl+C | Copy selected text (when text is selected) |
| Ctrl+X | Cut selected text |
| Ctrl+V | Paste from clipboard |

Note: Ctrl+C only copies when text is selected; it does not exit the application.

---

## Search and Replace

| Shortcut | Action |
|----------|--------|
| Ctrl+F | Open find dialog |
| Ctrl+Shift+H | Open find and replace dialog |
| Enter | Next match (when find dialog is focused) |
| Shift+Enter | Previous match (when find dialog is focused) |
| Escape | Close search dialog |

---

## Menu Bar

| Shortcut | Action |
|----------|--------|
| F10 | Open/close menu bar |
| Left / Right | Navigate between menus |
| Down / Enter | Open dropdown for selected menu |
| Up / Down | Navigate dropdown items |
| Enter | Execute selected menu item |
| Escape | Close menu bar |

---

## File Tree

These shortcuts work when the file tree is focused.

| Shortcut | Action |
|----------|--------|
| Up / Down | Move selection up / down |
| Enter | Expand directory or open file |
| Right | Expand directory |
| Left | Collapse directory or move to parent |
| Home | Jump to first item |
| End | Jump to last item |
| Page Up / Down | Scroll by page |
| n | Create new file in selected directory |
| N (Shift+n) | Create new directory in selected directory |
| F2 | Rename selected item |
| Delete | Delete selected item (with confirmation) |

---

## Command Palette

These shortcuts work when the command palette is open.

| Shortcut | Action |
|----------|--------|
| Up / Down | Navigate command list |
| Enter | Execute selected command |
| Escape | Close command palette |
| Type text | Filter commands by name |`,
  },
  {
    filename: "getting-started.md",
    title: "Getting Started",
    content: `# Getting Started

This guide walks you through installing and running xTremeTerminal for the first time.

## Prerequisites

### 1. Bun (required)

xTremeTerminal runs on Bun, a fast JavaScript/TypeScript runtime.

  # Install Bun
  curl -fsSL https://bun.sh/install | bash

  # Verify installation
  bun --version   # Should be >= 1.0

### 2. Zig (required for building from source)

Zig is needed to compile OpenTUI's native terminal rendering library.

### 3. Terminal

xTremeTerminal works best with a modern terminal emulator that supports:
- True color (24-bit color) - for the full Tokyo Night theme
- 256 colors minimum - basic theme support
- Alternate screen buffer - xTremeTerminal takes over the full terminal

Recommended terminals: Kitty, Alacritty, WezTerm, iTerm2, Windows Terminal, GNOME Terminal.

## Installation

### Quick Install (Pre-built Binary)

  curl -fsSL https://raw.githubusercontent.com/linuxdevel/xTremeTerminal/main/install.sh | bash

### From Source

  git clone https://github.com/linuxdevel/xTremeTerminal.git
  cd xTremeTerminal
  bun install
  bun run src/index.ts

## First Run

### Opening in the Current Directory

  bun run src/index.ts

This opens xTremeTerminal with the file tree showing the current working directory.

## Your First Session

When xTremeTerminal launches, you'll see a file tree on the left and the editor on the right.

### Basic Workflow

1. Navigate the file tree using the Up and Down arrow keys
2. Expand a directory by pressing Enter or Right arrow
3. Open a file by selecting it and pressing Enter
4. Edit the file -- just start typing
5. Save your changes with Ctrl+S
6. Open another file -- it opens in a new tab
7. Switch between tabs with Alt+Right / Alt+Left
8. Exit with Ctrl+Q

### Key Things to Know

- The file tree is on the left; the editor is on the right
- Tabs appear at the top when you have multiple files open
- The status bar at the bottom shows the current file, cursor position, and language
- A dot before a tab name means the file has unsaved changes
- Press Ctrl+B to toggle the sidebar if you need more editor space
- Press Ctrl+Shift+P to open the command palette for all available actions`,
  },
  {
    filename: "user-guide.md",
    title: "User Guide",
    content: `# User Guide

Complete usage manual for xTremeTerminal.

## Interface Overview

xTremeTerminal uses a VS Code-style layout with five main areas:

- Menu Bar (top) - File and Help menus, open with F10
- Tab Bar - shows all open files
- File Tree (left sidebar) - directory browser, toggle with Ctrl+B
- Editor (right) - main text editing area with line numbers and syntax highlighting
- Status Bar (bottom) - file info, cursor position, language

## File Tree Browser

### Navigation

| Key | Action |
|-----|--------|
| Up / Down | Move selection up / down |
| Enter / Right | Expand directory or open file |
| Left | Collapse directory or move to parent |
| Home | Jump to first item |
| End | Jump to last item |
| Page Up / Down | Scroll by page |

## Text Editor

### Basic Editing

- Type to insert text at the cursor position
- Backspace deletes the character before the cursor
- Delete deletes the character after the cursor
- Enter inserts a new line
- Tab inserts 4 spaces

### Cursor Movement

Arrow keys, Home/End, Page Up/Down, Ctrl+Left/Right for word movement,
Ctrl+Home/End for file start/end.

### Text Selection

Hold Shift while pressing movement keys to select text.
Ctrl+A selects all text.

### Clipboard

| Key | Action |
|-----|--------|
| Ctrl+C | Copy selected text |
| Ctrl+X | Cut selected text |
| Ctrl+V | Paste clipboard content |

### Undo / Redo

Ctrl+Z to undo, Ctrl+Y or Ctrl+Shift+Z to redo.

### Saving Files

Ctrl+S saves the current file.

### Syntax Highlighting

xTremeTerminal automatically detects the programming language based on the file
extension and applies syntax highlighting using Tree-sitter.

## Tabs

- Select a file in the tree and press Enter to open it in a new tab
- Alt+Right / Alt+Left to switch tabs
- Ctrl+W to close the current tab
- Ctrl+N to create a new untitled tab

## Search and Replace

- Ctrl+F opens find dialog
- Ctrl+Shift+H opens find and replace dialog
- Enter / Shift+Enter to navigate matches
- Escape to close

## File Operations (in File Tree)

| Key | Action |
|-----|--------|
| n | Create new file |
| N (Shift+n) | Create new directory |
| F2 | Rename |
| Delete | Delete (with confirmation) |

## Menu Bar

Press F10 to open. Use arrow keys to navigate, Enter to select, Escape to close.

## Command Palette

Press Ctrl+Shift+P. Type to filter commands, Enter to execute, Escape to close.

## Exiting

Press Ctrl+Q. If you have unsaved changes, a confirmation dialog will appear.`,
  },
  {
    filename: "configuration.md",
    title: "Configuration",
    content: `# Configuration

xTremeTerminal uses a Tokyo Night inspired dark theme by default.

## Theme

### Color Palette

#### Background Colors

| Constant | Hex | Usage |
|----------|-----|-------|
| BG_PRIMARY | #1a1b26 | Editor background |
| BG_SECONDARY | #16161e | Sidebar, tab bar, status bar |
| BG_HIGHLIGHT | #24283b | Current line, hover state |
| BG_SELECTION | #283457 | Text selection |

#### Foreground Colors

| Constant | Hex | Usage |
|----------|-----|-------|
| FG_PRIMARY | #a9b1d6 | Default text |
| FG_SECONDARY | #565f89 | Comments, inactive tabs |
| FG_MUTED | #3b4261 | Line numbers, borders |

#### Accent Colors

| Constant | Hex | Usage |
|----------|-----|-------|
| ACCENT | #7aa2f7 | Active tab, cursor |
| ERROR | #f7768e | Error messages |
| WARNING | #e0af68 | Warnings, modified indicator |
| SUCCESS | #9ece6a | Success messages, strings |
| INFO | #7dcfff | Info messages, types |

## Editor Settings

- Indentation: 4 spaces (soft tabs)
- Word Wrap: Off
- Encoding: UTF-8

## File Handling

| Size | Behavior |
|------|----------|
| < 1 MB | Opens normally |
| 1 MB - 10 MB | Warning shown |
| > 10 MB | Refused |

Binary files are detected and cannot be edited.

## Terminal Requirements

| Feature | Minimum | Recommended |
|---------|---------|-------------|
| Terminal size | 40 x 10 | 120 x 40+ |
| Color support | 256 colors | True color (24-bit) |
| Alternate screen | Required | Required |`,
  },
  {
    filename: "architecture.md",
    title: "Architecture",
    content: `# Architecture

Technical architecture overview for xTremeTerminal.

## Design Principles

### 1. Separation of Concerns

- Components (src/components/) - TUI rendering + user interaction
- Services (src/services/) - Business logic + state management
- Utilities (src/utils/) - Pure functions, mappings

Services have zero TUI dependency and can be tested without a renderer.

### 2. App as Orchestrator

src/app.ts is the central coordinator. It creates the renderer,
instantiates all components and services, wires them together via
callbacks, routes keyboard events, and manages global state.

Components never communicate directly with each other.

### 3. State Flows Down, Events Flow Up

The App passes state into components. Components emit events back to
the App. The App processes events, updates state, and pushes new state
to affected components.

## Component Architecture

### Layout Hierarchy

renderer.root
  RootContainer (column)
    MenuBar (height: 1)
    TabBar (height: 1)
    MiddleRow (row, flexGrow: 1)
      Sidebar (width: 25)
        FileTree / ScrollBox / TreeItems
      EditorArea (flexGrow: 1)
        LineNumbers + Textarea
    StatusBar (height: 1)

## Service Architecture

### FileService - All file system I/O
### TabManager - Open tabs state management
### Clipboard - Internal copy/cut/paste buffer

## Focus Management

Two focus zones: File Tree and Editor.
Ctrl+E focuses the file tree, Ctrl+G focuses the editor.
Overlays (confirm dialog, search, command palette) are modal.

## Technology Choices

- OpenTUI: Terminal UI framework with built-in Tree-sitter
- Bun: Required runtime (OpenTUI uses Bun-specific FFI)
- TypeScript: Primary language with strict mode`,
  },
];

/** Look up embedded doc content by filename */
export function getEmbeddedDoc(filename: string): string | null {
  const doc = EMBEDDED_DOCS.find((d) => d.filename === filename);
  return doc?.content ?? null;
}

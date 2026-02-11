# AGENTS.md - AI Agent Guidelines for xTerm

## Project Overview

**xTerm** is a terminal-based text editor and file browser built with **OpenTUI** (`@opentui/core`), running on **Bun**. It provides a VS Code-style interface with a file tree sidebar, tabbed editor, syntax highlighting, and status bar -- all inside the terminal.

## Tech Stack

| Technology | Purpose |
|---|---|
| **Bun** | JavaScript/TypeScript runtime and package manager |
| **TypeScript** | Primary language (strict mode) |
| **OpenTUI** (`@opentui/core`) | Terminal UI framework (imperative API) |
| **Tree-sitter** | Syntax highlighting (built into OpenTUI) |
| **Yoga** | Flexbox layout engine (built into OpenTUI) |
| **Zig** | Required build dependency for OpenTUI's native renderer |

## Project Structure

```
xTremeTerminal/
├── AGENTS.md                 # This file - AI agent guidelines
├── PROGRESS.md               # Development progress tracker (READ THIS FIRST)
├── README.md                 # Project README
├── package.json              # Bun project config
├── tsconfig.json             # TypeScript config (strict)
├── docs/                     # User-facing documentation
│   ├── getting-started.md
│   ├── user-guide.md
│   ├── keyboard-shortcuts.md
│   ├── configuration.md
│   └── architecture.md
├── plans/                    # Implementation plans per phase
│   ├── phase-0-prerequisites.md
│   ├── phase-1-scaffolding.md
│   ├── phase-2-file-browser.md
│   ├── phase-3-editor-core.md
│   ├── phase-4-syntax-highlighting.md
│   ├── phase-5-tabs.md
│   ├── phase-6-advanced-editor.md
│   ├── phase-7-file-operations.md
│   ├── phase-8-statusbar-commands.md
│   └── phase-9-polish.md
├── src/                      # Source code
│   ├── index.ts              # Entry point
│   ├── app.ts                # Main application orchestrator
│   ├── theme.ts              # Colors, syntax styles (Tokyo Night)
│   ├── keybindings.ts        # Keyboard shortcut definitions
│   ├── components/           # TUI components
│   │   ├── layout.ts         # Main layout (sidebar + editor + bars)
│   │   ├── tab-bar.ts        # Tab bar for open files
│   │   ├── status-bar.ts     # Bottom status bar
│   │   ├── file-tree.ts      # File/directory browser
│   │   ├── editor.ts         # Text editor component
│   │   ├── search-dialog.ts  # Find & replace overlay
│   │   ├── confirm-dialog.ts # Confirmation dialogs
│   │   └── command-palette.ts# Command palette overlay
│   ├── services/             # Business logic (no TUI dependency)
│   │   ├── file-service.ts   # File I/O operations
│   │   ├── tab-manager.ts    # Tab state management
│   │   ├── history.ts        # Undo/redo history
│   │   └── clipboard.ts      # Clipboard buffer
│   └── utils/                # Pure utility functions
│       ├── language-detect.ts # File extension -> language mapping
│       └── file-icons.ts     # Unicode icons for file types
└── tests/                    # Test suite
    ├── helpers/
    │   ├── setup.ts          # Shared test setup
    │   └── key-simulator.ts  # Keyboard input simulation
    ├── unit/                 # Unit tests (no TUI)
    ├── component/            # Component tests (with renderer)
    └── integration/          # End-to-end user flow tests
```

## Coding Conventions

### TypeScript

- **Strict mode** is enabled (`"strict": true` in tsconfig.json)
- Use `type` imports for type-only imports: `import type { Foo } from "./foo"`
- Prefer `const` over `let`; never use `var`
- Use explicit return types on exported functions
- Use descriptive variable names; avoid single-letter names except in loops
- Prefer `interface` for object shapes, `type` for unions/intersections

### Naming

- **Files:** kebab-case (`file-tree.ts`, `tab-manager.ts`)
- **Classes:** PascalCase (`FileTree`, `TabManager`)
- **Functions/methods:** camelCase (`openFile`, `getSelectedItem`)
- **Constants:** UPPER_SNAKE_CASE for true constants (`SIDEBAR_WIDTH`, `DEFAULT_TAB_SIZE`)
- **Types/Interfaces:** PascalCase (`FileEntry`, `TabState`)
- **Test files:** `<module-name>.test.ts` matching the source file name

### Imports

- Group imports in this order (with blank lines between groups):
  1. External packages (`@opentui/core`, `bun:test`, `node:fs`, `node:path`)
  2. Internal absolute imports (`../services/file-service`)
  3. Relative imports (`./theme`)
- Use `node:` prefix for Node.js built-ins (`node:fs`, `node:path`, `node:os`)

### OpenTUI Patterns

- Use the **imperative Renderable API** (not Constructs) for complex components that need state management
- Use the **Construct API** (factory functions like `Box()`, `Text()`) for simple, static layouts
- Always provide `id` properties to renderables for debugging
- Clean up renderables by calling `.destroy()` when removing them
- Handle keyboard events via `renderer.keyInput.on("keypress", handler)`
- Use `renderer.on("resize", handler)` for responsive layouts

### Error Handling

- Wrap file I/O in try/catch; display user-friendly error messages in the status bar
- Never let unhandled exceptions crash the TUI; catch at component boundaries
- Log errors to a debug log file, not to stdout (which is owned by OpenTUI)

### Architecture Principles

- **Services have no TUI dependency.** `src/services/` modules are pure business logic that can be tested without a renderer.
- **Components own their renderables.** Each component creates, manages, and destroys its own OpenTUI renderables.
- **App is the orchestrator.** `src/app.ts` wires components and services together. Components communicate through the app, not directly with each other.
- **State flows down, events flow up.** The app passes state to components; components emit events back to the app.

## Testing

### Framework

- Uses **Bun's built-in test runner** (`bun test`)
- Jest-compatible API: `describe`, `test`, `expect`, `beforeEach`, `afterEach`, `mock`
- Import from `bun:test`

### Test Categories

1. **Unit tests** (`tests/unit/`): Test services and utilities in isolation. No renderer needed. Fast.
2. **Component tests** (`tests/component/`): Test TUI components with a headless renderer (`OTUI_NO_NATIVE_RENDER=true`). Medium speed.
3. **Integration tests** (`tests/integration/`): Test full user workflows with simulated keyboard input. Use temp directories. Slower.

### Test Conventions

- Each source file gets a corresponding test file with the same name + `.test.ts`
- Use `describe()` blocks to group related tests
- Test names should describe the expected behavior: `"should save file when Ctrl+S is pressed"`
- Use `beforeEach` to set up fresh state; `afterEach` to clean up (delete temp files, destroy renderer)
- Integration tests must use temporary directories (never modify the real filesystem outside /tmp)
- Mock file system operations in unit tests; use real filesystem in integration tests

### Running Tests

```bash
bun test                      # All tests
bun test tests/unit           # Unit tests only
bun test tests/component      # Component tests only
bun test tests/integration    # Integration tests only
bun test --coverage           # With coverage
bun test --watch              # Watch mode
```

## Theme

The application uses a **Tokyo Night** inspired dark color palette:

| Element | Hex Color | Usage |
|---|---|---|
| `BG_PRIMARY` | `#1a1b26` | Editor background |
| `BG_SECONDARY` | `#16161e` | Sidebar, tab bar, status bar background |
| `BG_HIGHLIGHT` | `#24283b` | Current line, hover highlight |
| `BG_SELECTION` | `#283457` | Text selection |
| `FG_PRIMARY` | `#a9b1d6` | Default text color |
| `FG_SECONDARY` | `#565f89` | Comments, disabled text |
| `FG_MUTED` | `#3b4261` | Line numbers, borders |
| `ACCENT` | `#7aa2f7` | Active tab, focused elements |
| `ERROR` | `#f7768e` | Error indicators |
| `WARNING` | `#e0af68` | Warning indicators |
| `SUCCESS` | `#9ece6a` | Success indicators |
| `INFO` | `#7dcfff` | Info indicators |

## Key Files to Read When Starting

1. **`PROGRESS.md`** - Current development status and next steps
2. **`AGENTS.md`** (this file) - Coding conventions and architecture
3. **`plans/phase-N-*.md`** - Detailed plan for the current phase
4. **`docs/architecture.md`** - Technical design decisions

## Common Commands

```bash
bun install                   # Install dependencies
bun run src/index.ts          # Run the application
bun test                      # Run all tests
bun test --watch              # Run tests in watch mode
```

## Important Notes

- **OpenTUI requires Zig** to be installed on the system for building native components
- **Bun is the required runtime** - Node.js will not work because OpenTUI depends on Bun-specific FFI
- The application uses the **alternate screen buffer** - it takes over the full terminal
- Always call `renderer.destroy()` before exiting to restore terminal state
- When testing, use `OTUI_NO_NATIVE_RENDER=true` and `useAlternateScreen: false`

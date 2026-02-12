# Architecture & Project Structure

## Directory Layout

```
xTremeTerminal/
├── AGENTS.md                 # Agent guidelines (thin router)
├── PROGRESS.md               # Dev status & session log
├── package.json              # Bun project config
├── tsconfig.json             # TypeScript config (strict)
├── docs/                     # User-facing docs
│   ├── architecture.md       # Deep design rationale
│   └── *.md                  # getting-started, user-guide, shortcuts, config
├── docs/agent/               # On-demand agent reference (you are here)
├── plans/                    # Phase implementation plans (phase-0 … phase-11)
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Orchestrator — wires components + services
│   ├── theme.ts              # Tokyo Night palette, syntax styles, UI constants
│   ├── keybindings.ts        # Shortcut definitions + matcher
│   ├── help-content.ts       # Embedded help docs (for compiled binary)
│   ├── build-info.ts         # APP_VERSION, APP_AUTHOR, BUILD_DATE
│   ├── components/           # TUI components (depend on OpenTUI)
│   │   ├── layout.ts         # Root flexbox layout (sidebar + editor + bars)
│   │   ├── tab-bar.ts        # Tab bar
│   │   ├── status-bar.ts     # Bottom status bar
│   │   ├── file-tree.ts      # File/directory browser
│   │   ├── editor.ts         # Text editor (textarea + line numbers + syntax HL)
│   │   ├── search-dialog.ts  # Find & replace overlay
│   │   ├── confirm-dialog.ts # Confirmation dialogs
│   │   ├── command-palette.ts# Ctrl+P command palette
│   │   ├── menu-bar.ts       # F10 menu bar
│   │   ├── help-dialog.ts    # Help overlay
│   │   └── about-dialog.ts   # About overlay
│   ├── services/             # Pure business logic (NO TUI dependency)
│   │   ├── file-service.ts   # File I/O, tree building
│   │   ├── tab-manager.ts    # Tab state management
│   │   ├── history.ts        # (skipped — OpenTUI has built-in undo/redo)
│   │   └── clipboard.ts      # Internal clipboard buffer
│   └── utils/                # Pure functions, no side effects
│       ├── language-detect.ts # Extension → Tree-sitter language
│       └── file-icons.ts     # Unicode file type icons
└── tests/
    ├── helpers/
    │   ├── setup.ts          # Headless renderer factory, temp dir utils
    │   └── key-simulator.ts  # Keyboard input simulation
    ├── unit/                 # Service/utility tests (no renderer)
    ├── component/            # Component tests (headless renderer)
    └── integration/          # Full workflow tests (simulated input)
```

## Layer Diagram

```
┌─────────────────────────┐
│      Components         │  TUI rendering + user interaction
│   (src/components/)     │  Depends on: OpenTUI, Services
├─────────────────────────┤
│       Services          │  Business logic + state management
│    (src/services/)      │  Depends on: nothing (pure logic)
├─────────────────────────┤
│       Utilities         │  Pure functions, mappings
│     (src/utils/)        │  Depends on: nothing
└─────────────────────────┘
```

## Architecture Principles

- **Services have no TUI dependency.** `src/services/` can be tested without a renderer.
- **Components own their renderables.** Each component creates, manages, and destroys its OpenTUI renderables.
- **App is the orchestrator.** `src/app.ts` wires components + services together. Components never talk directly to each other.
- **State flows down, events flow up.** App passes state to components; components emit events to App.

## OpenTUI Patterns

- Use the **imperative Renderable API** (not Constructs) for stateful components.
- Use the **Construct API** (`Box()`, `Text()`) for simple static layouts.
- Always set `id` on renderables for debugging.
- Call `.destroy()` when removing renderables.
- Keyboard events: `renderer.keyInput.on("keypress", handler)`.
- Resize handling: `renderer.on("resize", handler)`.
- Built-in features used by this project:
  - `TextareaRenderable` has undo/redo (`editBuffer.canUndo`, `textarea.undo/redo`).
  - `TextareaRenderable` has selection (`hasSelection`, `getSelectedText`, `selectAll`).
  - Tree-sitter WASM parsers bundled for: javascript, typescript, markdown, markdown_inline, zig.

## Focus Priority (highest → lowest)

1. Confirm Dialog (modal)
2. Command Palette (modal)
3. Search Dialog (modal)
4. Menu Bar (when open)
5. Editor (when focused)
6. File Tree (when focused)

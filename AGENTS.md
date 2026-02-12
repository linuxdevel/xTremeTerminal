# AGENTS.md — xTremeTerminal

## Project Overview

**xTremeTerminal** is a terminal-based text editor/file browser built with
**OpenTUI** (`@opentui/core`), running on **Bun** + **TypeScript** (strict mode).
VS Code-style layout: file tree sidebar, tabbed editor, syntax highlighting
(Tree-sitter), Yoga flexbox layout, status bar — all in the terminal. Requires **Zig** for OpenTUI's
native renderer. Node.js will **not** work (OpenTUI uses Bun-specific FFI).

## Always-On Rules

1. **Runtime:** Bun only. Never use Node.js or npm.
2. **Language:** TypeScript strict mode. No `any` unless unavoidable.
3. **No stdout:** Never write to stdout/stderr — OpenTUI owns the terminal. Log errors to a file.
4. **Renderer cleanup:** Always call `renderer.destroy()` before exiting.
5. **Services are TUI-free.** `src/services/` must have zero OpenTUI imports.
6. **App is the orchestrator.** Components never talk directly to each other; they go through `src/app.ts`.
7. **State down, events up.** App passes state to components; components emit events to App.
8. **File naming:** kebab-case (`file-tree.ts`). Classes: PascalCase. Functions: camelCase. Constants: UPPER_SNAKE_CASE.
9. **Imports:** Use `node:` prefix for Node.js built-ins. Group: external → internal → relative.
10. **Tests:** Use `bun test`. Import from `bun:test`. Each source file gets a `<name>.test.ts`.
11. **Headless testing:** Set `OTUI_NO_NATIVE_RENDER=true` and `useAlternateScreen: false`.
12. **No real-filesystem mutations in tests.** Integration tests must use temp directories under `/tmp`.
13. **Error handling:** Wrap I/O in try/catch. Show errors in the status bar. Never crash the TUI.
14. **Type imports:** Use `import type { Foo }` for type-only imports.
15. **Const by default.** Prefer `const` over `let`. Never use `var`.
16. **Check PROGRESS.md** before starting work to understand current state.

## Commands

```bash
# Setup
bun install                         # Install deps

# Run
bun run src/index.ts                # Launch the editor

# Test
bun test                            # All tests (438 passing)
bun test tests/unit                 # Unit tests only
bun test tests/component            # Component tests only
bun test tests/integration          # Integration tests only
bun test --coverage                 # With coverage
bun test --watch                    # Watch mode
```

## Source Layout (abbreviated)

```
src/
├── index.ts              # Entry point
├── app.ts                # Orchestrator
├── theme.ts              # Colors + syntax styles
├── keybindings.ts        # Shortcut definitions
├── components/           # TUI components (depend on OpenTUI)
├── services/             # Pure business logic (NO TUI deps)
└── utils/                # Pure functions
tests/
├── helpers/              # setup.ts, key-simulator.ts
├── unit/                 # Service/utility tests
├── component/            # Component tests (headless renderer)
└── integration/          # Full workflow tests
```

## On-Demand Docs

> **Loading policy:**
> - Do NOT read on-demand files unless the task requires it.
> - Prefer grep/search to locate relevant info before reading a full doc.
> - When uncertain, ask the user which doc to load OR load the smallest one.

| When you need…                                 | Read this                                |
|------------------------------------------------|------------------------------------------|
| Full directory tree, arch principles, OpenTUI  | `docs/agent/10-architecture.md`          |
| TypeScript style, naming, imports, errors      | `docs/agent/20-coding-conventions.md`    |
| Test runner, categories, conventions, helpers  | `docs/agent/30-testing.md`               |
| Color palette, theme tokens, UI constants      | `docs/agent/40-theme-and-ui.md`          |
| Doc index + decision tree                      | `docs/agent/00-index.md`                 |
| Current dev status, session history            | `PROGRESS.md`                            |
| Phase-specific implementation plan             | `plans/phase-N-*.md`                     |
| Deep architecture rationale, data flow         | `docs/architecture.md`                   |
| User-facing docs (shortcuts, config, guide)    | `docs/*.md`                              |

## Key Footguns

- **Zig must be installed** for OpenTUI native build.
- **Alternate screen buffer:** The app takes over the terminal. Test headlessly.
- **Cursor position:** `editorView.getCursor()` gives the correct position after up/down movement; `editBuffer.getCursorPosition()` can be stale. See PROGRESS.md Session 13-14.
- **Tree-sitter parsers bundled:** Only javascript, typescript, markdown, markdown_inline, zig. Other languages fall back gracefully.
- **Compiled binary doesn't bundle external files.** Help docs are embedded in `src/help-content.ts`.
- **Ctrl+C/V:** Some terminals intercept these at the OS level. The code is correct; the issue is terminal behavior.

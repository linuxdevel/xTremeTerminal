# Phase 1: Project Scaffolding & Basic Shell

## Goal
Initialize the Bun project, install OpenTUI, create the main layout skeleton with the dark theme, and verify everything renders correctly.

## Dependencies
- Phase 0 completed (Bun + Zig installed)

## Steps

### 1.1 Initialize Project
```bash
cd /home/abols/xTremeTerminal
bun init -y
bun add @opentui/core
```

Create `tsconfig.json` with strict mode enabled:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 1.2 Create Theme Module (`src/theme.ts`)
Define the Tokyo Night color palette as exported constants:
- Background colors (primary, secondary, highlight, selection)
- Foreground colors (primary, secondary, muted)
- Accent colors (accent, error, warning, success, info)
- Syntax highlighting styles using `SyntaxStyle.fromStyles()`

### 1.3 Create Keybindings Module (`src/keybindings.ts`)
Define keyboard shortcut constants as a structured object:
- File operations (save, new, close)
- Navigation (next/prev tab, toggle sidebar)
- Editing (undo, redo, find, replace)
- Tree operations (expand, collapse, delete, rename)

### 1.4 Create Layout Component (`src/components/layout.ts`)
Build the main VS Code-style layout using BoxRenderable:
```
┌─────────────────────────────────────────┐
│  Tab Bar (height: 1)                     │
├──────────┬──────────────────────────────┤
│ Sidebar  │  Editor Area                  │
│ (width:  │  (flexGrow: 1)               │
│  fixed)  │                               │
│          │                               │
├──────────┴──────────────────────────────┤
│  Status Bar (height: 1)                  │
└─────────────────────────────────────────┘
```

Implementation:
- Root container: `flexDirection: "column"`, `width: "100%"`, `height: "100%"`
- Tab bar row: `height: 1`, `backgroundColor: BG_SECONDARY`
- Middle row: `flexDirection: "row"`, `flexGrow: 1`
  - Sidebar: `width: 25` (fixed), `backgroundColor: BG_SECONDARY`
  - Editor: `flexGrow: 1`, `backgroundColor: BG_PRIMARY`
- Status bar row: `height: 1`, `backgroundColor: BG_SECONDARY`

### 1.5 Create Entry Point (`src/index.ts`)
```typescript
import { createCliRenderer } from "@opentui/core"
// Create renderer with exitOnCtrlC: true
// Instantiate layout
// Add to renderer.root
// Handle resize events
```

### 1.6 Create App Orchestrator (`src/app.ts`)
- Initialize the renderer
- Create the layout component
- Wire up global keyboard handler
- Handle Ctrl+C exit with cleanup
- Handle terminal resize events
- Export App class/function for testing

### 1.7 Write Tests

**Unit tests:**
- `tests/unit/theme.test.ts` - Verify all color constants are valid hex strings, syntax style creation
- `tests/unit/keybindings.test.ts` - Verify shortcut definitions, no duplicate bindings

**Component tests:**
- `tests/component/layout.test.ts` - Verify layout creates all containers, responds to resize

**Test helpers:**
- `tests/helpers/setup.ts` - Shared setup: create headless renderer, temp directory helpers
- `tests/helpers/key-simulator.ts` - Helper to emit KeyEvent sequences

### 1.8 Verify
```bash
bun run src/index.ts   # Should show the dark themed layout shell
bun test               # All tests pass
```

## Files Created
- `package.json` (via `bun init`)
- `tsconfig.json`
- `src/index.ts`
- `src/app.ts`
- `src/theme.ts`
- `src/keybindings.ts`
- `src/components/layout.ts`
- `tests/helpers/setup.ts`
- `tests/helpers/key-simulator.ts`
- `tests/unit/theme.test.ts`
- `tests/unit/keybindings.test.ts`
- `tests/component/layout.test.ts`

## Acceptance Criteria
- [ ] `bun run src/index.ts` launches and displays the dark-themed layout
- [ ] Layout has sidebar, tab bar area, editor area, and status bar
- [ ] Tokyo Night colors are applied throughout
- [ ] Ctrl+C exits cleanly (restores terminal state)
- [ ] Terminal resize adjusts the layout
- [ ] All unit tests pass
- [ ] All component tests pass

## OpenTUI Components Used
- `createCliRenderer` - Main renderer
- `BoxRenderable` / `Box()` - Layout containers
- `TextRenderable` / `Text()` - Placeholder text
- `renderer.keyInput` - Keyboard event handling
- `renderer.on("resize")` - Resize handling

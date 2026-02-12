# Coding Conventions

## TypeScript

- **Strict mode** enabled (`"strict": true` in tsconfig.json)
- Use `type` imports for type-only imports: `import type { Foo } from "./foo"`
- Prefer `const` over `let`; never use `var`
- Explicit return types on exported functions
- Descriptive variable names; avoid single-letter names except in loops
- Prefer `interface` for object shapes, `type` for unions/intersections

## Naming

| Kind              | Convention         | Example                              |
|-------------------|--------------------|--------------------------------------|
| Files             | kebab-case         | `file-tree.ts`, `tab-manager.ts`     |
| Classes           | PascalCase         | `FileTree`, `TabManager`             |
| Functions/methods | camelCase          | `openFile`, `getSelectedItem`        |
| Constants         | UPPER_SNAKE_CASE   | `SIDEBAR_WIDTH`, `DEFAULT_TAB_SIZE`  |
| Types/Interfaces  | PascalCase         | `FileEntry`, `TabState`              |
| Test files        | `<module>.test.ts` | `file-service.test.ts`               |

## Imports

Group in this order (blank lines between groups):

1. External packages (`@opentui/core`, `bun:test`, `node:fs`, `node:path`)
2. Internal absolute imports (`../services/file-service`)
3. Relative imports (`./theme`)

Always use the `node:` prefix for Node.js built-ins (`node:fs`, `node:path`, `node:os`).

## Error Handling

- Wrap file I/O in try/catch; show user-friendly errors in the status bar.
- Never let unhandled exceptions crash the TUI; catch at component boundaries.
- Log errors to a debug log file, **not** to stdout (stdout is owned by OpenTUI).

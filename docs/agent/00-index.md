# Agent On-Demand Docs — Index

> **Loading policy:** Do NOT read these files unless the task requires it.
> Prefer grep/search to locate relevant info before reading a full doc.
> When uncertain, ask the user which doc to load OR load the smallest relevant one.

## Decision Tree

| If your task involves…                          | Read this file                          |
|-------------------------------------------------|-----------------------------------------|
| Understanding project structure or data flow    | `docs/agent/10-architecture.md`         |
| Working with OpenTUI renderables or components  | `docs/agent/10-architecture.md`         |
| Writing or reviewing TypeScript code            | `docs/agent/20-coding-conventions.md`   |
| Naming files, classes, functions, or constants  | `docs/agent/20-coding-conventions.md`   |
| Import ordering or `node:` prefix questions     | `docs/agent/20-coding-conventions.md`   |
| Writing, running, or debugging tests            | `docs/agent/30-testing.md`              |
| Headless renderer setup or test helpers         | `docs/agent/30-testing.md`              |
| Changing colors, theme tokens, or UI constants  | `docs/agent/40-theme-and-ui.md`         |
| Phase plans or roadmap                          | `plans/phase-N-*.md` (pick the phase)   |
| Current dev status or resuming work             | `PROGRESS.md`                           |
| User-facing docs (shortcuts, config, guide)     | `docs/*.md`                             |
| Architecture deep-dive (design rationale)       | `docs/architecture.md`                  |

## File Summaries

| File | Lines | What it contains |
|------|-------|------------------|
| `10-architecture.md`       | ~80  | Full directory tree, layer diagram, arch principles, OpenTUI patterns |
| `20-coding-conventions.md` | ~60  | TypeScript style, naming, imports, error handling |
| `30-testing.md`            | ~60  | Bun test runner, test categories, conventions, headless renderer setup |
| `40-theme-and-ui.md`       | ~30  | Tokyo Night color palette table, UI dimension constants |

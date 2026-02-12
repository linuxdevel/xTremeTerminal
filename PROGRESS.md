# xTremeTerminal Development Progress

> Tracks implementation progress for session continuity.
> **Last updated:** 2026-02-12

---

## How to Resume

1. Read this section and "Current Status" below
2. Read `AGENTS.md` for coding rules and project conventions
3. Run `bun test` to verify current state
4. Check the phase checklist for the next phase to work on
5. Read `plans/phase-N-*.md` for the relevant phase plan
6. Browse `src/` and `tests/` to discover files (don't rely on stale inventories)
7. After completing work, update this file

---

## Current Status: Phase 12 COMPLETE

**Next action:** All tests passing. Phase 12 (Archive Browser) complete and released as v1.1.0. Ready for new feature work.

---

## Phase Checklist

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | DONE | Prerequisites (Bun, Zig installation) |
| 1 | DONE | Project scaffolding & basic shell |
| 2 | DONE | File tree browser |
| 3 | DONE | Text editor core |
| 4 | DONE | Syntax highlighting |
| 5 | DONE | Tab management |
| 6 | DONE | Advanced editor (undo/redo, clipboard, search) |
| 7 | DONE | File operations (create/rename/delete) |
| 8 | DONE | Status bar & command palette |
| 9 | SKIPPED | Polish & edge cases |
| 10 | DONE | Install script & CI/CD workflows |
| 11 | DONE | Menu bar, help system, UX improvements |
| 12 | DONE | Archive browser (.tar, .tar.gz, .tgz) |

---

## Environment

| Requirement | Version |
|-------------|---------|
| OS | Ubuntu 25.10 |
| Bun | 1.3.9 (baseline) |
| Zig | 0.13.0 |

---

## Recent Sessions

### Session 18 - 2026-02-12
- **Goal:** Auto-generate help-content.ts from docs at build time
- **Completed:**
  - Created `scripts/generate-help-content.ts` — reads `docs/*.md`, generates `src/help-content.ts`
  - Updated `.github/workflows/release.yml` — runs generation script before build
  - Regenerated `src/help-content.ts` with full current doc content
  - Fixed TS2322 in `tests/component/tab-bar.test.ts` — added missing `type: "editor"` default to mock
  - All 471 tests passing, tagged v1.1.0

### Session 17 - 2026-02-12
- **Goal:** Complete Phase 12 (Archive Browser)
- **Completed:**
  - Created `src/services/archive-service.ts` — ArchiveService with `listEntries()`, `readFile()`, `extract()`, `isArchive()` using Bun.Archive API
  - Created `src/components/archive-browser.ts` — Tree view component for browsing archive contents
  - Created `src/components/path-picker.ts` — Directory picker dialog for extraction targets
  - Updated `src/app.ts` — Integrated archive browser with tab system, async race condition fix (`_pendingSwitchPromise`)
  - Updated `src/services/tab-manager.ts` — Added `openArchiveTab()`, `type: "archive"` tab support
  - Fixed Yoga layout crashes (async race conditions, unique IDs for dynamic renderables)
  - Created tests: archive-service (8), archive-browser (21), integration (2+2)
  - All 471 tests passing, tagged v1.1.0

> For sessions 1-16, see `docs/agent/session-history.md`.

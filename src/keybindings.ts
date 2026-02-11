// src/keybindings.ts — Keyboard shortcut definitions

import type { KeyEvent } from "@opentui/core";

// ── Shortcut Matcher Type ──────────────────────────────────────────

export interface KeyBinding {
  readonly key: string;
  readonly ctrl?: boolean;
  readonly meta?: boolean;
  readonly shift?: boolean;
  readonly description: string;
}

// ── File Operations ────────────────────────────────────────────────

export const KB_SAVE: KeyBinding = {
  key: "s",
  ctrl: true,
  description: "Save file",
};

export const KB_NEW_FILE: KeyBinding = {
  key: "n",
  ctrl: true,
  description: "New file",
};

export const KB_CLOSE_TAB: KeyBinding = {
  key: "w",
  ctrl: true,
  description: "Close tab",
};

// ── Navigation ─────────────────────────────────────────────────────

export const KB_NEXT_TAB: KeyBinding = {
  key: "tab",
  ctrl: true,
  description: "Next tab",
};

export const KB_PREV_TAB: KeyBinding = {
  key: "tab",
  ctrl: true,
  shift: true,
  description: "Previous tab",
};

export const KB_TOGGLE_SIDEBAR: KeyBinding = {
  key: "b",
  ctrl: true,
  description: "Toggle sidebar",
};

export const KB_FOCUS_TREE: KeyBinding = {
  key: "e",
  ctrl: true,
  description: "Focus file tree",
};

export const KB_FOCUS_EDITOR: KeyBinding = {
  key: "1",
  ctrl: true,
  description: "Focus editor",
};

// ── Editing ────────────────────────────────────────────────────────

export const KB_UNDO: KeyBinding = {
  key: "z",
  ctrl: true,
  description: "Undo",
};

export const KB_REDO: KeyBinding = {
  key: "z",
  ctrl: true,
  shift: true,
  description: "Redo",
};

export const KB_FIND: KeyBinding = {
  key: "f",
  ctrl: true,
  description: "Find",
};

export const KB_REPLACE: KeyBinding = {
  key: "h",
  ctrl: true,
  description: "Find and replace",
};

export const KB_SELECT_ALL: KeyBinding = {
  key: "a",
  ctrl: true,
  description: "Select all",
};

export const KB_CUT: KeyBinding = {
  key: "x",
  ctrl: true,
  description: "Cut selection",
};

export const KB_COPY: KeyBinding = {
  key: "c",
  ctrl: true,
  description: "Copy selection",
};

export const KB_PASTE: KeyBinding = {
  key: "v",
  ctrl: true,
  description: "Paste",
};

// ── Tree Operations ────────────────────────────────────────────────

export const KB_TREE_DELETE: KeyBinding = {
  key: "delete",
  description: "Delete file/folder",
};

export const KB_TREE_RENAME: KeyBinding = {
  key: "f2",
  description: "Rename file/folder",
};

export const KB_TREE_NEW_FILE: KeyBinding = {
  key: "a",
  description: "New file in tree",
};

export const KB_TREE_NEW_FOLDER: KeyBinding = {
  key: "A",
  shift: true,
  description: "New folder in tree",
};

// ── Command Palette ────────────────────────────────────────────────

export const KB_COMMAND_PALETTE: KeyBinding = {
  key: "p",
  ctrl: true,
  shift: true,
  description: "Open command palette",
};

// ── Application ────────────────────────────────────────────────────

export const KB_QUIT: KeyBinding = {
  key: "q",
  ctrl: true,
  description: "Quit application",
};

// ── All Keybindings Array ──────────────────────────────────────────

export const ALL_KEYBINDINGS: readonly KeyBinding[] = [
  KB_SAVE, KB_NEW_FILE, KB_CLOSE_TAB,
  KB_NEXT_TAB, KB_PREV_TAB,
  KB_TOGGLE_SIDEBAR, KB_FOCUS_TREE, KB_FOCUS_EDITOR,
  KB_UNDO, KB_REDO, KB_FIND, KB_REPLACE,
  KB_SELECT_ALL, KB_CUT, KB_COPY, KB_PASTE,
  KB_TREE_DELETE, KB_TREE_RENAME, KB_TREE_NEW_FILE, KB_TREE_NEW_FOLDER,
  KB_COMMAND_PALETTE,
  KB_QUIT,
] as const;

// ── Matcher Function ───────────────────────────────────────────────

export function matchesBinding(event: KeyEvent, binding: KeyBinding): boolean {
  if (event.name !== binding.key) return false;
  if (!!binding.ctrl !== event.ctrl) return false;
  if (!!binding.meta !== event.meta) return false;
  if (!!binding.shift !== event.shift) return false;
  return true;
}

// ── Duplicate Detection (for testing) ──────────────────────────────

export function findDuplicateBindings(bindings: readonly KeyBinding[]): [KeyBinding, KeyBinding][] {
  const duplicates: [KeyBinding, KeyBinding][] = [];
  for (let i = 0; i < bindings.length; i++) {
    for (let j = i + 1; j < bindings.length; j++) {
      const a = bindings[i]!;
      const b = bindings[j]!;
      if (
        a.key === b.key &&
        !!a.ctrl === !!b.ctrl &&
        !!a.meta === !!b.meta &&
        !!a.shift === !!b.shift
      ) {
        duplicates.push([a, b]);
      }
    }
  }
  return duplicates;
}

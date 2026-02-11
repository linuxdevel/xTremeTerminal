// tests/unit/keybindings.test.ts — Tests for keybindings module

import { describe, test, expect } from "bun:test";
import {
  ALL_KEYBINDINGS,
  matchesBinding,
  findDuplicateBindings,
  KB_SAVE,
  KB_NEW_FILE,
  KB_CLOSE_TAB,
  KB_NEXT_TAB,
  KB_PREV_TAB,
  KB_TOGGLE_SIDEBAR,
  KB_UNDO,
  KB_REDO,
  KB_FIND,
  KB_REPLACE,
  KB_QUIT,
  KB_COMMAND_PALETTE,
  KB_MENU,
  type KeyBinding,
} from "../../src/keybindings.ts";
import { KeyEvent } from "@opentui/core";

// ── Helper: Create a mock KeyEvent ─────────────────────────────────

function createKeyEvent(
  name: string,
  modifiers: { ctrl?: boolean; meta?: boolean; shift?: boolean } = {},
): KeyEvent {
  // KeyEvent is a class with specific properties, create a minimal mock
  const event = Object.create(KeyEvent.prototype) as KeyEvent;
  Object.assign(event, {
    name,
    ctrl: !!modifiers.ctrl,
    meta: !!modifiers.meta,
    shift: !!modifiers.shift,
    option: false,
    sequence: "",
    number: false,
    raw: name,
    eventType: "press",
    source: "raw",
  });
  return event;
}

describe("Keybindings", () => {
  describe("ALL_KEYBINDINGS", () => {
    test("is a non-empty array", () => {
      expect(ALL_KEYBINDINGS.length).toBeGreaterThan(0);
    });

    test("all bindings have required properties", () => {
      for (const binding of ALL_KEYBINDINGS) {
        expect(typeof binding.key).toBe("string");
        expect(binding.key.length).toBeGreaterThan(0);
        expect(typeof binding.description).toBe("string");
        expect(binding.description.length).toBeGreaterThan(0);
      }
    });

    test("no duplicate bindings", () => {
      const duplicates = findDuplicateBindings(ALL_KEYBINDINGS);
      if (duplicates.length > 0) {
        const messages = duplicates.map(
          ([a, b]) => `"${a.description}" conflicts with "${b.description}"`,
        );
        throw new Error(`Duplicate bindings found:\n${messages.join("\n")}`);
      }
      expect(duplicates.length).toBe(0);
    });
  });

  describe("matchesBinding", () => {
    test("matches Ctrl+S for save", () => {
      const event = createKeyEvent("s", { ctrl: true });
      expect(matchesBinding(event, KB_SAVE)).toBe(true);
    });

    test("does not match plain S for save", () => {
      const event = createKeyEvent("s");
      expect(matchesBinding(event, KB_SAVE)).toBe(false);
    });

    test("matches Ctrl+N for new file", () => {
      const event = createKeyEvent("n", { ctrl: true });
      expect(matchesBinding(event, KB_NEW_FILE)).toBe(true);
    });

    test("matches Ctrl+W for close tab", () => {
      const event = createKeyEvent("w", { ctrl: true });
      expect(matchesBinding(event, KB_CLOSE_TAB)).toBe(true);
    });

    test("matches Alt+Right for next tab", () => {
      const event = createKeyEvent("right", { meta: true });
      expect(matchesBinding(event, KB_NEXT_TAB)).toBe(true);
    });

    test("matches Alt+Left for previous tab", () => {
      const event = createKeyEvent("left", { meta: true });
      expect(matchesBinding(event, KB_PREV_TAB)).toBe(true);
    });

    test("does not match Alt+Right for previous tab (wrong direction)", () => {
      const event = createKeyEvent("right", { meta: true });
      expect(matchesBinding(event, KB_PREV_TAB)).toBe(false);
    });

    test("matches Ctrl+B for toggle sidebar", () => {
      const event = createKeyEvent("b", { ctrl: true });
      expect(matchesBinding(event, KB_TOGGLE_SIDEBAR)).toBe(true);
    });

    test("matches Ctrl+Z for undo", () => {
      const event = createKeyEvent("z", { ctrl: true });
      expect(matchesBinding(event, KB_UNDO)).toBe(true);
    });

    test("matches Ctrl+Shift+Z for redo", () => {
      const event = createKeyEvent("z", { ctrl: true, shift: true });
      expect(matchesBinding(event, KB_REDO)).toBe(true);
    });

    test("matches Ctrl+F for find", () => {
      const event = createKeyEvent("f", { ctrl: true });
      expect(matchesBinding(event, KB_FIND)).toBe(true);
    });

    test("matches Ctrl+Shift+H for replace", () => {
      const event = createKeyEvent("h", { ctrl: true, shift: true });
      expect(matchesBinding(event, KB_REPLACE)).toBe(true);
    });

    test("does not match Ctrl+H for replace (missing shift)", () => {
      const event = createKeyEvent("h", { ctrl: true });
      expect(matchesBinding(event, KB_REPLACE)).toBe(false);
    });

    test("matches F10 for menu", () => {
      const event = createKeyEvent("f10");
      expect(matchesBinding(event, KB_MENU)).toBe(true);
    });

    test("matches Ctrl+Q for quit", () => {
      const event = createKeyEvent("q", { ctrl: true });
      expect(matchesBinding(event, KB_QUIT)).toBe(true);
    });

    test("matches Ctrl+Shift+P for command palette", () => {
      const event = createKeyEvent("p", { ctrl: true, shift: true });
      expect(matchesBinding(event, KB_COMMAND_PALETTE)).toBe(true);
    });

    test("wrong key does not match", () => {
      const event = createKeyEvent("x", { ctrl: true });
      expect(matchesBinding(event, KB_SAVE)).toBe(false);
    });

    test("extra modifier does not match", () => {
      const event = createKeyEvent("s", { ctrl: true, meta: true });
      expect(matchesBinding(event, KB_SAVE)).toBe(false);
    });
  });

  describe("findDuplicateBindings", () => {
    test("returns empty array for unique bindings", () => {
      const bindings: KeyBinding[] = [
        { key: "a", ctrl: true, description: "action a" },
        { key: "b", ctrl: true, description: "action b" },
      ];
      expect(findDuplicateBindings(bindings).length).toBe(0);
    });

    test("detects duplicate bindings", () => {
      const bindings: KeyBinding[] = [
        { key: "s", ctrl: true, description: "save" },
        { key: "s", ctrl: true, description: "search" },
      ];
      const duplicates = findDuplicateBindings(bindings);
      expect(duplicates.length).toBe(1);
    });

    test("distinguishes by modifiers", () => {
      const bindings: KeyBinding[] = [
        { key: "z", ctrl: true, description: "undo" },
        { key: "z", ctrl: true, shift: true, description: "redo" },
      ];
      expect(findDuplicateBindings(bindings).length).toBe(0);
    });
  });
});

// tests/component/command-palette.test.ts — Component tests for CommandPalette

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTestEnv } from "../helpers/setup.ts";
import { CommandPalette } from "../../src/components/command-palette.ts";
import type { Command } from "../../src/components/command-palette.ts";

describe("CommandPalette", () => {
  let env: Awaited<ReturnType<typeof createTestEnv>>;
  let palette: CommandPalette;

  // Helper to create a KeyEvent-like object
  function makeKeyEvent(overrides: Record<string, unknown> = {}) {
    return {
      name: "",
      sequence: "",
      ctrl: false,
      shift: false,
      meta: false,
      preventDefault: () => {},
      ...overrides,
    };
  }

  function createTestCommands(): Command[] {
    return [
      { id: "file.save", label: "Save File", shortcut: "Ctrl+S", category: "File", action: () => {} },
      { id: "file.new", label: "New File", shortcut: "Ctrl+N", category: "File", action: () => {} },
      { id: "file.close", label: "Close Tab", shortcut: "Ctrl+W", category: "File", action: () => {} },
      { id: "edit.undo", label: "Undo", shortcut: "Ctrl+Z", category: "Edit", action: () => {} },
      { id: "edit.find", label: "Find", shortcut: "Ctrl+F", category: "Edit", action: () => {} },
      { id: "view.sidebar", label: "Toggle Sidebar", shortcut: "Ctrl+B", category: "View", action: () => {} },
      { id: "app.quit", label: "Quit", shortcut: "Ctrl+Q", category: "Application", action: () => {} },
    ];
  }

  beforeEach(async () => {
    env = await createTestEnv();
    palette = new CommandPalette(env.renderer);
    env.renderer.root.add(palette.renderable);
  });

  afterEach(() => {
    palette.destroy();
    env.renderer.destroy();
  });

  describe("initial state", () => {
    test("is hidden by default", () => {
      expect(palette.isVisible).toBe(false);
    });

    test("has 0 commands", () => {
      expect(palette.commandCount).toBe(0);
    });

    test("selectedIndex is 0", () => {
      expect(palette.selectedIndex).toBe(0);
    });

    test("query is empty", () => {
      expect(palette.query).toBe("");
    });

    test("renderable is accessible", () => {
      expect(palette.renderable).toBeDefined();
    });
  });

  describe("registerCommands", () => {
    test("stores commands", () => {
      const commands = createTestCommands();
      palette.registerCommands(commands);
      expect(palette.commandCount).toBe(7);
    });

    test("sets filteredCount to match total", () => {
      const commands = createTestCommands();
      palette.registerCommands(commands);
      expect(palette.filteredCount).toBe(7);
    });
  });

  describe("show and hide", () => {
    test("show makes palette visible", () => {
      palette.registerCommands(createTestCommands());
      palette.show();
      expect(palette.isVisible).toBe(true);
    });

    test("hide makes palette invisible", () => {
      palette.registerCommands(createTestCommands());
      palette.show();
      palette.hide();
      expect(palette.isVisible).toBe(false);
    });

    test("show resets selectedIndex to 0", () => {
      palette.registerCommands(createTestCommands());
      palette.show();
      palette.moveDown();
      palette.moveDown();
      expect(palette.selectedIndex).toBe(2);

      palette.hide();
      palette.show();
      expect(palette.selectedIndex).toBe(0);
    });

    test("show resets query to empty", () => {
      palette.registerCommands(createTestCommands());
      palette.show();
      expect(palette.query).toBe("");
    });

    test("show restores all commands in filtered list", () => {
      palette.registerCommands(createTestCommands());
      palette.show();
      expect(palette.filteredCount).toBe(7);
    });
  });

  describe("handleKeyPress — visibility guard", () => {
    test("returns false when palette is hidden", () => {
      palette.registerCommands(createTestCommands());
      const result = palette.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(result).toBe(false);
    });
  });

  describe("handleKeyPress — Escape closes", () => {
    test("Escape hides the palette", () => {
      palette.registerCommands(createTestCommands());
      palette.show();
      expect(palette.isVisible).toBe(true);

      palette.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(palette.isVisible).toBe(false);
    });

    test("Escape returns true (consumed)", () => {
      palette.registerCommands(createTestCommands());
      palette.show();

      const result = palette.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(result).toBe(true);
    });

    test("Escape fires onClose callback", () => {
      let closed = false;
      palette.onClose = () => { closed = true; };
      palette.registerCommands(createTestCommands());
      palette.show();

      palette.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(closed).toBe(true);
    });
  });

  describe("handleKeyPress — Enter executes", () => {
    test("Enter executes the selected command", () => {
      let executed = false;
      const commands: Command[] = [
        { id: "test", label: "Test", shortcut: null, category: "Test", action: () => { executed = true; } },
      ];
      palette.registerCommands(commands);
      palette.show();

      palette.handleKeyPress(makeKeyEvent({ name: "return" }) as any);
      expect(executed).toBe(true);
    });

    test("Enter hides the palette", () => {
      const commands: Command[] = [
        { id: "test", label: "Test", shortcut: null, category: "Test", action: () => {} },
      ];
      palette.registerCommands(commands);
      palette.show();

      palette.handleKeyPress(makeKeyEvent({ name: "return" }) as any);
      expect(palette.isVisible).toBe(false);
    });

    test("Enter returns true (consumed)", () => {
      palette.registerCommands(createTestCommands());
      palette.show();

      const result = palette.handleKeyPress(makeKeyEvent({ name: "return" }) as any);
      expect(result).toBe(true);
    });

    test("Enter with no commands does nothing", () => {
      palette.show();
      // No commands registered, so executeSelected should be a no-op
      palette.handleKeyPress(makeKeyEvent({ name: "return" }) as any);
      // Should not throw
    });
  });

  describe("handleKeyPress — Up/Down navigate", () => {
    test("Down moves selection down", () => {
      palette.registerCommands(createTestCommands());
      palette.show();
      expect(palette.selectedIndex).toBe(0);

      palette.handleKeyPress(makeKeyEvent({ name: "down" }) as any);
      expect(palette.selectedIndex).toBe(1);
    });

    test("Up moves selection up (wraps)", () => {
      palette.registerCommands(createTestCommands());
      palette.show();
      expect(palette.selectedIndex).toBe(0);

      palette.handleKeyPress(makeKeyEvent({ name: "up" }) as any);
      expect(palette.selectedIndex).toBe(6); // wraps to last
    });

    test("Down wraps around at end", () => {
      palette.registerCommands(createTestCommands());
      palette.show();

      // Move to last item
      for (let i = 0; i < 7; i++) {
        palette.handleKeyPress(makeKeyEvent({ name: "down" }) as any);
      }
      // Should wrap to 0
      expect(palette.selectedIndex).toBe(0);
    });

    test("Up returns true (consumed)", () => {
      palette.registerCommands(createTestCommands());
      palette.show();

      const result = palette.handleKeyPress(makeKeyEvent({ name: "up" }) as any);
      expect(result).toBe(true);
    });

    test("Down returns true (consumed)", () => {
      palette.registerCommands(createTestCommands());
      palette.show();

      const result = palette.handleKeyPress(makeKeyEvent({ name: "down" }) as any);
      expect(result).toBe(true);
    });
  });

  describe("moveUp and moveDown", () => {
    test("moveUp with no commands does nothing", () => {
      palette.show();
      palette.moveUp(); // should not throw
      expect(palette.selectedIndex).toBe(0);
    });

    test("moveDown with no commands does nothing", () => {
      palette.show();
      palette.moveDown(); // should not throw
      expect(palette.selectedIndex).toBe(0);
    });
  });

  describe("executeSelected", () => {
    test("runs action and hides", () => {
      let actionCalled = false;
      const commands: Command[] = [
        { id: "test", label: "Test", shortcut: null, category: "Test", action: () => { actionCalled = true; } },
      ];
      palette.registerCommands(commands);
      palette.show();

      palette.executeSelected();
      expect(actionCalled).toBe(true);
      expect(palette.isVisible).toBe(false);
    });

    test("does nothing when no commands", () => {
      palette.show();
      palette.executeSelected(); // should not throw
      expect(palette.isVisible).toBe(true); // still visible since no command was executed
    });

    test("executes the correct command after navigation", () => {
      const executedIds: string[] = [];
      const commands: Command[] = [
        { id: "first", label: "First", shortcut: null, category: "Test", action: () => executedIds.push("first") },
        { id: "second", label: "Second", shortcut: null, category: "Test", action: () => executedIds.push("second") },
        { id: "third", label: "Third", shortcut: null, category: "Test", action: () => executedIds.push("third") },
      ];
      palette.registerCommands(commands);
      palette.show();

      palette.moveDown();
      palette.moveDown();
      palette.executeSelected();

      expect(executedIds).toEqual(["third"]);
    });
  });

  describe("onClose callback", () => {
    test("fires when Escape is pressed", () => {
      let closed = false;
      palette.onClose = () => { closed = true; };
      palette.registerCommands(createTestCommands());
      palette.show();

      palette.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(closed).toBe(true);
    });

    test("fires when command is executed (hide is called)", () => {
      let closed = false;
      palette.onClose = () => { closed = true; };
      const commands: Command[] = [
        { id: "test", label: "Test", shortcut: null, category: "Test", action: () => {} },
      ];
      palette.registerCommands(commands);
      palette.show();

      palette.executeSelected();
      expect(closed).toBe(true);
    });

    test("does not fire if no callback set", () => {
      palette.onClose = null;
      palette.registerCommands(createTestCommands());
      palette.show();

      // Should not throw
      palette.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
    });
  });

  describe("cleanup", () => {
    test("destroy does not throw", () => {
      expect(() => palette.destroy()).not.toThrow();
    });

    test("destroy does not throw when visible", () => {
      palette.registerCommands(createTestCommands());
      palette.show();
      expect(() => palette.destroy()).not.toThrow();
    });
  });
});

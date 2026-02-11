// tests/component/confirm-dialog.test.ts — Component tests for ConfirmDialog

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTestEnv } from "../helpers/setup.ts";
import { ConfirmDialog } from "../../src/components/confirm-dialog.ts";

describe("ConfirmDialog", () => {
  let env: Awaited<ReturnType<typeof createTestEnv>>;
  let dialog: ConfirmDialog;

  beforeEach(async () => {
    env = await createTestEnv();
    dialog = new ConfirmDialog(env.renderer);
    env.renderer.root.add(dialog.renderable);
  });

  afterEach(() => {
    dialog.destroy();
    env.renderer.destroy();
  });

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

  describe("initial state", () => {
    test("is hidden by default", () => {
      expect(dialog.isVisible).toBe(false);
    });

    test("selectedButton defaults to cancel", () => {
      expect(dialog.selectedButton).toBe("cancel");
    });
  });

  describe("show and hide", () => {
    test("show makes dialog visible", () => {
      dialog.show({
        title: "Test",
        message: "Are you sure?",
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(dialog.isVisible).toBe(true);
    });

    test("show sets selectedButton to cancel for safety", () => {
      dialog.show({
        title: "Test",
        message: "Are you sure?",
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(dialog.selectedButton).toBe("cancel");
    });

    test("hide makes dialog invisible", () => {
      dialog.show({
        title: "Test",
        message: "Message",
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(dialog.isVisible).toBe(true);

      dialog.hide();
      expect(dialog.isVisible).toBe(false);
    });

    test("show with custom labels works", () => {
      dialog.show({
        title: "Delete?",
        message: "Gone forever.",
        confirmLabel: "Delete",
        cancelLabel: "Keep",
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(dialog.isVisible).toBe(true);
    });

    test("show resets selectedButton to cancel each time", () => {
      // Show first time and switch to confirm
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });
      dialog.handleKeyPress(makeKeyEvent({ name: "left" }) as any); // switch to confirm
      expect(dialog.selectedButton).not.toBe("cancel");

      dialog.hide();

      // Show again — should reset to cancel
      dialog.show({
        title: "Test 2",
        message: "Msg 2",
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(dialog.selectedButton).toBe("cancel");
    });
  });

  describe("handleKeyPress — visibility guard", () => {
    test("returns false when dialog is hidden", () => {
      const result = dialog.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(result).toBe(false);
    });
  });

  describe("handleKeyPress — Escape cancels", () => {
    test("Escape hides the dialog", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(dialog.isVisible).toBe(true);

      dialog.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(dialog.isVisible).toBe(false);
    });

    test("Escape fires onCancel callback", () => {
      let cancelled = false;
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => { cancelled = true; },
      });

      dialog.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(cancelled).toBe(true);
    });

    test("Escape returns true (consumed)", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });

      const result = dialog.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(result).toBe(true);
    });
  });

  describe("handleKeyPress — Enter executes selected", () => {
    test("Enter with cancel selected fires onCancel", () => {
      let confirmed = false;
      let cancelled = false;
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => { confirmed = true; },
        onCancel: () => { cancelled = true; },
      });
      // Default is cancel
      expect(dialog.selectedButton).toBe("cancel");

      dialog.handleKeyPress(makeKeyEvent({ name: "return" }) as any);
      expect(cancelled).toBe(true);
      expect(confirmed).toBe(false);
    });

    test("Enter with confirm selected fires onConfirm", () => {
      let confirmed = false;
      let cancelled = false;
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => { confirmed = true; },
        onCancel: () => { cancelled = true; },
      });

      // Switch to confirm
      dialog.handleKeyPress(makeKeyEvent({ name: "left" }) as any);
      expect(dialog.selectedButton).toBe("confirm");

      dialog.handleKeyPress(makeKeyEvent({ name: "return" }) as any);
      expect(confirmed).toBe(true);
      expect(cancelled).toBe(false);
    });

    test("Enter hides the dialog", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });

      dialog.handleKeyPress(makeKeyEvent({ name: "return" }) as any);
      expect(dialog.isVisible).toBe(false);
    });
  });

  describe("handleKeyPress — button switching", () => {
    test("Left switches between buttons", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(dialog.selectedButton).toBe("cancel");

      dialog.handleKeyPress(makeKeyEvent({ name: "left" }) as any);
      expect(dialog.selectedButton).toBe("confirm");

      dialog.handleKeyPress(makeKeyEvent({ name: "left" }) as any);
      expect(dialog.selectedButton).toBe("cancel");
    });

    test("Right switches between buttons", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(dialog.selectedButton).toBe("cancel");

      dialog.handleKeyPress(makeKeyEvent({ name: "right" }) as any);
      expect(dialog.selectedButton).toBe("confirm");
    });

    test("Tab switches between buttons", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(dialog.selectedButton).toBe("cancel");

      dialog.handleKeyPress(makeKeyEvent({ name: "tab" }) as any);
      expect(dialog.selectedButton).toBe("confirm");

      dialog.handleKeyPress(makeKeyEvent({ name: "tab" }) as any);
      expect(dialog.selectedButton).toBe("cancel");
    });

    test("button switching returns true (consumed)", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });

      const result = dialog.handleKeyPress(makeKeyEvent({ name: "left" }) as any);
      expect(result).toBe(true);
    });
  });

  describe("handleKeyPress — y/n shortcuts", () => {
    test("y key fires onConfirm", () => {
      let confirmed = false;
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => { confirmed = true; },
        onCancel: () => {},
      });

      dialog.handleKeyPress(makeKeyEvent({ name: "y" }) as any);
      expect(confirmed).toBe(true);
    });

    test("y key hides the dialog", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });

      dialog.handleKeyPress(makeKeyEvent({ name: "y" }) as any);
      expect(dialog.isVisible).toBe(false);
    });

    test("n key fires onCancel", () => {
      let cancelled = false;
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => { cancelled = true; },
      });

      dialog.handleKeyPress(makeKeyEvent({ name: "n" }) as any);
      expect(cancelled).toBe(true);
    });

    test("n key hides the dialog", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });

      dialog.handleKeyPress(makeKeyEvent({ name: "n" }) as any);
      expect(dialog.isVisible).toBe(false);
    });

    test("Ctrl+y is not treated as y shortcut (consumed but not confirm)", () => {
      let confirmed = false;
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => { confirmed = true; },
        onCancel: () => {},
      });

      // Ctrl+y should be consumed (returns true) but not trigger confirm
      const result = dialog.handleKeyPress(makeKeyEvent({ name: "y", ctrl: true }) as any);
      expect(result).toBe(true); // all keys consumed
      expect(confirmed).toBe(false);
    });

    test("Ctrl+n is not treated as n shortcut (consumed but not cancel)", () => {
      let cancelled = false;
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => { cancelled = true; },
      });

      const result = dialog.handleKeyPress(makeKeyEvent({ name: "n", ctrl: true }) as any);
      expect(result).toBe(true);
      expect(cancelled).toBe(false);
    });
  });

  describe("handleKeyPress — key consumption", () => {
    test("consumes all keys while visible", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });

      // Random keys should be consumed
      expect(dialog.handleKeyPress(makeKeyEvent({ name: "a" }) as any)).toBe(true);
      expect(dialog.handleKeyPress(makeKeyEvent({ name: "space" }) as any)).toBe(true);
      expect(dialog.handleKeyPress(makeKeyEvent({ name: "x" }) as any)).toBe(true);
      expect(dialog.handleKeyPress(makeKeyEvent({ name: "1" }) as any)).toBe(true);
    });
  });

  describe("callback safety", () => {
    test("onConfirm fires after hide so callbacks can re-show", () => {
      const order: string[] = [];
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => { order.push("confirm"); order.push(dialog.isVisible ? "visible" : "hidden"); },
        onCancel: () => {},
      });

      // Switch to confirm and press Enter
      dialog.handleKeyPress(makeKeyEvent({ name: "left" }) as any);
      dialog.handleKeyPress(makeKeyEvent({ name: "return" }) as any);

      expect(order).toEqual(["confirm", "hidden"]);
    });

    test("onCancel fires after hide", () => {
      const order: string[] = [];
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => { order.push("cancel"); order.push(dialog.isVisible ? "visible" : "hidden"); },
      });

      dialog.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);

      expect(order).toEqual(["cancel", "hidden"]);
    });
  });

  describe("cleanup", () => {
    test("destroy does not throw", () => {
      dialog.show({
        title: "Test",
        message: "Msg",
        onConfirm: () => {},
        onCancel: () => {},
      });
      expect(() => dialog.destroy()).not.toThrow();
    });

    test("renderable is accessible", () => {
      expect(dialog.renderable).toBeDefined();
    });
  });
});

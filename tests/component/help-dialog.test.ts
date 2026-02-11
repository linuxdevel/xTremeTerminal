// tests/component/help-dialog.test.ts — Tests for the help dialog component

import { describe, test, expect, afterEach } from "bun:test";
import { createTestEnv, createTempDir, createTempFile, cleanupTempDir } from "../helpers/setup.ts";
import { HelpDialog } from "../../src/components/help-dialog.ts";
import { KeyEvent } from "@opentui/core";

// ── Helper: Create a mock KeyEvent ─────────────────────────────────

function makeKeyEvent(name: string, modifiers: { ctrl?: boolean; shift?: boolean; meta?: boolean } = {}): KeyEvent {
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
    preventDefault: () => {},
  });
  return event;
}

describe("HelpDialog", () => {
  let renderer: Awaited<ReturnType<typeof createTestEnv>>["renderer"];
  let tempDir: string | null = null;

  afterEach(() => {
    if (renderer && !renderer.isDestroyed) {
      renderer.destroy();
    }
    if (tempDir) {
      cleanupTempDir(tempDir);
      tempDir = null;
    }
  });

  async function setup() {
    const env = await createTestEnv();
    renderer = env.renderer;
    return env;
  }

  test("starts hidden", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    expect(dialog.isVisible).toBe(false);
  });

  test("show in topics mode makes it visible", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    dialog.show("topics");
    expect(dialog.isVisible).toBe(true);
    expect(dialog.mode).toBe("topics");
  });

  test("show in search mode makes it visible", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    dialog.show("search");
    expect(dialog.isVisible).toBe(true);
    expect(dialog.mode).toBe("search");
  });

  test("hide makes it not visible", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    dialog.show("topics");
    dialog.hide();
    expect(dialog.isVisible).toBe(false);
  });

  test("escape closes the dialog", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    dialog.show("topics");
    const consumed = dialog.handleKeyPress(makeKeyEvent("escape"));
    expect(consumed).toBe(true);
    expect(dialog.isVisible).toBe(false);
  });

  test("does not consume keys when hidden", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    const consumed = dialog.handleKeyPress(makeKeyEvent("escape"));
    expect(consumed).toBe(false);
  });

  test("up/down navigates topics", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    dialog.show("topics");
    expect(dialog.selectedIndex).toBe(0);

    dialog.handleKeyPress(makeKeyEvent("down"));
    expect(dialog.selectedIndex).toBe(1);

    dialog.handleKeyPress(makeKeyEvent("up"));
    expect(dialog.selectedIndex).toBe(0);
  });

  test("down wraps around in topics", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    dialog.show("topics");
    // Navigate past the last topic
    for (let i = 0; i < 5; i++) {
      dialog.handleKeyPress(makeKeyEvent("down"));
    }
    expect(dialog.selectedIndex).toBe(0); // wraps back to 0
  });

  test("onClose callback fires on hide", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);
    let closed = false;
    dialog.onClose = () => { closed = true; };

    dialog.show("topics");
    dialog.hide();
    expect(closed).toBe(true);
  });

  test("onClose callback fires on escape", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);
    let closed = false;
    dialog.onClose = () => { closed = true; };

    dialog.show("topics");
    dialog.handleKeyPress(makeKeyEvent("escape"));
    expect(closed).toBe(true);
  });

  test("setDocsDir stores the docs directory", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    // Should not throw
    dialog.setDocsDir("/tmp/test-docs");
  });

  test("renderable is defined", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    expect(dialog.renderable).toBeDefined();
    expect(dialog.renderable.id).toBe("help-dialog");
  });

  test("show resets selectedIndex to 0", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    dialog.show("topics");
    dialog.handleKeyPress(makeKeyEvent("down"));
    dialog.handleKeyPress(makeKeyEvent("down"));
    expect(dialog.selectedIndex).toBe(2);

    dialog.hide();
    dialog.show("topics");
    expect(dialog.selectedIndex).toBe(0);
  });

  test("destroy does not throw", async () => {
    const { renderer: r } = await setup();
    const dialog = new HelpDialog(r);

    expect(() => dialog.destroy()).not.toThrow();
  });
});

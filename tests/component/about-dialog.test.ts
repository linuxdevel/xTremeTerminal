// tests/component/about-dialog.test.ts — Tests for the about dialog component

import { describe, test, expect, afterEach } from "bun:test";
import { createTestEnv } from "../helpers/setup.ts";
import { AboutDialog } from "../../src/components/about-dialog.ts";
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

describe("AboutDialog", () => {
  let renderer: Awaited<ReturnType<typeof createTestEnv>>["renderer"];

  afterEach(() => {
    if (renderer && !renderer.isDestroyed) {
      renderer.destroy();
    }
  });

  async function setup() {
    const env = await createTestEnv();
    renderer = env.renderer;
    return env;
  }

  test("starts hidden", async () => {
    const { renderer: r } = await setup();
    const dialog = new AboutDialog(r);

    expect(dialog.isVisible).toBe(false);
  });

  test("show makes it visible", async () => {
    const { renderer: r } = await setup();
    const dialog = new AboutDialog(r);

    dialog.show();
    expect(dialog.isVisible).toBe(true);
  });

  test("hide makes it not visible", async () => {
    const { renderer: r } = await setup();
    const dialog = new AboutDialog(r);

    dialog.show();
    dialog.hide();
    expect(dialog.isVisible).toBe(false);
  });

  test("escape closes the dialog", async () => {
    const { renderer: r } = await setup();
    const dialog = new AboutDialog(r);

    dialog.show();
    const consumed = dialog.handleKeyPress(makeKeyEvent("escape"));
    expect(consumed).toBe(true);
    expect(dialog.isVisible).toBe(false);
  });

  test("other keys are consumed but dialog stays open", async () => {
    const { renderer: r } = await setup();
    const dialog = new AboutDialog(r);

    dialog.show();
    const consumed = dialog.handleKeyPress(makeKeyEvent("a"));
    expect(consumed).toBe(true);
    expect(dialog.isVisible).toBe(true);
  });

  test("does not consume keys when hidden", async () => {
    const { renderer: r } = await setup();
    const dialog = new AboutDialog(r);

    const consumed = dialog.handleKeyPress(makeKeyEvent("escape"));
    expect(consumed).toBe(false);
  });

  test("onClose callback fires on hide", async () => {
    const { renderer: r } = await setup();
    const dialog = new AboutDialog(r);
    let closed = false;
    dialog.onClose = () => { closed = true; };

    dialog.show();
    dialog.hide();
    expect(closed).toBe(true);
  });

  test("onClose callback fires on escape", async () => {
    const { renderer: r } = await setup();
    const dialog = new AboutDialog(r);
    let closed = false;
    dialog.onClose = () => { closed = true; };

    dialog.show();
    dialog.handleKeyPress(makeKeyEvent("escape"));
    expect(closed).toBe(true);
  });

  test("renderable is defined", async () => {
    const { renderer: r } = await setup();
    const dialog = new AboutDialog(r);

    expect(dialog.renderable).toBeDefined();
    expect(dialog.renderable.id).toBe("about-dialog");
  });

  test("destroy does not throw", async () => {
    const { renderer: r } = await setup();
    const dialog = new AboutDialog(r);

    expect(() => dialog.destroy()).not.toThrow();
  });
});

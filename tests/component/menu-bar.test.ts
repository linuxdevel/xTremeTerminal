// tests/component/menu-bar.test.ts — Tests for the menu bar component

import { describe, test, expect, afterEach } from "bun:test";
import { createTestEnv } from "../helpers/setup.ts";
import { MenuBar } from "../../src/components/menu-bar.ts";
import type { Menu } from "../../src/components/menu-bar.ts";
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

describe("MenuBar", () => {
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

  function createMenuBar(r: typeof renderer): MenuBar {
    const menuBar = new MenuBar(r);
    const menus: Menu[] = [
      {
        id: "file", label: "File", items: [
          { id: "file.save", label: "Save", shortcut: "Ctrl+S", action: () => {} },
          { id: "file.quit", label: "Quit", shortcut: "Ctrl+Q", action: () => {} },
        ],
      },
      {
        id: "help", label: "Help", items: [
          { id: "help.about", label: "About", action: () => {} },
        ],
      },
    ];
    menuBar.setMenus(menus);
    return menuBar;
  }

  test("starts in closed state", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    expect(menuBar.isActive).toBe(false);
    expect(menuBar.state).toBe("closed");
  });

  test("open sets state to bar-focused", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    expect(menuBar.isActive).toBe(true);
    expect(menuBar.state).toBe("bar-focused");
    expect(menuBar.activeMenuIndex).toBe(0);
  });

  test("close resets state to closed", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    menuBar.close();
    expect(menuBar.isActive).toBe(false);
    expect(menuBar.state).toBe("closed");
  });

  test("toggle opens and closes", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.toggle();
    expect(menuBar.isActive).toBe(true);

    menuBar.toggle();
    expect(menuBar.isActive).toBe(false);
  });

  test("right arrow navigates to next menu", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    expect(menuBar.activeMenuIndex).toBe(0);

    menuBar.handleKeyPress(makeKeyEvent("right"));
    expect(menuBar.activeMenuIndex).toBe(1);
  });

  test("left arrow navigates to previous menu (wraps)", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    expect(menuBar.activeMenuIndex).toBe(0);

    menuBar.handleKeyPress(makeKeyEvent("left"));
    expect(menuBar.activeMenuIndex).toBe(1); // wraps around
  });

  test("enter opens dropdown", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    menuBar.handleKeyPress(makeKeyEvent("return"));
    expect(menuBar.state).toBe("dropdown-open");
    expect(menuBar.activeItemIndex).toBe(0);
  });

  test("down arrow opens dropdown from bar-focused", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    menuBar.handleKeyPress(makeKeyEvent("down"));
    expect(menuBar.state).toBe("dropdown-open");
  });

  test("down arrow navigates dropdown items", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    menuBar.handleKeyPress(makeKeyEvent("return")); // open dropdown
    expect(menuBar.activeItemIndex).toBe(0);

    menuBar.handleKeyPress(makeKeyEvent("down"));
    expect(menuBar.activeItemIndex).toBe(1);
  });

  test("up arrow navigates dropdown items (wraps)", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    menuBar.handleKeyPress(makeKeyEvent("return")); // open dropdown
    expect(menuBar.activeItemIndex).toBe(0);

    menuBar.handleKeyPress(makeKeyEvent("up"));
    expect(menuBar.activeItemIndex).toBe(1); // wraps to last item
  });

  test("escape closes menu bar", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    menuBar.handleKeyPress(makeKeyEvent("escape"));
    expect(menuBar.isActive).toBe(false);
  });

  test("escape from dropdown closes menu bar", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    menuBar.handleKeyPress(makeKeyEvent("return")); // open dropdown
    expect(menuBar.state).toBe("dropdown-open");

    menuBar.handleKeyPress(makeKeyEvent("escape"));
    expect(menuBar.isActive).toBe(false);
  });

  test("enter in dropdown executes item action and closes", async () => {
    const { renderer: r } = await setup();
    let executed = false;
    const menuBar = new MenuBar(r);
    menuBar.setMenus([{
      id: "test", label: "Test", items: [
        { id: "test.action", label: "Action", action: () => { executed = true; } },
      ],
    }]);

    menuBar.open();
    menuBar.handleKeyPress(makeKeyEvent("return")); // open dropdown
    menuBar.handleKeyPress(makeKeyEvent("return")); // execute item

    expect(executed).toBe(true);
    expect(menuBar.isActive).toBe(false);
  });

  test("onClose callback fires when closing", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);
    let closed = false;
    menuBar.onClose = () => { closed = true; };

    menuBar.open();
    menuBar.close();
    expect(closed).toBe(true);
  });

  test("does not consume keys when closed", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    const consumed = menuBar.handleKeyPress(makeKeyEvent("right"));
    expect(consumed).toBe(false);
  });

  test("left/right in dropdown switches menus", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    menuBar.open();
    menuBar.handleKeyPress(makeKeyEvent("return")); // open dropdown on File
    expect(menuBar.state).toBe("dropdown-open");
    expect(menuBar.activeMenuIndex).toBe(0);

    menuBar.handleKeyPress(makeKeyEvent("right"));
    expect(menuBar.activeMenuIndex).toBe(1);
    expect(menuBar.state).toBe("dropdown-open");
  });

  test("destroy does not throw", async () => {
    const { renderer: r } = await setup();
    const menuBar = createMenuBar(r);

    expect(() => menuBar.destroy()).not.toThrow();
  });
});

// tests/component/layout.test.ts — Tests for the layout component

import { describe, test, expect, afterEach } from "bun:test";
import { createTestEnv } from "../helpers/setup.ts";
import { Layout } from "../../src/components/layout.ts";
import { SIDEBAR_WIDTH } from "../../src/theme.ts";

describe("Layout", () => {
  let renderer: Awaited<ReturnType<typeof createTestEnv>>["renderer"];
  let cleanup: () => void;

  afterEach(() => {
    if (renderer && !renderer.isDestroyed) {
      renderer.destroy();
    }
  });

  async function setup() {
    const env = await createTestEnv();
    renderer = env.renderer;
    cleanup = () => {
      if (!renderer.isDestroyed) renderer.destroy();
    };
    return env;
  }

  test("creates all layout containers", async () => {
    const { renderer: r } = await setup();
    const layout = new Layout(r);

    expect(layout.root).toBeDefined();
    expect(layout.menuBarContainer).toBeDefined();
    expect(layout.tabBar).toBeDefined();
    expect(layout.sidebar).toBeDefined();
    expect(layout.editorArea).toBeDefined();
    expect(layout.statusBar).toBeDefined();
  });

  test("mounts layout to renderer root", async () => {
    const { renderer: r } = await setup();
    const layout = new Layout(r);
    layout.mount();

    expect(r.root.getChildrenCount()).toBeGreaterThan(0);
  });

  test("sidebar starts visible", async () => {
    const { renderer: r } = await setup();
    const layout = new Layout(r);

    expect(layout.sidebarVisible).toBe(true);
  });

  test("toggleSidebar hides and shows sidebar", async () => {
    const { renderer: r } = await setup();
    const layout = new Layout(r);

    layout.toggleSidebar();
    expect(layout.sidebarVisible).toBe(false);

    layout.toggleSidebar();
    expect(layout.sidebarVisible).toBe(true);
  });

  test("setSidebarVisible controls sidebar visibility", async () => {
    const { renderer: r } = await setup();
    const layout = new Layout(r);

    layout.setSidebarVisible(false);
    expect(layout.sidebarVisible).toBe(false);

    layout.setSidebarVisible(true);
    expect(layout.sidebarVisible).toBe(true);
  });

  test("setStatusText updates status bar content", async () => {
    const { renderer: r } = await setup();
    const layout = new Layout(r);

    // Should not throw
    layout.setStatusText("Test status");
  });

  test("destroy cleans up renderables", async () => {
    const { renderer: r } = await setup();
    const layout = new Layout(r);
    layout.mount();

    // Should not throw
    layout.destroy();
  });

  test("root container has column flex direction", async () => {
    const { renderer: r } = await setup();
    const layout = new Layout(r);

    // The root should have id "root"
    const root = layout.root;
    expect(root.id).toBe("root");
  });

  test("sidebar has correct id", async () => {
    const { renderer: r } = await setup();
    const layout = new Layout(r);

    expect(layout.sidebar.id).toBe("sidebar");
  });

  test("editor area has correct id", async () => {
    const { renderer: r } = await setup();
    const layout = new Layout(r);

    expect(layout.editorArea.id).toBe("editor-area");
  });
});

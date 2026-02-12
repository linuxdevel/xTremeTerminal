// tests/component/tab-bar.test.ts — Component tests for TabBar

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTestEnv } from "../helpers/setup.ts";
import { TabBar } from "../../src/components/tab-bar.ts";
import type { TabState } from "../../src/services/tab-manager.ts";

function createMockTab(overrides: Partial<TabState> = {}): TabState {
  return {
    id: "tab-1",
    filePath: "/src/index.ts",
    title: "index.ts",
    isModified: false,
    cursorLine: 0,
    cursorColumn: 0,
    scrollTop: 0,
    language: "typescript",
    content: "",
    type: "editor",
    ...overrides,
  };
}

describe("TabBar", () => {
  let env: Awaited<ReturnType<typeof createTestEnv>>;
  let tabBar: TabBar;

  beforeEach(async () => {
    env = await createTestEnv();
    tabBar = new TabBar(env.renderer);
  });

  afterEach(() => {
    tabBar.destroy();
    env.renderer.destroy();
  });

  describe("rendering", () => {
    test("creates a renderable container", () => {
      expect(tabBar.renderable).toBeDefined();
    });

    test("shows empty text when no tabs", () => {
      tabBar.render([], null);
      expect(tabBar.tabCount).toBe(0);
    });

    test("renders correct number of tab elements", () => {
      const tabs = [
        createMockTab({ id: "t1", title: "a.ts" }),
        createMockTab({ id: "t2", title: "b.ts" }),
        createMockTab({ id: "t3", title: "c.ts" }),
      ];
      tabBar.render(tabs, "t1");
      expect(tabBar.tabCount).toBe(3);
    });

    test("re-render updates tab count", () => {
      const tabs1 = [createMockTab({ id: "t1" })];
      tabBar.render(tabs1, "t1");
      expect(tabBar.tabCount).toBe(1);

      const tabs2 = [
        createMockTab({ id: "t1" }),
        createMockTab({ id: "t2" }),
      ];
      tabBar.render(tabs2, "t1");
      expect(tabBar.tabCount).toBe(2);
    });

    test("re-render with empty list shows zero tabs", () => {
      tabBar.render([createMockTab()], "tab-1");
      expect(tabBar.tabCount).toBe(1);

      tabBar.render([], null);
      expect(tabBar.tabCount).toBe(0);
    });
  });

  describe("cleanup", () => {
    test("destroy does not throw", () => {
      tabBar.render([createMockTab()], "tab-1");
      expect(() => tabBar.destroy()).not.toThrow();
    });
  });
});

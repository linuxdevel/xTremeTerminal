// tests/unit/tab-manager.test.ts — Tests for TabManager service

import { describe, test, expect, beforeEach } from "bun:test";
import { TabManager } from "../../src/services/tab-manager.ts";

describe("TabManager", () => {
  let tm: TabManager;

  beforeEach(() => {
    tm = new TabManager();
  });

  describe("openTab", () => {
    test("opens a tab and sets it as active", () => {
      const tab = tm.openTab("/src/index.ts", "console.log('hello');", "typescript");
      expect(tab.filePath).toBe("/src/index.ts");
      expect(tab.title).toBe("index.ts");
      expect(tab.content).toBe("console.log('hello');");
      expect(tab.language).toBe("typescript");
      expect(tab.isModified).toBe(false);
      expect(tm.getActiveTab()).toBe(tab);
    });

    test("adds tab to the list", () => {
      tm.openTab("/src/a.ts", "a");
      tm.openTab("/src/b.ts", "b");
      expect(tm.getAllTabs().length).toBe(2);
    });

    test("reuses existing tab for same file path", () => {
      const tab1 = tm.openTab("/src/a.ts", "content1");
      tm.openTab("/src/b.ts", "content2");
      const tab3 = tm.openTab("/src/a.ts", "content3");
      expect(tab3.id).toBe(tab1.id);
      expect(tm.getAllTabs().length).toBe(2);
      expect(tm.getActiveTab()?.id).toBe(tab1.id);
    });

    test("fires onTabChange callback", () => {
      let changed = "";
      tm.onTabChange = (tab) => { changed = tab.id; };
      const tab = tm.openTab("/src/a.ts", "a");
      expect(changed).toBe(tab.id);
    });

    test("fires onTabListChange callback", () => {
      let count = 0;
      tm.onTabListChange = (tabs) => { count = tabs.length; };
      tm.openTab("/src/a.ts", "a");
      expect(count).toBe(1);
    });
  });

  describe("closeTab", () => {
    test("removes tab and returns next active", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const tab2 = tm.openTab("/src/b.ts", "b");
      const next = tm.closeTab(tab2.id);
      expect(next?.id).toBe(tab1.id);
      expect(tm.getAllTabs().length).toBe(1);
    });

    test("returns null when closing last tab", () => {
      const tab = tm.openTab("/src/a.ts", "a");
      const result = tm.closeTab(tab.id);
      expect(result).toBeNull();
      expect(tm.getAllTabs().length).toBe(0);
      expect(tm.getActiveTab()).toBeNull();
    });

    test("returns null for non-existent tab ID", () => {
      expect(tm.closeTab("nonexistent")).toBeNull();
    });

    test("selects adjacent tab after closing active", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const tab2 = tm.openTab("/src/b.ts", "b");
      const tab3 = tm.openTab("/src/c.ts", "c");

      // Close middle tab (active is tab3)
      tm.switchToTab(tab2.id);
      const next = tm.closeTab(tab2.id);
      // Should select tab at same index or last
      expect(next).not.toBeNull();
      expect(tm.getActiveTab()).not.toBeNull();
    });

    test("fires onTabClose callback", () => {
      let closedId: string | null = null;
      tm.onTabClose = (tab) => { closedId = tab.id; };
      const tab = tm.openTab("/src/a.ts", "a");
      tm.closeTab(tab.id);
      expect(closedId).toBe(tab.id);
    });

    test("closing non-active tab preserves active tab", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const tab2 = tm.openTab("/src/b.ts", "b");
      const tab3 = tm.openTab("/src/c.ts", "c");
      // tab3 is active
      tm.closeTab(tab1.id);
      expect(tm.getActiveTab()?.id).toBe(tab3.id);
      expect(tm.getAllTabs().length).toBe(2);
    });
  });

  describe("switchToTab", () => {
    test("switches active tab", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const tab2 = tm.openTab("/src/b.ts", "b");
      expect(tm.getActiveTab()?.id).toBe(tab2.id);

      tm.switchToTab(tab1.id);
      expect(tm.getActiveTab()?.id).toBe(tab1.id);
    });

    test("returns null for non-existent tab", () => {
      expect(tm.switchToTab("nonexistent")).toBeNull();
    });

    test("fires onTabChange when switching", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const tab2 = tm.openTab("/src/b.ts", "b");

      let changedId: string | null = null;
      tm.onTabChange = (tab) => { changedId = tab.id; };

      tm.switchToTab(tab1.id);
      expect(changedId).toBe(tab1.id);
    });

    test("does not fire onTabChange when switching to same tab", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      let called = false;
      tm.onTabChange = () => { called = true; };

      tm.switchToTab(tab1.id);
      expect(called).toBe(false);
    });
  });

  describe("nextTab / previousTab", () => {
    test("nextTab cycles forward", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const tab2 = tm.openTab("/src/b.ts", "b");
      const tab3 = tm.openTab("/src/c.ts", "c");

      // tab3 is active, next should wrap to tab1
      tm.switchToTab(tab1.id);
      const next = tm.nextTab();
      expect(next?.id).toBe(tab2.id);
    });

    test("nextTab wraps around from last to first", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const tab2 = tm.openTab("/src/b.ts", "b");
      // tab2 is active (last), next should wrap to tab1
      const next = tm.nextTab();
      expect(next?.id).toBe(tab1.id);
    });

    test("previousTab cycles backward", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const tab2 = tm.openTab("/src/b.ts", "b");
      const tab3 = tm.openTab("/src/c.ts", "c");

      tm.switchToTab(tab2.id);
      const prev = tm.previousTab();
      expect(prev?.id).toBe(tab1.id);
    });

    test("previousTab wraps around from first to last", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const tab2 = tm.openTab("/src/b.ts", "b");
      tm.switchToTab(tab1.id);
      const prev = tm.previousTab();
      expect(prev?.id).toBe(tab2.id);
    });

    test("nextTab returns same tab when only one tab", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const next = tm.nextTab();
      expect(next?.id).toBe(tab1.id);
    });

    test("previousTab returns same tab when only one tab", () => {
      const tab1 = tm.openTab("/src/a.ts", "a");
      const prev = tm.previousTab();
      expect(prev?.id).toBe(tab1.id);
    });
  });

  describe("newUntitledTab", () => {
    test("creates untitled tab with empty content", () => {
      const tab = tm.newUntitledTab();
      expect(tab.title).toBe("Untitled");
      expect(tab.filePath).toBeNull();
      expect(tab.content).toBe("");
      expect(tab.language).toBeNull();
      expect(tab.isModified).toBe(false);
    });

    test("creates unique untitled titles", () => {
      const tab1 = tm.newUntitledTab();
      const tab2 = tm.newUntitledTab();
      const tab3 = tm.newUntitledTab();
      expect(tab1.title).toBe("Untitled");
      expect(tab2.title).toBe("Untitled-2");
      expect(tab3.title).toBe("Untitled-3");
    });

    test("sets new untitled tab as active", () => {
      tm.openTab("/src/a.ts", "a");
      const untitled = tm.newUntitledTab();
      expect(tm.getActiveTab()?.id).toBe(untitled.id);
    });
  });

  describe("state management", () => {
    test("updateTabContent updates content", () => {
      const tab = tm.openTab("/src/a.ts", "old");
      tm.updateTabContent(tab.id, "new");
      expect(tm.getTab(tab.id)?.content).toBe("new");
    });

    test("updateTabCursor saves cursor position", () => {
      const tab = tm.openTab("/src/a.ts", "a");
      tm.updateTabCursor(tab.id, 5, 10);
      expect(tm.getTab(tab.id)?.cursorLine).toBe(5);
      expect(tm.getTab(tab.id)?.cursorColumn).toBe(10);
    });

    test("updateTabScroll saves scroll position", () => {
      const tab = tm.openTab("/src/a.ts", "a");
      tm.updateTabScroll(tab.id, 42);
      expect(tm.getTab(tab.id)?.scrollTop).toBe(42);
    });

    test("markModified updates modified flag", () => {
      const tab = tm.openTab("/src/a.ts", "a");
      expect(tab.isModified).toBe(false);
      tm.markModified(tab.id, true);
      expect(tm.getTab(tab.id)?.isModified).toBe(true);
    });

    test("markModified fires onTabListChange", () => {
      const tab = tm.openTab("/src/a.ts", "a");
      let called = false;
      tm.onTabListChange = () => { called = true; };
      tm.markModified(tab.id, true);
      expect(called).toBe(true);
    });

    test("markModified does not fire for same value", () => {
      const tab = tm.openTab("/src/a.ts", "a");
      let callCount = 0;
      tm.onTabListChange = () => { callCount++; };
      tm.markModified(tab.id, false); // Already false
      expect(callCount).toBe(0);
    });

    test("renameTab updates path and title", () => {
      const tab = tm.openTab("/src/a.ts", "a");
      tm.renameTab(tab.id, "/src/renamed.ts");
      const updated = tm.getTab(tab.id);
      expect(updated?.filePath).toBe("/src/renamed.ts");
      expect(updated?.title).toBe("renamed.ts");
    });
  });

  describe("queries", () => {
    test("getActiveTab returns null when no tabs", () => {
      expect(tm.getActiveTab()).toBeNull();
    });

    test("getTab returns null for non-existent ID", () => {
      expect(tm.getTab("nonexistent")).toBeNull();
    });

    test("getAllTabs returns a copy", () => {
      tm.openTab("/src/a.ts", "a");
      const tabs = tm.getAllTabs();
      tabs.push({} as any);
      expect(tm.getAllTabs().length).toBe(1); // original unchanged
    });

    test("findTabByPath returns correct tab", () => {
      tm.openTab("/src/a.ts", "a");
      const tab2 = tm.openTab("/src/b.ts", "b");
      const found = tm.findTabByPath("/src/b.ts");
      expect(found?.id).toBe(tab2.id);
    });

    test("findTabByPath returns null for unknown path", () => {
      expect(tm.findTabByPath("/unknown")).toBeNull();
    });

    test("hasUnsavedTabs returns false when all saved", () => {
      tm.openTab("/src/a.ts", "a");
      expect(tm.hasUnsavedTabs()).toBe(false);
    });

    test("hasUnsavedTabs returns true when any modified", () => {
      const tab = tm.openTab("/src/a.ts", "a");
      tm.markModified(tab.id, true);
      expect(tm.hasUnsavedTabs()).toBe(true);
    });

    test("tabCount returns correct count", () => {
      expect(tm.tabCount).toBe(0);
      tm.openTab("/src/a.ts", "a");
      expect(tm.tabCount).toBe(1);
      tm.openTab("/src/b.ts", "b");
      expect(tm.tabCount).toBe(2);
    });

    test("activeId returns null when no tabs", () => {
      expect(tm.activeId).toBeNull();
    });

    test("activeId returns correct ID", () => {
      const tab = tm.openTab("/src/a.ts", "a");
      expect(tm.activeId).toBe(tab.id);
    });
  });
});

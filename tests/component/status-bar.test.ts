// tests/component/status-bar.test.ts — Component tests for StatusBar

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTestEnv, delay } from "../helpers/setup.ts";
import { StatusBar } from "../../src/components/status-bar.ts";
import type { StatusBarState, MessageType } from "../../src/components/status-bar.ts";

describe("StatusBar", () => {
  let env: Awaited<ReturnType<typeof createTestEnv>>;
  let statusBar: StatusBar;

  beforeEach(async () => {
    env = await createTestEnv();
    statusBar = new StatusBar(env.renderer);
    env.renderer.root.add(statusBar.renderable);
  });

  afterEach(() => {
    statusBar.destroy();
    env.renderer.destroy();
  });

  describe("initial state", () => {
    test("has default state values", () => {
      const state = statusBar.state;
      expect(state.filename).toBeNull();
      expect(state.cursorLine).toBe(0);
      expect(state.cursorColumn).toBe(0);
      expect(state.language).toBeNull();
      expect(state.encoding).toBe("UTF-8");
      expect(state.indentStyle).toBe("4 spaces");
      expect(state.isModified).toBe(false);
      expect(state.totalLines).toBe(0);
    });

    test("is not showing a message", () => {
      expect(statusBar.isShowingMessage).toBe(false);
    });

    test("renderable is accessible", () => {
      expect(statusBar.renderable).toBeDefined();
    });
  });

  describe("update", () => {
    test("updates filename", () => {
      statusBar.update({ filename: "app.ts" });
      expect(statusBar.state.filename).toBe("app.ts");
    });

    test("updates cursor position", () => {
      statusBar.update({ cursorLine: 10, cursorColumn: 5 });
      expect(statusBar.state.cursorLine).toBe(10);
      expect(statusBar.state.cursorColumn).toBe(5);
    });

    test("updates language", () => {
      statusBar.update({ language: "TypeScript" });
      expect(statusBar.state.language).toBe("TypeScript");
    });

    test("updates encoding", () => {
      statusBar.update({ encoding: "ASCII" });
      expect(statusBar.state.encoding).toBe("ASCII");
    });

    test("updates indent style", () => {
      statusBar.update({ indentStyle: "2 spaces" });
      expect(statusBar.state.indentStyle).toBe("2 spaces");
    });

    test("updates modified flag", () => {
      statusBar.update({ isModified: true });
      expect(statusBar.state.isModified).toBe(true);
    });

    test("updates total lines", () => {
      statusBar.update({ totalLines: 150 });
      expect(statusBar.state.totalLines).toBe(150);
    });

    test("partial update preserves other fields", () => {
      statusBar.update({ filename: "test.ts", language: "TypeScript" });
      statusBar.update({ cursorLine: 5 });
      expect(statusBar.state.filename).toBe("test.ts");
      expect(statusBar.state.language).toBe("TypeScript");
      expect(statusBar.state.cursorLine).toBe(5);
    });

    test("state returns a copy (not mutable reference)", () => {
      const state1 = statusBar.state;
      statusBar.update({ filename: "changed.ts" });
      const state2 = statusBar.state;
      expect(state1.filename).toBeNull();
      expect(state2.filename).toBe("changed.ts");
    });
  });

  describe("showMessage", () => {
    test("sets isShowingMessage to true", () => {
      statusBar.showMessage("File saved", "success");
      expect(statusBar.isShowingMessage).toBe(true);
    });

    test("auto-dismisses after timeout", async () => {
      statusBar.showMessage("Saved", "success", 50);
      expect(statusBar.isShowingMessage).toBe(true);

      await delay(100);
      expect(statusBar.isShowingMessage).toBe(false);
    });

    test("subsequent message replaces previous", () => {
      statusBar.showMessage("First", "info");
      statusBar.showMessage("Second", "error");
      expect(statusBar.isShowingMessage).toBe(true);
    });

    test("update during message does not clear message display", () => {
      statusBar.showMessage("Important", "error", 5000);
      statusBar.update({ filename: "new.ts" });

      // State should be updated but message still showing
      expect(statusBar.state.filename).toBe("new.ts");
      expect(statusBar.isShowingMessage).toBe(true);
    });

    test("after message dismisses, state is rendered", async () => {
      statusBar.update({ filename: "test.ts" });
      statusBar.showMessage("Saved!", "success", 50);
      expect(statusBar.isShowingMessage).toBe(true);

      await delay(100);
      expect(statusBar.isShowingMessage).toBe(false);
      // State should still be correct
      expect(statusBar.state.filename).toBe("test.ts");
    });
  });

  describe("modified indicator", () => {
    test("modified flag is tracked in state", () => {
      statusBar.update({ filename: "app.ts", isModified: true });
      expect(statusBar.state.isModified).toBe(true);

      statusBar.update({ isModified: false });
      expect(statusBar.state.isModified).toBe(false);
    });
  });

  describe("untitled state", () => {
    test("shows default when no filename set", () => {
      // Default state has null filename
      expect(statusBar.state.filename).toBeNull();
    });

    test("can set filename to null", () => {
      statusBar.update({ filename: "test.ts" });
      statusBar.update({ filename: null });
      expect(statusBar.state.filename).toBeNull();
    });
  });

  describe("cleanup", () => {
    test("destroy does not throw", () => {
      expect(() => statusBar.destroy()).not.toThrow();
    });

    test("destroy does not throw when message timer is active", () => {
      statusBar.showMessage("Test", "info", 5000);
      expect(() => statusBar.destroy()).not.toThrow();
    });
  });
});

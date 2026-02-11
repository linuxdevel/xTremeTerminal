// tests/component/file-tree.test.ts — Tests for file tree component

import { describe, test, expect, afterEach, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { createTestEnv, createTempDir, cleanupTempDir } from "../helpers/setup.ts";
import { FileTree } from "../../src/components/file-tree.ts";
import { KeyEvent } from "@opentui/core";

// Helper to create a mock KeyEvent
function createKeyEvent(
  name: string,
  modifiers: { ctrl?: boolean; meta?: boolean; shift?: boolean } = {},
): KeyEvent {
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

describe("FileTree", () => {
  let renderer: Awaited<ReturnType<typeof createTestEnv>>["renderer"];
  let tempDir: string;

  beforeEach(async () => {
    const env = await createTestEnv();
    renderer = env.renderer;
    tempDir = createTempDir();
  });

  afterEach(() => {
    if (renderer && !renderer.isDestroyed) {
      renderer.destroy();
    }
    cleanupTempDir(tempDir);
  });

  test("creates file tree component", async () => {
    const tree = new FileTree(renderer, tempDir);
    expect(tree.renderable).toBeDefined();
  });

  test("loads directory contents", async () => {
    // Create test files
    fs.mkdirSync(path.join(tempDir, "src"));
    fs.writeFileSync(path.join(tempDir, "README.md"), "# Hello");
    fs.writeFileSync(path.join(tempDir, "index.ts"), "export {}");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    expect(tree.itemCount).toBe(3); // src, index.ts, README.md
  });

  test("starts with first item selected", async () => {
    fs.writeFileSync(path.join(tempDir, "a.txt"), "");
    fs.writeFileSync(path.join(tempDir, "b.txt"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    expect(tree.selectedIndex).toBe(0);
  });

  test("moveDown advances selection", async () => {
    fs.writeFileSync(path.join(tempDir, "a.txt"), "");
    fs.writeFileSync(path.join(tempDir, "b.txt"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    tree.moveDown();
    expect(tree.selectedIndex).toBe(1);
  });

  test("moveUp goes back", async () => {
    fs.writeFileSync(path.join(tempDir, "a.txt"), "");
    fs.writeFileSync(path.join(tempDir, "b.txt"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    tree.moveDown();
    tree.moveUp();
    expect(tree.selectedIndex).toBe(0);
  });

  test("moveUp does not go below 0", async () => {
    fs.writeFileSync(path.join(tempDir, "a.txt"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    tree.moveUp();
    expect(tree.selectedIndex).toBe(0);
  });

  test("moveDown does not exceed item count", async () => {
    fs.writeFileSync(path.join(tempDir, "a.txt"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    tree.moveDown();
    tree.moveDown();
    tree.moveDown();
    expect(tree.selectedIndex).toBe(0); // Only 1 item
  });

  test("moveToFirst goes to index 0", async () => {
    fs.writeFileSync(path.join(tempDir, "a.txt"), "");
    fs.writeFileSync(path.join(tempDir, "b.txt"), "");
    fs.writeFileSync(path.join(tempDir, "c.txt"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    tree.moveDown();
    tree.moveDown();
    tree.moveToFirst();
    expect(tree.selectedIndex).toBe(0);
  });

  test("moveToLast goes to last item", async () => {
    fs.writeFileSync(path.join(tempDir, "a.txt"), "");
    fs.writeFileSync(path.join(tempDir, "b.txt"), "");
    fs.writeFileSync(path.join(tempDir, "c.txt"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    tree.moveToLast();
    expect(tree.selectedIndex).toBe(2);
  });

  test("expandOrEnter expands a directory", async () => {
    fs.mkdirSync(path.join(tempDir, "src"));
    fs.writeFileSync(path.join(tempDir, "src", "index.ts"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    // First item should be "src" directory
    expect(tree.selectedEntry?.name).toBe("src");
    expect(tree.selectedEntry?.isExpanded).toBe(false);

    await tree.expandOrEnter();

    // After expansion, src is expanded and its children are visible
    expect(tree.itemCount).toBe(2); // src + index.ts
  });

  test("expandOrEnter on expanded dir collapses it", async () => {
    fs.mkdirSync(path.join(tempDir, "src"));
    fs.writeFileSync(path.join(tempDir, "src", "index.ts"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    await tree.expandOrEnter(); // expand
    expect(tree.itemCount).toBe(2);

    await tree.expandOrEnter(); // collapse
    expect(tree.itemCount).toBe(1);
  });

  test("collapseOrParent collapses expanded directory", async () => {
    fs.mkdirSync(path.join(tempDir, "src"));
    fs.writeFileSync(path.join(tempDir, "src", "index.ts"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    await tree.expandOrEnter(); // expand
    tree.collapseOrParent(); // collapse

    expect(tree.selectedEntry?.isExpanded).toBe(false);
    expect(tree.itemCount).toBe(1);
  });

  test("file select callback is called for files", async () => {
    fs.writeFileSync(path.join(tempDir, "test.txt"), "content");

    const tree = new FileTree(renderer, tempDir);
    let selectedPath = "";
    tree.onFileSelect = (filePath) => {
      selectedPath = filePath;
    };
    await tree.load();

    await tree.expandOrEnter(); // should call onFileSelect

    expect(selectedPath).toBe(path.join(tempDir, "test.txt"));
  });

  test("handleKeyPress returns true for consumed keys", async () => {
    fs.writeFileSync(path.join(tempDir, "a.txt"), "");
    fs.writeFileSync(path.join(tempDir, "b.txt"), "");

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    expect(tree.handleKeyPress(createKeyEvent("down"))).toBe(true);
    expect(tree.handleKeyPress(createKeyEvent("up"))).toBe(true);
    expect(tree.handleKeyPress(createKeyEvent("home"))).toBe(true);
    expect(tree.handleKeyPress(createKeyEvent("end"))).toBe(true);
  });

  test("handleKeyPress returns false for unhandled keys", async () => {
    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    expect(tree.handleKeyPress(createKeyEvent("a"))).toBe(false);
    expect(tree.handleKeyPress(createKeyEvent("x"))).toBe(false);
  });

  test("directories appear before files", async () => {
    fs.writeFileSync(path.join(tempDir, "zebra.txt"), "");
    fs.mkdirSync(path.join(tempDir, "alpha"));

    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    expect(tree.selectedEntry?.name).toBe("alpha");
    expect(tree.selectedEntry?.isDirectory).toBe(true);
  });

  test("handles empty directory", async () => {
    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    expect(tree.itemCount).toBe(0);
    expect(tree.selectedIndex).toBe(0);
  });

  test("destroy cleans up", async () => {
    const tree = new FileTree(renderer, tempDir);
    await tree.load();

    // Should not throw
    tree.destroy();
  });
});

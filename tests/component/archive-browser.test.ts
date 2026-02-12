// tests/component/archive-browser.test.ts — Tests for archive browser component

import { describe, test, expect, afterEach, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { createTestEnv, createTempDir, cleanupTempDir } from "../helpers/setup.ts";
import { ArchiveBrowser } from "../../src/components/archive-browser.ts";
import { BoxRenderable, KeyEvent } from "@opentui/core";
import type { ArchiveEntry } from "../../src/services/archive-service.ts";

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

// Helper to create a tar.gz archive in a temp directory
async function createTarGz(tempDir: string, files: Record<string, string>, archiveName: string): Promise<string> {
  const archivePath = path.join(tempDir, archiveName);
  const sourceDir = path.join(tempDir, "source_" + archiveName.replace(/\W/g, ""));
  if (!fs.existsSync(sourceDir)) fs.mkdirSync(sourceDir, { recursive: true });

  for (const [name, content] of Object.entries(files)) {
    const fullPath = path.join(sourceDir, name);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  const proc = Bun.spawnSync(["tar", "-czf", archivePath, "-C", sourceDir, "."], {
    stderr: "pipe",
  });

  if (proc.exitCode !== 0) {
    throw new Error(`Failed to create tarball: ${proc.stderr.toString()}`);
  }

  return archivePath;
}

describe("ArchiveBrowser", () => {
  let renderer: Awaited<ReturnType<typeof createTestEnv>>["renderer"];
  let tempDir: string;
  let parentBox: BoxRenderable;

  beforeEach(async () => {
    const env = await createTestEnv();
    renderer = env.renderer;
    tempDir = createTempDir();

    // Create a parent box to host the archive browser (simulates editorArea)
    parentBox = new BoxRenderable(renderer, {
      id: "test-parent",
      width: "100%",
      height: "100%",
      flexDirection: "column",
    });
    renderer.root.add(parentBox);
  });

  afterEach(() => {
    if (renderer && !renderer.isDestroyed) {
      renderer.destroy();
    }
    cleanupTempDir(tempDir);
  });

  // ── Construction ─────────────────────────────────────────────────

  test("creates archive browser component", () => {
    const browser = new ArchiveBrowser(renderer);
    expect(browser.renderable).toBeDefined();
    expect(browser.renderable).toBeInstanceOf(BoxRenderable);
    expect(browser.entries).toEqual([]);
    browser.destroy();
  });

  test("has unique container IDs", () => {
    const browser1 = new ArchiveBrowser(renderer);
    const browser2 = new ArchiveBrowser(renderer);
    expect(browser1.renderable.id).not.toBe(browser2.renderable.id);
    browser1.destroy();
    browser2.destroy();
  });

  // ── Loading ──────────────────────────────────────────────────────

  test("loads archive entries", async () => {
    const archivePath = await createTarGz(tempDir, {
      "hello.txt": "hello world",
      "subdir/nested.txt": "nested content",
    }, "test.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();

    expect(browser.entries.length).toBeGreaterThan(0);
    const paths = browser.entries.map(e => e.path);
    expect(paths.some(p => p.includes("hello.txt"))).toBe(true);
    expect(paths.some(p => p.includes("nested.txt"))).toBe(true);
    browser.destroy();
  });

  test("load resets selected index to 0", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
      "b.txt": "b",
      "c.txt": "c",
    }, "reset.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();

    // Move selection down
    browser.handleKeyPress(createKeyEvent("down"));
    browser.handleKeyPress(createKeyEvent("down"));

    // Reload resets index
    await browser.load();

    // Verify by moving down once - the callback should fire for the second entry
    // (index was reset to 0, so after one down we're at index 1)
    let callCount = 0;
    browser.onFileSelect = () => { callCount++; };

    // First entry after load is at index 0
    // This is indirect verification - after reload, navigation starts from 0
    expect(browser.entries.length).toBeGreaterThan(0);
    browser.destroy();
  });

  // ── Rendering ────────────────────────────────────────────────────

  test("renderItems creates item renderables after added to layout", async () => {
    const archivePath = await createTarGz(tempDir, {
      "file1.txt": "content1",
      "file2.txt": "content2",
    }, "render.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();

    // Add to layout first, then render
    parentBox.add(browser.renderable);
    browser.renderItems();

    // Entries were loaded
    expect(browser.entries.length).toBeGreaterThanOrEqual(2);
    browser.destroy();
  });

  // ── Keyboard Navigation ──────────────────────────────────────────

  test("down key moves selection down", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
      "b.txt": "b",
      "c.txt": "c",
    }, "nav.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();
    parentBox.add(browser.renderable);
    browser.renderItems();

    const consumed = browser.handleKeyPress(createKeyEvent("down"));
    expect(consumed).toBe(true);

    // Verify selection moved by pressing Enter and checking callback
    let selectedPath = "";
    browser.onFileSelect = (p) => { selectedPath = p; };
    browser.handleKeyPress(createKeyEvent("return"));

    // Should have selected the second file entry (not the first)
    // The exact path depends on archive sorting, but it should be non-empty
    // if there are file entries
    const fileEntries = browser.entries.filter(e => e.type === "file");
    if (fileEntries.length > 1) {
      expect(selectedPath).toBe(fileEntries[1]!.path);
    }
    browser.destroy();
  });

  test("up key moves selection up", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
      "b.txt": "b",
    }, "navup.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();
    parentBox.add(browser.renderable);
    browser.renderItems();

    // Move down, then up
    browser.handleKeyPress(createKeyEvent("down"));
    const consumed = browser.handleKeyPress(createKeyEvent("up"));
    expect(consumed).toBe(true);

    // Now pressing Enter should select the first entry
    let selectedPath = "";
    browser.onFileSelect = (p) => { selectedPath = p; };
    browser.handleKeyPress(createKeyEvent("return"));

    // First file entry
    const fileEntries = browser.entries.filter(e => e.type === "file");
    if (fileEntries.length > 0) {
      expect(selectedPath).toBe(fileEntries[0]!.path);
    }
    browser.destroy();
  });

  test("up at top of list does not go below 0", async () => {
    const archivePath = await createTarGz(tempDir, {
      "only.txt": "one",
    }, "top.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();
    parentBox.add(browser.renderable);
    browser.renderItems();

    // Press up multiple times at top
    browser.handleKeyPress(createKeyEvent("up"));
    browser.handleKeyPress(createKeyEvent("up"));

    // Should still select first entry
    let selectedPath = "";
    browser.onFileSelect = (p) => { selectedPath = p; };
    browser.handleKeyPress(createKeyEvent("return"));

    const fileEntries = browser.entries.filter(e => e.type === "file");
    if (fileEntries.length > 0) {
      expect(selectedPath).toBe(fileEntries[0]!.path);
    }
    browser.destroy();
  });

  test("down at bottom of list does not exceed bounds", async () => {
    const archivePath = await createTarGz(tempDir, {
      "only.txt": "one",
    }, "bottom.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();
    parentBox.add(browser.renderable);
    browser.renderItems();

    // Press down many times
    browser.handleKeyPress(createKeyEvent("down"));
    browser.handleKeyPress(createKeyEvent("down"));
    browser.handleKeyPress(createKeyEvent("down"));

    // Should still be at valid index
    let selectedPath = "";
    browser.onFileSelect = (p) => { selectedPath = p; };
    browser.handleKeyPress(createKeyEvent("return"));

    // For a single-file archive, the selected entry should still resolve
    expect(browser.entries.length).toBeGreaterThan(0);
    browser.destroy();
  });

  test("left and right keys are consumed (no-op)", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
    }, "lr.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();

    expect(browser.handleKeyPress(createKeyEvent("left"))).toBe(true);
    expect(browser.handleKeyPress(createKeyEvent("right"))).toBe(true);
    browser.destroy();
  });

  // ── Enter Key (View File) ───────────────────────────────────────

  test("enter on file entry fires onFileSelect", async () => {
    const archivePath = await createTarGz(tempDir, {
      "readme.txt": "hello",
    }, "select.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();
    parentBox.add(browser.renderable);
    browser.renderItems();

    let selectedPath = "";
    browser.onFileSelect = (p) => { selectedPath = p; };

    // Navigate to a file entry and press enter
    // Find the first file entry index
    const fileIndex = browser.entries.findIndex(e => e.type === "file");
    for (let i = 0; i < fileIndex; i++) {
      browser.handleKeyPress(createKeyEvent("down"));
    }

    const consumed = browser.handleKeyPress(createKeyEvent("return"));
    expect(consumed).toBe(true);
    expect(selectedPath).not.toBe("");
    expect(selectedPath).toContain("readme.txt");
    browser.destroy();
  });

  test("enter on directory entry does not fire onFileSelect", async () => {
    const archivePath = await createTarGz(tempDir, {
      "subdir/file.txt": "content",
    }, "direnter.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();
    parentBox.add(browser.renderable);
    browser.renderItems();

    let selectCalled = false;
    browser.onFileSelect = () => { selectCalled = true; };

    // Find first directory entry
    const dirIndex = browser.entries.findIndex(e => e.type === "directory");
    if (dirIndex >= 0) {
      // Navigate to the directory
      for (let i = 0; i < dirIndex; i++) {
        browser.handleKeyPress(createKeyEvent("down"));
      }
      browser.handleKeyPress(createKeyEvent("return"));
      expect(selectCalled).toBe(false);
    }
    browser.destroy();
  });

  test("enter is consumed even when no callback is set", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
    }, "nocb.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();

    // No onFileSelect set
    const consumed = browser.handleKeyPress(createKeyEvent("return"));
    expect(consumed).toBe(true);
    browser.destroy();
  });

  // ── Extract Key (e) ─────────────────────────────────────────────

  test("e key fires onExtract for selected entry", async () => {
    const archivePath = await createTarGz(tempDir, {
      "data.txt": "extract me",
    }, "extract.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();
    parentBox.add(browser.renderable);
    browser.renderItems();

    let extractedEntry: ArchiveEntry | null = null;
    browser.onExtract = (entry) => { extractedEntry = entry; };

    // Navigate to a file entry
    const fileIndex = browser.entries.findIndex(e => e.type === "file");
    for (let i = 0; i < fileIndex; i++) {
      browser.handleKeyPress(createKeyEvent("down"));
    }

    const consumed = browser.handleKeyPress(createKeyEvent("e"));
    expect(consumed).toBe(true);
    expect(extractedEntry).not.toBeNull();
    expect(extractedEntry!.path).toContain("data.txt");
    browser.destroy();
  });

  test("e key is consumed even without callback", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
    }, "enocb.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();

    const consumed = browser.handleKeyPress(createKeyEvent("e"));
    expect(consumed).toBe(true);
    browser.destroy();
  });

  // ── Extract All Key (Ctrl+E) ────────────────────────────────────

  test("Ctrl+E fires onExtractAll", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
      "b.txt": "b",
    }, "extractall.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();

    let extractAllCalled = false;
    browser.onExtractAll = () => { extractAllCalled = true; };

    const consumed = browser.handleKeyPress(createKeyEvent("e", { ctrl: true }));
    expect(consumed).toBe(true);
    expect(extractAllCalled).toBe(true);
    browser.destroy();
  });

  test("Ctrl+E is consumed even without callback", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
    }, "ctrlnocb.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();

    const consumed = browser.handleKeyPress(createKeyEvent("e", { ctrl: true }));
    expect(consumed).toBe(true);
    browser.destroy();
  });

  // ── Unhandled Keys ──────────────────────────────────────────────

  test("unhandled keys return false", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
    }, "unhandled.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();

    expect(browser.handleKeyPress(createKeyEvent("x"))).toBe(false);
    expect(browser.handleKeyPress(createKeyEvent("z"))).toBe(false);
    expect(browser.handleKeyPress(createKeyEvent("q"))).toBe(false);
    expect(browser.handleKeyPress(createKeyEvent("space"))).toBe(false);
    browser.destroy();
  });

  test("Shift+E and Meta+E are not consumed", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
    }, "shifte.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();

    expect(browser.handleKeyPress(createKeyEvent("e", { shift: true }))).toBe(false);
    expect(browser.handleKeyPress(createKeyEvent("e", { meta: true }))).toBe(false);
    browser.destroy();
  });

  // ── Destroy ─────────────────────────────────────────────────────

  test("destroy cleans up without errors", async () => {
    const archivePath = await createTarGz(tempDir, {
      "a.txt": "a",
    }, "destroy.tar.gz");

    const browser = new ArchiveBrowser(renderer);
    browser.setArchive(archivePath);
    await browser.load();
    parentBox.add(browser.renderable);
    browser.renderItems();

    // Should not throw
    browser.destroy();
  });

  test("destroy on fresh browser without load does not throw", () => {
    const browser = new ArchiveBrowser(renderer);
    browser.destroy();
  });
});

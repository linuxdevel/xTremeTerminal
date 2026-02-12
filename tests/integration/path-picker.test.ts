// tests/integration/path-picker.test.ts
import { describe, test, expect, afterEach, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { createTestEnv, createTempDir, cleanupTempDir } from "../helpers/setup.ts";
import { App } from "../../src/app.ts";

describe("Path Picker Integration", () => {
  let renderer: any;
  let tempDir: string;
  let app: App;

  beforeEach(async () => {
    const env = await createTestEnv();
    renderer = env.renderer;
    tempDir = createTempDir();

    // Create some subdirectories for the picker to list
    fs.mkdirSync(path.join(tempDir, "subdir1"));
    fs.mkdirSync(path.join(tempDir, "subdir2"));

    app = new App();
    await app.start({ renderer, rootDir: tempDir });
  });

  afterEach(async () => {
    // Wait for any pending async ops before cleanup
    await new Promise(resolve => setTimeout(resolve, 50));
    if (app) app.forceQuit();
    cleanupTempDir(tempDir);
  });

  test("path picker can be shown and sets isVisible", async () => {
    const picker = (app as any).pathPicker;

    // show() is async — must await it
    await picker.show({
      title: "Test Picker",
      initialPath: tempDir,
      onSelect: () => {},
      onCancel: () => {},
    });

    expect(picker.isVisible).toBe(true);
    expect(picker.renderable.visible).toBe(true);
  });

  test("path picker hides on cancel", async () => {
    const picker = (app as any).pathPicker;

    let cancelled = false;
    await picker.show({
      title: "Test Picker",
      initialPath: tempDir,
      onSelect: () => {},
      onCancel: () => { cancelled = true; },
    });

    expect(picker.isVisible).toBe(true);

    // Simulate Escape key
    const { KeyEvent } = await import("@opentui/core");
    const escEvent = Object.create(KeyEvent.prototype) as InstanceType<typeof KeyEvent>;
    Object.assign(escEvent, {
      name: "escape",
      ctrl: false,
      meta: false,
      shift: false,
      option: false,
      sequence: "",
      number: false,
      raw: "escape",
      eventType: "press",
      source: "raw",
    });
    picker.handleKeyPress(escEvent);

    expect(picker.isVisible).toBe(false);
    expect(cancelled).toBe(true);
  });
});

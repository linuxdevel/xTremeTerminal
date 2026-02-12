// tests/integration/archive-browser.test.ts — Integration tests for archive browsing
import { describe, test, expect, afterEach, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { createTestEnv, createTempDir, cleanupTempDir } from "../helpers/setup.ts";
import { App } from "../../src/app.ts";

describe("Archive Browser Integration", () => {
  let renderer: any;
  let tempDir: string;
  let app: App;

  beforeEach(async () => {
    const env = await createTestEnv();
    renderer = env.renderer;
    tempDir = createTempDir();
    
    // Create a dummy archive
    const archiveSource = path.join(tempDir, "source");
    fs.mkdirSync(archiveSource);
    fs.writeFileSync(path.join(archiveSource, "file1.txt"), "content1");
    fs.mkdirSync(path.join(archiveSource, "subdir"));
    fs.writeFileSync(path.join(archiveSource, "subdir", "file2.txt"), "content2");
    
    execSync(`tar -czf test.tar.gz -C ${archiveSource} .`, { cwd: tempDir });
    
    // Ensure file exists and is readable
    const archivePath = path.join(tempDir, "test.tar.gz");
    if (!fs.existsSync(archivePath)) throw new Error("Failed to create test archive");
    
    app = new App();
    await app.start({ renderer, rootDir: tempDir });
  });

  afterEach(async () => {
    if (app) app.forceQuit();
    // Give some time for cleanup
    await new Promise(resolve => setTimeout(resolve, 50));
    cleanupTempDir(tempDir);
  });

  test("opening an archive switches to archive focus", async () => {
    const archivePath = path.join(tempDir, "test.tar.gz");
    
    // Mock openFile (simulating file tree selection)
    await (app as any).openFile(archivePath);
    
    expect(app.focus).toBe("archive");
    const activeTab = app.getTabManager().getActiveTab();
    expect(activeTab?.type).toBe("archive");
    expect(activeTab?.filePath).toBe(archivePath);
  });

  test("archive browser shows contents", async () => {
    const archivePath = path.join(tempDir, "test.tar.gz");
    await (app as any).openFile(archivePath);
    
    // Wait for async load
    await new Promise(resolve => setTimeout(resolve, 100));

    const browser = (app as any).archiveBrowser;
    expect(browser.entries.length).toBeGreaterThan(0);
    
    // Check for expected entries
    const paths = browser.entries.map((e: any) => e.path);
    expect(paths).toContain("./file1.txt");
    expect(paths).toContain("./subdir/file2.txt");
  });
});

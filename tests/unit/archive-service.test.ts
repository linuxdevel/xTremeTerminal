// tests/unit/archive-service.test.ts — Tests for archive service

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { ArchiveService } from "../../src/services/archive-service.ts";
import { createTempDir, cleanupTempDir } from "../helpers/setup.ts";

describe("ArchiveService", () => {
  let service: ArchiveService;
  let tempDir: string;

  beforeEach(() => {
    service = new ArchiveService();
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  async function createTarGz(files: Record<string, string>, archiveName: string): Promise<string> {
    const archivePath = path.join(tempDir, archiveName);
    const sourceDir = path.join(tempDir, "source_" + archiveName.replace(/\W/g, ""));
    if (!fs.existsSync(sourceDir)) fs.mkdirSync(sourceDir, { recursive: true });

    for (const [name, content] of Object.entries(files)) {
      const fullPath = path.join(sourceDir, name);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, content);
    }

    // Use shell to create tarball for simplicity in test setup
    const proc = Bun.spawnSync(["tar", "-czf", archivePath, "-C", sourceDir, "."], {
      stderr: "pipe",
    });
    
    if (proc.exitCode !== 0) {
      throw new Error(`Failed to create tarball: ${proc.stderr.toString()}`);
    }

    return archivePath;
  }

  describe("listEntries", () => {
    test("lists all entries in a .tar.gz", async () => {
      const archivePath = await createTarGz({
        "test.txt": "hello",
        "subdir/world.txt": "world"
      }, "test.tar.gz");

      const entries = await service.listEntries(archivePath);
      
      const paths = entries.map(e => e.path.replace(/^\.\//, ""));
      expect(paths).toContain("test.txt");
      expect(paths).toContain("subdir/world.txt");
      
      const testFile = entries.find(e => e.path.replace(/^\.\//, "") === "test.txt")!;
      expect(testFile.type).toBe("file");
      expect(testFile.size).toBe(5);
    });

    test("handles .tar files", async () => {
      const sourceDir = path.join(tempDir, "source_tar");
      fs.mkdirSync(sourceDir, { recursive: true });
      fs.writeFileSync(path.join(sourceDir, "foo.txt"), "bar");
      
      const archivePath = path.join(tempDir, "test.tar");
      Bun.spawnSync(["tar", "-cf", archivePath, "-C", sourceDir, "."], { stderr: "pipe" });

      const entries = await service.listEntries(archivePath);
      const paths = entries.map(e => e.path.replace(/^\.\//, ""));
      expect(paths).toContain("foo.txt");
    });
  });

  describe("readFile", () => {
    test("reads content of a file in the archive", async () => {
      const archivePath = await createTarGz({
        "secret.txt": "my-secret-content"
      }, "data.tar.gz");

      const entries = await service.listEntries(archivePath);
      const entry = entries.find(e => e.path.endsWith("secret.txt"))!;

      const content = await service.readFile(archivePath, entry.path);
      expect(content).toBe("my-secret-content");
    });

    test("returns null for non-existent entry", async () => {
      const archivePath = await createTarGz({ "a.txt": "a" }, "a.tar.gz");
      const content = await service.readFile(archivePath, "missing.txt");
      expect(content).toBeNull();
    });
  });

  describe("extract", () => {
    test("extracts entire archive", async () => {
      const archivePath = await createTarGz({
        "a.txt": "content a",
        "b.txt": "content b"
      }, "all.tar.gz");

      const outDir = path.join(tempDir, "out_all");
      fs.mkdirSync(outDir, { recursive: true });

      const success = await service.extract(archivePath, null, outDir);
      expect(success).toBe(true);
      
      expect(fs.readFileSync(path.join(outDir, "a.txt"), "utf-8")).toBe("content a");
      expect(fs.readFileSync(path.join(outDir, "b.txt"), "utf-8")).toBe("content b");
    });

    test("extracts single file", async () => {
      const archivePath = await createTarGz({
        "a.txt": "a",
        "b.txt": "b"
      }, "single.tar.gz");

      const outDir = path.join(tempDir, "out_single");
      fs.mkdirSync(outDir, { recursive: true });

      const entries = await service.listEntries(archivePath);
      const entryA = entries.find(e => e.path.endsWith("a.txt"))!;

      const success = await service.extract(archivePath, entryA.path, outDir);
      expect(success).toBe(true);
      
      expect(fs.existsSync(path.join(outDir, "a.txt"))).toBe(true);
      expect(fs.existsSync(path.join(outDir, "b.txt"))).toBe(false);
    });
  });

  describe("isArchive", () => {
    test("identifies supported extensions", () => {
      expect(service.isArchive("test.tar.gz")).toBe(true);
      expect(service.isArchive("test.tgz")).toBe(true);
      expect(service.isArchive("test.tar")).toBe(true);
      expect(service.isArchive("TEST.TAR.GZ")).toBe(true);
    });

    test("returns false for unsupported extensions", () => {
      expect(service.isArchive("test.zip")).toBe(false);
      expect(service.isArchive("test.txt")).toBe(false);
      expect(service.isArchive("tar.gz.txt")).toBe(false);
    });
  });
});

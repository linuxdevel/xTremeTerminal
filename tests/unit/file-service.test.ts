// tests/unit/file-service.test.ts — Tests for file service

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { FileService } from "../../src/services/file-service.ts";
import { createTempDir, cleanupTempDir, createTempFile } from "../helpers/setup.ts";

describe("FileService", () => {
  let service: FileService;
  let tempDir: string;

  beforeEach(() => {
    service = new FileService();
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe("readDirectory", () => {
    test("returns sorted entries (dirs first, then files)", async () => {
      // Create files and dirs
      fs.mkdirSync(path.join(tempDir, "beta-dir"));
      fs.mkdirSync(path.join(tempDir, "alpha-dir"));
      fs.writeFileSync(path.join(tempDir, "zebra.txt"), "");
      fs.writeFileSync(path.join(tempDir, "apple.txt"), "");

      const entries = await service.readDirectory(tempDir);

      // Directories should come first, alphabetically
      expect(entries[0]?.name).toBe("alpha-dir");
      expect(entries[0]?.isDirectory).toBe(true);
      expect(entries[1]?.name).toBe("beta-dir");
      expect(entries[1]?.isDirectory).toBe(true);

      // Files should come after, alphabetically
      expect(entries[2]?.name).toBe("apple.txt");
      expect(entries[2]?.isDirectory).toBe(false);
      expect(entries[3]?.name).toBe("zebra.txt");
      expect(entries[3]?.isDirectory).toBe(false);
    });

    test("handles empty directories", async () => {
      const entries = await service.readDirectory(tempDir);
      expect(entries).toEqual([]);
    });

    test("handles non-existent directory gracefully", async () => {
      const entries = await service.readDirectory("/nonexistent/path/1234567890");
      expect(entries).toEqual([]);
    });

    test("excludes hidden entries by default", async () => {
      fs.writeFileSync(path.join(tempDir, ".hidden"), "");
      fs.writeFileSync(path.join(tempDir, "visible.txt"), "");
      fs.mkdirSync(path.join(tempDir, "node_modules"));
      fs.mkdirSync(path.join(tempDir, ".git"));

      const entries = await service.readDirectory(tempDir);
      const names = entries.map((e) => e.name);

      expect(names).not.toContain(".hidden");
      expect(names).not.toContain("node_modules");
      expect(names).not.toContain(".git");
      expect(names).toContain("visible.txt");
    });

    test("includes hidden entries when requested", async () => {
      fs.writeFileSync(path.join(tempDir, ".hidden"), "");
      fs.writeFileSync(path.join(tempDir, "visible.txt"), "");

      const entries = await service.readDirectory(tempDir, 0, true);
      const names = entries.map((e) => e.name);

      expect(names).toContain(".hidden");
      expect(names).toContain("visible.txt");
    });

    test("sets correct depth", async () => {
      fs.writeFileSync(path.join(tempDir, "file.txt"), "");

      const entries = await service.readDirectory(tempDir, 3);
      expect(entries[0]?.depth).toBe(3);
    });

    test("entries have correct paths", async () => {
      fs.writeFileSync(path.join(tempDir, "test.txt"), "");

      const entries = await service.readDirectory(tempDir);
      expect(entries[0]?.path).toBe(path.join(tempDir, "test.txt"));
    });

    test("directories start collapsed", async () => {
      fs.mkdirSync(path.join(tempDir, "subdir"));

      const entries = await service.readDirectory(tempDir);
      expect(entries[0]?.isExpanded).toBe(false);
    });
  });

  describe("readFileContent", () => {
    test("reads text file content", async () => {
      const content = "Hello, world!\nLine 2";
      createTempFile(tempDir, "test.txt", content);

      const result = await service.readFileContent(path.join(tempDir, "test.txt"));
      expect(result).toBe(content);
    });

    test("returns null for non-existent file", async () => {
      const result = await service.readFileContent(path.join(tempDir, "nope.txt"));
      expect(result).toBeNull();
    });
  });

  describe("writeFileContent", () => {
    test("writes content to file", async () => {
      const filePath = path.join(tempDir, "output.txt");
      await service.writeFileContent(filePath, "test content");

      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toBe("test content");
    });
  });

  describe("getFileStats", () => {
    test("returns stats for existing file", async () => {
      createTempFile(tempDir, "stats.txt", "hello");

      const stats = await service.getFileStats(path.join(tempDir, "stats.txt"));
      expect(stats).not.toBeNull();
      expect(stats?.size).toBe(5);
      expect(stats?.isDirectory).toBe(false);
    });

    test("returns stats for directory", async () => {
      const stats = await service.getFileStats(tempDir);
      expect(stats).not.toBeNull();
      expect(stats?.isDirectory).toBe(true);
    });

    test("returns null for non-existent path", async () => {
      const stats = await service.getFileStats(path.join(tempDir, "nope"));
      expect(stats).toBeNull();
    });
  });

  describe("isTextFile", () => {
    test("identifies text files", async () => {
      createTempFile(tempDir, "code.ts", "const x = 1;");
      const result = await service.isTextFile(path.join(tempDir, "code.ts"));
      expect(result).toBe(true);
    });

    test("identifies binary files by extension", async () => {
      createTempFile(tempDir, "image.png", "fake png content");
      const result = await service.isTextFile(path.join(tempDir, "image.png"));
      expect(result).toBe(false);
    });

    test("identifies binary files by null bytes", async () => {
      const filePath = path.join(tempDir, "binary.dat");
      const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x00, 0x6f]);
      fs.writeFileSync(filePath, buffer);

      const result = await service.isTextFile(filePath);
      expect(result).toBe(false);
    });
  });

  describe("buildTree", () => {
    test("returns one level deep", async () => {
      fs.mkdirSync(path.join(tempDir, "src"));
      fs.writeFileSync(path.join(tempDir, "src", "index.ts"), "");
      fs.writeFileSync(path.join(tempDir, "README.md"), "");

      const tree = await service.buildTree(tempDir);

      // Should have src dir and README.md at depth 0
      expect(tree.length).toBe(2);
      expect(tree[0]?.depth).toBe(0);
      expect(tree[1]?.depth).toBe(0);

      // Should NOT have loaded children of src
      expect(tree[0]?.children).toBeUndefined();
    });
  });

  describe("expandDirectory", () => {
    test("loads children lazily", async () => {
      fs.mkdirSync(path.join(tempDir, "src"));
      fs.writeFileSync(path.join(tempDir, "src", "app.ts"), "");
      fs.writeFileSync(path.join(tempDir, "src", "index.ts"), "");

      const tree = await service.buildTree(tempDir);
      const srcDir = tree.find((e) => e.name === "src")!;

      expect(srcDir.children).toBeUndefined();
      expect(srcDir.isExpanded).toBe(false);

      const children = await service.expandDirectory(srcDir);

      expect(srcDir.isExpanded).toBe(true);
      expect(srcDir.children).toBeDefined();
      expect(children.length).toBe(2);
      expect(children[0]?.depth).toBe(1);
    });
  });

  describe("collapseDirectory", () => {
    test("collapses an expanded directory", async () => {
      fs.mkdirSync(path.join(tempDir, "src"));
      fs.writeFileSync(path.join(tempDir, "src", "index.ts"), "");

      const tree = await service.buildTree(tempDir);
      const srcDir = tree.find((e) => e.name === "src")!;

      await service.expandDirectory(srcDir);
      expect(srcDir.isExpanded).toBe(true);

      service.collapseDirectory(srcDir);
      expect(srcDir.isExpanded).toBe(false);
      // Children should still be in memory
      expect(srcDir.children).toBeDefined();
    });
  });

  describe("flattenTree", () => {
    test("flattens a collapsed tree", async () => {
      fs.mkdirSync(path.join(tempDir, "src"));
      fs.writeFileSync(path.join(tempDir, "src", "index.ts"), "");
      fs.writeFileSync(path.join(tempDir, "README.md"), "");

      const tree = await service.buildTree(tempDir);
      const flat = service.flattenTree(tree);

      // Only top-level items (src is collapsed)
      expect(flat.length).toBe(2);
    });

    test("includes children of expanded directories", async () => {
      fs.mkdirSync(path.join(tempDir, "src"));
      fs.writeFileSync(path.join(tempDir, "src", "index.ts"), "");
      fs.writeFileSync(path.join(tempDir, "README.md"), "");

      const tree = await service.buildTree(tempDir);
      const srcDir = tree.find((e) => e.name === "src")!;
      await service.expandDirectory(srcDir);

      const flat = service.flattenTree(tree);

      // src + src/index.ts + README.md
      expect(flat.length).toBe(3);
      expect(flat[0]?.name).toBe("src");
      expect(flat[1]?.name).toBe("index.ts");
      expect(flat[2]?.name).toBe("README.md");
    });
  });

  describe("file operations", () => {
    test("exists returns true for existing file", async () => {
      createTempFile(tempDir, "exists.txt", "content");
      const result = await service.exists(path.join(tempDir, "exists.txt"));
      expect(result).toBe(true);
    });

    test("exists returns false for non-existent file", async () => {
      const result = await service.exists(path.join(tempDir, "nope.txt"));
      expect(result).toBe(false);
    });

    test("createFile creates a new empty file", async () => {
      const filePath = path.join(tempDir, "new-file.txt");
      await service.createFile(filePath);

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, "utf-8")).toBe("");
    });

    test("createDirectory creates a new directory", async () => {
      const dirPath = path.join(tempDir, "new-dir");
      await service.createDirectory(dirPath);

      expect(fs.existsSync(dirPath)).toBe(true);
      expect(fs.statSync(dirPath).isDirectory()).toBe(true);
    });

    test("delete removes a file", async () => {
      const filePath = path.join(tempDir, "delete-me.txt");
      createTempFile(tempDir, "delete-me.txt", "content");

      await service.delete(filePath);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    test("rename moves a file", async () => {
      const oldPath = path.join(tempDir, "old.txt");
      const newPath = path.join(tempDir, "new.txt");
      createTempFile(tempDir, "old.txt", "content");

      await service.rename(oldPath, newPath);
      expect(fs.existsSync(oldPath)).toBe(false);
      expect(fs.existsSync(newPath)).toBe(true);
    });
  });
});

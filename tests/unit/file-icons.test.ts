// tests/unit/file-icons.test.ts — Tests for file icons utility

import { describe, test, expect } from "bun:test";
import {
  getFileIcon,
  getIconWidth,
  getKnownExtensions,
  getKnownFilenames,
  ICON_DIR_COLLAPSED,
  ICON_DIR_EXPANDED,
  ICON_FILE_DEFAULT,
} from "../../src/utils/file-icons.ts";

describe("File Icons", () => {
  describe("getFileIcon", () => {
    test("returns collapsed icon for collapsed directory", () => {
      const icon = getFileIcon("src", true, false);
      expect(icon).toBe(ICON_DIR_COLLAPSED);
    });

    test("returns expanded icon for expanded directory", () => {
      const icon = getFileIcon("src", true, true);
      expect(icon).toBe(ICON_DIR_EXPANDED);
    });

    test("returns TS icon for .ts files", () => {
      const icon = getFileIcon("index.ts", false);
      expect(icon).toBe("TS");
    });

    test("returns JS icon for .js files", () => {
      const icon = getFileIcon("app.js", false);
      expect(icon).toBe("JS");
    });

    test("returns JSON icon for .json files", () => {
      const icon = getFileIcon("package.json", false);
      // package.json matches filename map first
      expect(icon).toBe("{}");
    });

    test("returns markdown icon for .md files", () => {
      const icon = getFileIcon("notes.md", false);
      expect(icon).toBe("¶");
    });

    test("returns Python icon for .py files", () => {
      const icon = getFileIcon("script.py", false);
      expect(icon).toBe("PY");
    });

    test("returns Go icon for .go files", () => {
      const icon = getFileIcon("main.go", false);
      expect(icon).toBe("GO");
    });

    test("returns Rust icon for .rs files", () => {
      const icon = getFileIcon("lib.rs", false);
      expect(icon).toBe("RS");
    });

    test("returns default icon for unknown extensions", () => {
      const icon = getFileIcon("file.xyz", false);
      expect(icon).toBe(ICON_FILE_DEFAULT);
    });

    test("returns default icon for files without extension", () => {
      const icon = getFileIcon("somefile", false);
      expect(icon).toBe(ICON_FILE_DEFAULT);
    });

    test("matches special filenames", () => {
      const icon = getFileIcon("Dockerfile", false);
      expect(icon).toBeDefined();
      expect(icon).not.toBe(ICON_FILE_DEFAULT);
    });

    test("filename match has priority over extension", () => {
      // README.md should match the filename pattern
      const icon = getFileIcon("README.md", false);
      expect(icon).toBe("¶");
    });
  });

  describe("getIconWidth", () => {
    test("returns correct width for single-char icons", () => {
      expect(getIconWidth(ICON_DIR_COLLAPSED)).toBe(1);
      expect(getIconWidth(ICON_FILE_DEFAULT)).toBe(1);
    });

    test("returns correct width for two-char icons", () => {
      expect(getIconWidth("TS")).toBe(2);
      expect(getIconWidth("JS")).toBe(2);
    });
  });

  describe("getKnownExtensions", () => {
    test("returns non-empty array", () => {
      const exts = getKnownExtensions();
      expect(exts.length).toBeGreaterThan(0);
    });

    test("includes common extensions", () => {
      const exts = getKnownExtensions();
      expect(exts).toContain(".ts");
      expect(exts).toContain(".js");
      expect(exts).toContain(".json");
      expect(exts).toContain(".md");
      expect(exts).toContain(".py");
    });
  });

  describe("getKnownFilenames", () => {
    test("returns non-empty array", () => {
      const names = getKnownFilenames();
      expect(names.length).toBeGreaterThan(0);
    });

    test("includes Dockerfile", () => {
      const names = getKnownFilenames();
      expect(names).toContain("Dockerfile");
    });
  });
});

// tests/unit/language-detect.test.ts — Tests for language detection utility

import { describe, test, expect } from "bun:test";
import {
  detectLanguage,
  getSupportedExtensions,
  getSupportedLanguages,
} from "../../src/utils/language-detect.ts";

describe("detectLanguage", () => {
  describe("TypeScript/JavaScript", () => {
    test("detects .ts as typescript", () => {
      expect(detectLanguage("src/app.ts")).toBe("typescript");
    });

    test("detects .tsx as tsx", () => {
      expect(detectLanguage("component.tsx")).toBe("tsx");
    });

    test("detects .js as javascript", () => {
      expect(detectLanguage("index.js")).toBe("javascript");
    });

    test("detects .jsx as jsx", () => {
      expect(detectLanguage("App.jsx")).toBe("jsx");
    });

    test("detects .mjs as javascript", () => {
      expect(detectLanguage("module.mjs")).toBe("javascript");
    });

    test("detects .cjs as javascript", () => {
      expect(detectLanguage("config.cjs")).toBe("javascript");
    });

    test("detects .mts as typescript", () => {
      expect(detectLanguage("module.mts")).toBe("typescript");
    });
  });

  describe("Web languages", () => {
    test("detects .html as html", () => {
      expect(detectLanguage("index.html")).toBe("html");
    });

    test("detects .htm as html", () => {
      expect(detectLanguage("page.htm")).toBe("html");
    });

    test("detects .css as css", () => {
      expect(detectLanguage("styles.css")).toBe("css");
    });
  });

  describe("Data/config formats", () => {
    test("detects .json as json", () => {
      expect(detectLanguage("package.json")).toBe("json");
    });

    test("detects .yaml as yaml", () => {
      expect(detectLanguage("config.yaml")).toBe("yaml");
    });

    test("detects .yml as yaml", () => {
      expect(detectLanguage("config.yml")).toBe("yaml");
    });

    test("detects .toml as toml", () => {
      expect(detectLanguage("Cargo.toml")).toBe("toml");
    });
  });

  describe("Systems languages", () => {
    test("detects .rs as rust", () => {
      expect(detectLanguage("main.rs")).toBe("rust");
    });

    test("detects .go as go", () => {
      expect(detectLanguage("main.go")).toBe("go");
    });

    test("detects .c as c", () => {
      expect(detectLanguage("main.c")).toBe("c");
    });

    test("detects .cpp as cpp", () => {
      expect(detectLanguage("main.cpp")).toBe("cpp");
    });

    test("detects .zig as zig", () => {
      expect(detectLanguage("build.zig")).toBe("zig");
    });
  });

  describe("Scripting languages", () => {
    test("detects .py as python", () => {
      expect(detectLanguage("script.py")).toBe("python");
    });

    test("detects .rb as ruby", () => {
      expect(detectLanguage("app.rb")).toBe("ruby");
    });

    test("detects .sh as bash", () => {
      expect(detectLanguage("setup.sh")).toBe("bash");
    });

    test("detects .bash as bash", () => {
      expect(detectLanguage("script.bash")).toBe("bash");
    });
  });

  describe("Markdown", () => {
    test("detects .md as markdown", () => {
      expect(detectLanguage("README.md")).toBe("markdown");
    });

    test("detects .mdx as markdown", () => {
      expect(detectLanguage("page.mdx")).toBe("markdown");
    });
  });

  describe("Case insensitivity", () => {
    test("handles uppercase extensions", () => {
      expect(detectLanguage("file.TS")).toBe("typescript");
    });

    test("handles mixed case extensions", () => {
      expect(detectLanguage("file.Py")).toBe("python");
    });
  });

  describe("Filename-based detection", () => {
    test("detects Dockerfile", () => {
      expect(detectLanguage("Dockerfile")).toBe("dockerfile");
    });

    test("detects Makefile", () => {
      expect(detectLanguage("Makefile")).toBe("make");
    });

    test("detects .bashrc as bash", () => {
      expect(detectLanguage(".bashrc")).toBe("bash");
    });

    test("detects .gitignore", () => {
      expect(detectLanguage(".gitignore")).toBe("gitignore");
    });

    test("filename detection takes priority over extension", () => {
      // Dockerfile has no extension, but should still be detected
      expect(detectLanguage("/path/to/Dockerfile")).toBe("dockerfile");
    });
  });

  describe("Unknown files", () => {
    test("returns null for unknown extension", () => {
      expect(detectLanguage("file.xyz")).toBeNull();
    });

    test("returns null for files with no extension and no known filename", () => {
      expect(detectLanguage("somefile")).toBeNull();
    });

    test("handles paths with directories", () => {
      expect(detectLanguage("/home/user/project/src/main.rs")).toBe("rust");
    });
  });
});

describe("getSupportedExtensions", () => {
  test("returns an array of extensions", () => {
    const exts = getSupportedExtensions();
    expect(Array.isArray(exts)).toBe(true);
    expect(exts.length).toBeGreaterThan(0);
  });

  test("all extensions start with a dot", () => {
    const exts = getSupportedExtensions();
    for (const ext of exts) {
      expect(ext.startsWith(".")).toBe(true);
    }
  });

  test("includes common extensions", () => {
    const exts = getSupportedExtensions();
    expect(exts).toContain(".ts");
    expect(exts).toContain(".js");
    expect(exts).toContain(".py");
    expect(exts).toContain(".rs");
  });
});

describe("getSupportedLanguages", () => {
  test("returns an array of unique languages", () => {
    const langs = getSupportedLanguages();
    expect(Array.isArray(langs)).toBe(true);
    expect(langs.length).toBeGreaterThan(0);
    // Should be unique
    expect(new Set(langs).size).toBe(langs.length);
  });

  test("returns sorted array", () => {
    const langs = getSupportedLanguages();
    const sorted = [...langs].sort();
    expect(langs).toEqual(sorted);
  });

  test("includes common languages", () => {
    const langs = getSupportedLanguages();
    expect(langs).toContain("typescript");
    expect(langs).toContain("javascript");
    expect(langs).toContain("python");
    expect(langs).toContain("rust");
    expect(langs).toContain("go");
  });
});

// tests/component/editor.test.ts — Tests for the editor component

import { describe, test, expect, afterEach, beforeEach } from "bun:test";
import * as fs from "node:fs";
import { createTestEnv, createTempDir, cleanupTempDir, createTempFile } from "../helpers/setup.ts";
import { Editor } from "../../src/components/editor.ts";

describe("Editor", () => {
  let renderer: Awaited<ReturnType<typeof createTestEnv>>["renderer"];
  let renderOnce: Awaited<ReturnType<typeof createTestEnv>>["renderOnce"];
  let tempDir: string;

  beforeEach(async () => {
    const env = await createTestEnv();
    renderer = env.renderer;
    renderOnce = env.renderOnce;
    tempDir = createTempDir();
  });

  afterEach(() => {
    if (renderer && !renderer.isDestroyed) {
      renderer.destroy();
    }
    cleanupTempDir(tempDir);
  });

  describe("initialization", () => {
    test("creates editor with renderable container", () => {
      const editor = new Editor(renderer);
      expect(editor.renderable).toBeDefined();
      expect(editor.renderable.id).toBe("editor-container");
    });

    test("starts with no file loaded", () => {
      const editor = new Editor(renderer);
      expect(editor.currentFilePath).toBeNull();
      expect(editor.hasFile).toBe(false);
    });

    test("starts unmodified", () => {
      const editor = new Editor(renderer);
      expect(editor.modified).toBe(false);
    });

    test("starts with welcome screen", () => {
      const editor = new Editor(renderer);
      expect(editor.isShowingWelcome).toBe(true);
    });

    test("starts with null language", () => {
      const editor = new Editor(renderer);
      expect(editor.language).toBeNull();
    });

    test("state reflects initial values", () => {
      const editor = new Editor(renderer);
      const state = editor.state;
      expect(state.filePath).toBeNull();
      expect(state.isModified).toBe(false);
      expect(state.language).toBeNull();
    });
  });

  describe("loadFile", () => {
    test("loads a text file successfully", async () => {
      const filePath = createTempFile(tempDir, "test.ts", "const x = 1;\n");
      const editor = new Editor(renderer);

      const result = await editor.loadFile(filePath);
      expect(result).toBe(true);
      expect(editor.currentFilePath).toBe(filePath);
      expect(editor.hasFile).toBe(true);
    });

    test("hides welcome screen after loading file", async () => {
      const filePath = createTempFile(tempDir, "test.ts", "hello\n");
      const editor = new Editor(renderer);

      await editor.loadFile(filePath);
      expect(editor.isShowingWelcome).toBe(false);
    });

    test("detects language from file extension", async () => {
      const filePath = createTempFile(tempDir, "app.ts", "const x = 1;\n");
      const editor = new Editor(renderer);

      await editor.loadFile(filePath);
      expect(editor.language).toBe("typescript");
    });

    test("detects python language", async () => {
      const filePath = createTempFile(tempDir, "script.py", "x = 1\n");
      const editor = new Editor(renderer);

      await editor.loadFile(filePath);
      expect(editor.language).toBe("python");
    });

    test("starts unmodified after loading", async () => {
      const filePath = createTempFile(tempDir, "test.ts", "const x = 1;\n");
      const editor = new Editor(renderer);

      await editor.loadFile(filePath);
      expect(editor.modified).toBe(false);
    });

    test("returns false for binary files", async () => {
      // Create a file with binary content (null bytes)
      const filePath = createTempFile(tempDir, "binary.bin", "");
      fs.writeFileSync(filePath, Buffer.from([0x00, 0x01, 0x02, 0xFF]));

      const editor = new Editor(renderer);
      const result = await editor.loadFile(filePath);
      expect(result).toBe(false);
      expect(editor.hasFile).toBe(false);
    });

    test("returns false for known binary extensions", async () => {
      const filePath = createTempFile(tempDir, "image.png", "not really a png");
      const editor = new Editor(renderer);

      const result = await editor.loadFile(filePath);
      expect(result).toBe(false);
    });

    test("loads empty files", async () => {
      const filePath = createTempFile(tempDir, "empty.ts", "");
      const editor = new Editor(renderer);

      const result = await editor.loadFile(filePath);
      expect(result).toBe(true);
      expect(editor.currentFilePath).toBe(filePath);
    });

    test("returns false for non-existent files", async () => {
      const editor = new Editor(renderer);
      const result = await editor.loadFile("/nonexistent/file.ts");
      expect(result).toBe(false);
    });
  });

  describe("saveFile", () => {
    test("saves file content to disk", async () => {
      const filePath = createTempFile(tempDir, "save-test.ts", "original content");
      const editor = new Editor(renderer);

      await editor.loadFile(filePath);
      // Insert some text to modify
      editor.handleKeyPress(createKeyEvent("a"));
      await renderOnce();

      const result = await editor.saveFile();
      expect(result).toBe(true);

      // File should have been written
      const savedContent = fs.readFileSync(filePath, "utf-8");
      expect(savedContent).toBeDefined();
    });

    test("clears modified flag after save", async () => {
      const filePath = createTempFile(tempDir, "save-test.ts", "content");
      const editor = new Editor(renderer);

      await editor.loadFile(filePath);
      editor.handleKeyPress(createKeyEvent("x"));
      await renderOnce();

      // Should be modified after typing
      expect(editor.modified).toBe(true);

      await editor.saveFile();
      expect(editor.modified).toBe(false);
    });

    test("calls onSave callback", async () => {
      const filePath = createTempFile(tempDir, "callback-test.ts", "content");
      const editor = new Editor(renderer);

      let savedPath = "";
      editor.onSave = (path) => {
        savedPath = path;
      };

      await editor.loadFile(filePath);
      await editor.saveFile();
      expect(savedPath).toBe(filePath);
    });

    test("returns false when no file is loaded", async () => {
      const editor = new Editor(renderer);
      const result = await editor.saveFile();
      expect(result).toBe(false);
    });
  });

  describe("newFile", () => {
    test("creates empty buffer", async () => {
      const editor = new Editor(renderer);
      await editor.newFile();

      expect(editor.currentFilePath).toBeNull();
      expect(editor.hasFile).toBe(false);
      expect(editor.modified).toBe(false);
      expect(editor.language).toBeNull();
    });

    test("hides welcome screen", async () => {
      const editor = new Editor(renderer);
      await editor.newFile();

      expect(editor.isShowingWelcome).toBe(false);
    });
  });

  describe("event callbacks", () => {
    test("onModifiedChange fires when content changes", async () => {
      const filePath = createTempFile(tempDir, "event-test.ts", "content");
      const editor = new Editor(renderer);

      let modifiedState = false;
      editor.onModifiedChange = (modified) => {
        modifiedState = modified;
      };

      await editor.loadFile(filePath);
      editor.handleKeyPress(createKeyEvent("a"));
      await renderOnce();

      expect(modifiedState).toBe(true);
    });

    test("onModifiedChange fires false after save", async () => {
      const filePath = createTempFile(tempDir, "event-test.ts", "content");
      const editor = new Editor(renderer);

      const states: boolean[] = [];
      editor.onModifiedChange = (modified) => {
        states.push(modified);
      };

      await editor.loadFile(filePath);
      editor.handleKeyPress(createKeyEvent("a"));
      await renderOnce();
      await editor.saveFile();

      expect(states).toContain(true);
      expect(states).toContain(false);
    });
  });

  describe("focus", () => {
    test("focus and blur do not throw", async () => {
      const editor = new Editor(renderer);

      expect(() => editor.focus()).not.toThrow();
      expect(() => editor.blur()).not.toThrow();
    });
  });

  describe("destroy", () => {
    test("destroy cleans up without errors", () => {
      const editor = new Editor(renderer);
      expect(() => editor.destroy()).not.toThrow();
    });
  });
});

// ── Helpers ────────────────────────────────────────────────────────

function createKeyEvent(name: string, options: {
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
} = {}): any {
  // Create a mock key event compatible with TextareaRenderable.handleKeyPress
  return {
    name,
    ctrl: options.ctrl ?? false,
    shift: options.shift ?? false,
    meta: options.meta ?? false,
    sequence: name,
    code: name,
    preventDefault: () => {},
    stopPropagation: () => {},
    isPropagationStopped: false,
    isDefaultPrevented: false,
  };
}

// tests/unit/clipboard.test.ts — Tests for Clipboard service

import { describe, test, expect, beforeEach } from "bun:test";
import { Clipboard } from "../../src/services/clipboard.ts";

describe("Clipboard", () => {
  let cb: Clipboard;

  beforeEach(() => {
    cb = new Clipboard();
  });

  describe("copy", () => {
    test("stores text in buffer", () => {
      cb.copy("hello world");
      expect(cb.paste()).toBe("hello world");
    });

    test("overwrites previous content", () => {
      cb.copy("first");
      cb.copy("second");
      expect(cb.paste()).toBe("second");
    });

    test("stores empty string", () => {
      cb.copy("something");
      cb.copy("");
      expect(cb.paste()).toBe("");
    });

    test("stores multiline text", () => {
      const text = "line 1\nline 2\nline 3";
      cb.copy(text);
      expect(cb.paste()).toBe(text);
    });
  });

  describe("cut", () => {
    test("stores and returns text", () => {
      const result = cb.cut("cut text");
      expect(result).toBe("cut text");
      expect(cb.paste()).toBe("cut text");
    });

    test("overwrites previous content", () => {
      cb.copy("first");
      cb.cut("second");
      expect(cb.paste()).toBe("second");
    });
  });

  describe("paste", () => {
    test("returns empty string when buffer is empty", () => {
      expect(cb.paste()).toBe("");
    });

    test("returns stored text repeatedly", () => {
      cb.copy("persistent");
      expect(cb.paste()).toBe("persistent");
      expect(cb.paste()).toBe("persistent");
      expect(cb.paste()).toBe("persistent");
    });
  });

  describe("hasContent", () => {
    test("returns false when empty", () => {
      expect(cb.hasContent()).toBe(false);
    });

    test("returns true after copy", () => {
      cb.copy("data");
      expect(cb.hasContent()).toBe(true);
    });

    test("returns true after cut", () => {
      cb.cut("data");
      expect(cb.hasContent()).toBe(true);
    });

    test("returns false after copying empty string", () => {
      cb.copy("something");
      cb.copy("");
      expect(cb.hasContent()).toBe(false);
    });
  });

  describe("clear", () => {
    test("empties the buffer", () => {
      cb.copy("data");
      cb.clear();
      expect(cb.paste()).toBe("");
      expect(cb.hasContent()).toBe(false);
    });

    test("clearing empty buffer does not throw", () => {
      expect(() => cb.clear()).not.toThrow();
    });
  });
});

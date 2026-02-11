// tests/unit/theme.test.ts — Tests for theme module

import { describe, test, expect } from "bun:test";
import {
  BG_PRIMARY,
  BG_SECONDARY,
  BG_HIGHLIGHT,
  BG_SELECTION,
  FG_PRIMARY,
  FG_SECONDARY,
  FG_MUTED,
  ACCENT,
  ERROR,
  WARNING,
  SUCCESS,
  INFO,
  SYNTAX_KEYWORD,
  SYNTAX_STRING,
  SYNTAX_COMMENT,
  SYNTAX_NUMBER,
  SYNTAX_FUNCTION,
  SYNTAX_TYPE,
  SYNTAX_VARIABLE,
  SYNTAX_PROPERTY,
  SYNTAX_OPERATOR,
  SYNTAX_TAG,
  SYNTAX_ATTRIBUTE,
  SIDEBAR_WIDTH,
  TAB_BAR_HEIGHT,
  STATUS_BAR_HEIGHT,
  DEFAULT_TAB_SIZE,
  ALL_COLORS,
  isValidHexColor,
  createSyntaxStyle,
  SYNTAX_STYLE,
} from "../../src/theme.ts";

describe("Theme", () => {
  describe("color constants", () => {
    test("all exported colors are valid hex strings", () => {
      for (const color of ALL_COLORS) {
        expect(isValidHexColor(color)).toBe(true);
      }
    });

    test("background colors are defined", () => {
      expect(BG_PRIMARY).toBe("#1a1b26");
      expect(BG_SECONDARY).toBe("#16161e");
      expect(BG_HIGHLIGHT).toBe("#24283b");
      expect(BG_SELECTION).toBe("#283457");
    });

    test("foreground colors are defined", () => {
      expect(FG_PRIMARY).toBe("#a9b1d6");
      expect(FG_SECONDARY).toBe("#565f89");
      expect(FG_MUTED).toBe("#3b4261");
    });

    test("accent colors are defined", () => {
      expect(ACCENT).toBe("#7aa2f7");
      expect(ERROR).toBe("#f7768e");
      expect(WARNING).toBe("#e0af68");
      expect(SUCCESS).toBe("#9ece6a");
      expect(INFO).toBe("#7dcfff");
    });

    test("syntax colors are defined", () => {
      expect(isValidHexColor(SYNTAX_KEYWORD)).toBe(true);
      expect(isValidHexColor(SYNTAX_STRING)).toBe(true);
      expect(isValidHexColor(SYNTAX_COMMENT)).toBe(true);
      expect(isValidHexColor(SYNTAX_NUMBER)).toBe(true);
      expect(isValidHexColor(SYNTAX_FUNCTION)).toBe(true);
      expect(isValidHexColor(SYNTAX_TYPE)).toBe(true);
      expect(isValidHexColor(SYNTAX_VARIABLE)).toBe(true);
      expect(isValidHexColor(SYNTAX_PROPERTY)).toBe(true);
      expect(isValidHexColor(SYNTAX_OPERATOR)).toBe(true);
      expect(isValidHexColor(SYNTAX_TAG)).toBe(true);
      expect(isValidHexColor(SYNTAX_ATTRIBUTE)).toBe(true);
    });
  });

  describe("UI constants", () => {
    test("sidebar width is a positive number", () => {
      expect(SIDEBAR_WIDTH).toBeGreaterThan(0);
      expect(typeof SIDEBAR_WIDTH).toBe("number");
    });

    test("tab bar height is 1", () => {
      expect(TAB_BAR_HEIGHT).toBe(1);
    });

    test("status bar height is 1", () => {
      expect(STATUS_BAR_HEIGHT).toBe(1);
    });

    test("default tab size is 4", () => {
      expect(DEFAULT_TAB_SIZE).toBe(4);
    });
  });

  describe("isValidHexColor", () => {
    test("accepts valid 6-digit hex colors", () => {
      expect(isValidHexColor("#000000")).toBe(true);
      expect(isValidHexColor("#ffffff")).toBe(true);
      expect(isValidHexColor("#1a1b26")).toBe(true);
      expect(isValidHexColor("#AABBCC")).toBe(true);
    });

    test("rejects invalid colors", () => {
      expect(isValidHexColor("")).toBe(false);
      expect(isValidHexColor("#fff")).toBe(false);
      expect(isValidHexColor("1a1b26")).toBe(false);
      expect(isValidHexColor("#gggggg")).toBe(false);
      expect(isValidHexColor("#1a1b2")).toBe(false);
      expect(isValidHexColor("#1a1b267")).toBe(false);
      expect(isValidHexColor("red")).toBe(false);
    });
  });

  describe("createSyntaxStyle", () => {
    test("creates a SyntaxStyle instance", () => {
      const style = createSyntaxStyle();
      expect(style).toBeDefined();
      expect(typeof style.getStyleCount).toBe("function");
    });

    test("has styles registered", () => {
      const style = createSyntaxStyle();
      expect(style.getStyleCount()).toBeGreaterThan(0);
    });

    test("has keyword style registered", () => {
      const style = createSyntaxStyle();
      const keyword = style.getStyle("keyword");
      expect(keyword).toBeDefined();
      expect(keyword?.bold).toBe(true);
    });

    test("has comment style with italic", () => {
      const style = createSyntaxStyle();
      const comment = style.getStyle("comment");
      expect(comment).toBeDefined();
      expect(comment?.italic).toBe(true);
    });
  });

  describe("SYNTAX_STYLE export", () => {
    test("is a pre-built SyntaxStyle instance", () => {
      expect(SYNTAX_STYLE).toBeDefined();
      expect(typeof SYNTAX_STYLE.getStyleCount).toBe("function");
      expect(SYNTAX_STYLE.getStyleCount()).toBeGreaterThan(0);
    });

    test("has all core token types", () => {
      const coreTokens = [
        "keyword", "string", "comment", "number", "function",
        "type", "variable", "property", "operator", "punctuation",
        "tag", "attribute", "default",
      ];
      for (const token of coreTokens) {
        const style = SYNTAX_STYLE.getStyle(token);
        expect(style).toBeDefined();
      }
    });

    test("has extended keyword styles", () => {
      expect(SYNTAX_STYLE.getStyle("keyword.control")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("keyword.import")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("keyword.operator")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("keyword.return")).toBeDefined();
    });

    test("has extended function styles", () => {
      expect(SYNTAX_STYLE.getStyle("function.call")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("function.method")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("function.builtin")).toBeDefined();
    });

    test("has extended type styles", () => {
      expect(SYNTAX_STYLE.getStyle("type.builtin")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("constructor")).toBeDefined();
    });

    test("has extended variable styles", () => {
      expect(SYNTAX_STYLE.getStyle("variable.builtin")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("variable.parameter")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("variable.member")).toBeDefined();
    });

    test("has markup styles for markdown", () => {
      expect(SYNTAX_STYLE.getStyle("markup.heading")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("markup.bold")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("markup.italic")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("markup.link")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("markup.raw")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("markup.list")).toBeDefined();
    });

    test("has string sub-styles", () => {
      expect(SYNTAX_STYLE.getStyle("string.special")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("string.escape")).toBeDefined();
    });

    test("has comment sub-styles", () => {
      expect(SYNTAX_STYLE.getStyle("comment.line")).toBeDefined();
      expect(SYNTAX_STYLE.getStyle("comment.block")).toBeDefined();
    });

    test("resolveStyleId returns valid IDs for known tokens", () => {
      const id = SYNTAX_STYLE.resolveStyleId("keyword");
      expect(id).not.toBeNull();
      expect(typeof id).toBe("number");
    });

    test("resolveStyleId returns null for unknown tokens", () => {
      const id = SYNTAX_STYLE.resolveStyleId("nonexistent.token.type");
      expect(id).toBeNull();
    });

    test("keyword styles use correct color", () => {
      const keyword = SYNTAX_STYLE.getStyle("keyword");
      expect(keyword).toBeDefined();
      expect(keyword?.bold).toBe(true);
    });

    test("comment styles are italic", () => {
      const styles = ["comment", "comment.line", "comment.block"];
      for (const name of styles) {
        const style = SYNTAX_STYLE.getStyle(name);
        expect(style?.italic).toBe(true);
      }
    });

    test("markup.heading is bold", () => {
      const heading = SYNTAX_STYLE.getStyle("markup.heading");
      expect(heading?.bold).toBe(true);
    });

    test("markup.link is underlined", () => {
      const link = SYNTAX_STYLE.getStyle("markup.link");
      expect(link?.underline).toBe(true);
    });

    test("variable.builtin is italic", () => {
      const varBuiltin = SYNTAX_STYLE.getStyle("variable.builtin");
      expect(varBuiltin?.italic).toBe(true);
    });
  });
});

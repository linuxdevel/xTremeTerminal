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
});

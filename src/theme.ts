// src/theme.ts — Tokyo Night inspired color palette and syntax styles

import { SyntaxStyle, RGBA } from "@opentui/core";

// ── Background Colors ──────────────────────────────────────────────

export const BG_PRIMARY = "#1a1b26";
export const BG_SECONDARY = "#16161e";
export const BG_HIGHLIGHT = "#24283b";
export const BG_SELECTION = "#283457";

// ── Foreground Colors ──────────────────────────────────────────────

export const FG_PRIMARY = "#a9b1d6";
export const FG_SECONDARY = "#565f89";
export const FG_MUTED = "#3b4261";

// ── Accent Colors ──────────────────────────────────────────────────

export const ACCENT = "#7aa2f7";
export const ERROR = "#f7768e";
export const WARNING = "#e0af68";
export const SUCCESS = "#9ece6a";
export const INFO = "#7dcfff";

// ── Syntax Highlighting Colors ─────────────────────────────────────

export const SYNTAX_KEYWORD = "#bb9af7";
export const SYNTAX_STRING = "#9ece6a";
export const SYNTAX_COMMENT = "#565f89";
export const SYNTAX_NUMBER = "#ff9e64";
export const SYNTAX_FUNCTION = "#7aa2f7";
export const SYNTAX_TYPE = "#2ac3de";
export const SYNTAX_VARIABLE = "#c0caf5";
export const SYNTAX_PROPERTY = "#7dcfff";
export const SYNTAX_OPERATOR = "#89ddff";
export const SYNTAX_TAG = "#f7768e";
export const SYNTAX_ATTRIBUTE = "#bb9af7";

// ── UI Constants ───────────────────────────────────────────────────

export const SIDEBAR_WIDTH = 25;
export const TAB_BAR_HEIGHT = 1;
export const STATUS_BAR_HEIGHT = 1;
export const DEFAULT_TAB_SIZE = 4;
export const LINE_NUMBER_MIN_WIDTH = 4;
export const LINE_NUMBER_PADDING_RIGHT = 1;

// ── Search Highlight Colors ────────────────────────────────────────

export const SEARCH_MATCH_BG = "#e0af68";
export const SEARCH_ACTIVE_MATCH_BG = "#ff9e64";

// ── Scrollbar Colors ───────────────────────────────────────────────

export const SCROLLBAR_TRACK = BG_SECONDARY;
export const SCROLLBAR_THUMB = FG_MUTED;

// ── Helper: Validate hex color ─────────────────────────────────────

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(color: string): boolean {
  return HEX_COLOR_REGEX.test(color);
}

// ── All theme colors as an array for validation ────────────────────

export const ALL_COLORS = [
  BG_PRIMARY, BG_SECONDARY, BG_HIGHLIGHT, BG_SELECTION,
  FG_PRIMARY, FG_SECONDARY, FG_MUTED,
  ACCENT, ERROR, WARNING, SUCCESS, INFO,
  SYNTAX_KEYWORD, SYNTAX_STRING, SYNTAX_COMMENT, SYNTAX_NUMBER,
  SYNTAX_FUNCTION, SYNTAX_TYPE, SYNTAX_VARIABLE, SYNTAX_PROPERTY,
  SYNTAX_OPERATOR, SYNTAX_TAG, SYNTAX_ATTRIBUTE,
  SEARCH_MATCH_BG, SEARCH_ACTIVE_MATCH_BG,
] as const;

// ── Syntax Style Factory ───────────────────────────────────────────

export function createSyntaxStyle(): SyntaxStyle {
  return SyntaxStyle.fromStyles({
    "keyword": { fg: RGBA.fromHex(SYNTAX_KEYWORD), bold: true },
    "keyword.control": { fg: RGBA.fromHex(SYNTAX_KEYWORD), bold: true },
    "keyword.operator": { fg: RGBA.fromHex(SYNTAX_OPERATOR) },
    "string": { fg: RGBA.fromHex(SYNTAX_STRING) },
    "string.special": { fg: RGBA.fromHex(SYNTAX_STRING) },
    "comment": { fg: RGBA.fromHex(SYNTAX_COMMENT), italic: true },
    "comment.line": { fg: RGBA.fromHex(SYNTAX_COMMENT), italic: true },
    "comment.block": { fg: RGBA.fromHex(SYNTAX_COMMENT), italic: true },
    "number": { fg: RGBA.fromHex(SYNTAX_NUMBER) },
    "constant": { fg: RGBA.fromHex(SYNTAX_NUMBER) },
    "constant.builtin": { fg: RGBA.fromHex(SYNTAX_NUMBER) },
    "function": { fg: RGBA.fromHex(SYNTAX_FUNCTION) },
    "function.method": { fg: RGBA.fromHex(SYNTAX_FUNCTION) },
    "function.builtin": { fg: RGBA.fromHex(SYNTAX_FUNCTION) },
    "type": { fg: RGBA.fromHex(SYNTAX_TYPE) },
    "type.builtin": { fg: RGBA.fromHex(SYNTAX_TYPE) },
    "variable": { fg: RGBA.fromHex(SYNTAX_VARIABLE) },
    "variable.builtin": { fg: RGBA.fromHex(SYNTAX_VARIABLE), italic: true },
    "variable.parameter": { fg: RGBA.fromHex(SYNTAX_VARIABLE) },
    "property": { fg: RGBA.fromHex(SYNTAX_PROPERTY) },
    "operator": { fg: RGBA.fromHex(SYNTAX_OPERATOR) },
    "punctuation": { fg: RGBA.fromHex(FG_PRIMARY) },
    "punctuation.bracket": { fg: RGBA.fromHex(FG_PRIMARY) },
    "punctuation.delimiter": { fg: RGBA.fromHex(FG_PRIMARY) },
    "tag": { fg: RGBA.fromHex(SYNTAX_TAG) },
    "attribute": { fg: RGBA.fromHex(SYNTAX_ATTRIBUTE) },
  });
}

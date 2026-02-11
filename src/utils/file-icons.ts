// src/utils/file-icons.ts — File extension to icon mapping

import * as path from "node:path";

// ── Directory Icons ────────────────────────────────────────────────

export const ICON_DIR_COLLAPSED = "▶";
export const ICON_DIR_EXPANDED = "▼";

// ── File Icons ─────────────────────────────────────────────────────

export const ICON_FILE_DEFAULT = "·";

// Extension-based icons (simple text, max terminal compatibility)
const EXTENSION_ICONS: Record<string, string> = {
  // TypeScript / JavaScript
  ".ts": "TS",
  ".tsx": "TX",
  ".js": "JS",
  ".jsx": "JX",
  ".mjs": "JS",
  ".cjs": "JS",

  // Web
  ".html": "◇",
  ".htm": "◇",
  ".css": "#",
  ".scss": "#",
  ".sass": "#",
  ".less": "#",
  ".svg": "◈",

  // Data / Config
  ".json": "{}",
  ".yaml": "≡",
  ".yml": "≡",
  ".toml": "≡",
  ".xml": "◇",
  ".csv": "▤",

  // Documentation
  ".md": "¶",
  ".mdx": "¶",
  ".txt": "≡",
  ".rst": "¶",

  // Programming languages
  ".py": "PY",
  ".rb": "RB",
  ".go": "GO",
  ".rs": "RS",
  ".c": " C",
  ".h": " H",
  ".cpp": "C+",
  ".hpp": "H+",
  ".java": "JV",
  ".kt": "KT",
  ".swift": "SW",
  ".zig": "ZG",
  ".lua": "LU",
  ".php": "HP",
  ".sh": "SH",
  ".bash": "SH",
  ".zsh": "SH",
  ".fish": "SH",

  // Images
  ".png": "▣",
  ".jpg": "▣",
  ".jpeg": "▣",
  ".gif": "▣",
  ".bmp": "▣",
  ".ico": "▣",
  ".webp": "▣",

  // Archives
  ".zip": "⊞",
  ".tar": "⊞",
  ".gz": "⊞",
  ".7z": "⊞",
  ".rar": "⊞",

  // Binary / Compiled
  ".exe": "⊡",
  ".dll": "⊡",
  ".so": "⊡",
  ".dylib": "⊡",
  ".wasm": "WA",

  // Other
  ".lock": "⊟",
  ".env": "⊙",
  ".gitignore": "⊘",
  ".dockerignore": "⊘",
  ".editorconfig": "⊙",
};

// Filename-based icons (for special files without extensions)
const FILENAME_ICONS: Record<string, string> = {
  "Dockerfile": "🐳",
  "Makefile": "⊞",
  "LICENSE": "©",
  "README": "¶",
  "README.md": "¶",
  "package.json": "{}",
  "tsconfig.json": "{}",
  ".gitignore": "⊘",
  ".env": "⊙",
  ".env.local": "⊙",
  ".env.example": "⊙",
};

// ── Public API ─────────────────────────────────────────────────────

/**
 * Get the icon for a file based on its name and extension.
 */
export function getFileIcon(fileName: string, isDirectory: boolean, isExpanded = false): string {
  if (isDirectory) {
    return isExpanded ? ICON_DIR_EXPANDED : ICON_DIR_COLLAPSED;
  }

  // Check filename first (higher priority)
  const filenameIcon = FILENAME_ICONS[fileName];
  if (filenameIcon) return filenameIcon;

  // Check extension
  const ext = path.extname(fileName).toLowerCase();
  const extIcon = EXTENSION_ICONS[ext];
  if (extIcon) return extIcon;

  return ICON_FILE_DEFAULT;
}

/**
 * Get the display width of an icon (for alignment).
 * Most icons are 1-2 characters wide.
 */
export function getIconWidth(icon: string): number {
  // Simple heuristic: count characters
  // Most of our icons are 1-2 chars
  return icon.length;
}

/**
 * Get all known extensions.
 */
export function getKnownExtensions(): string[] {
  return Object.keys(EXTENSION_ICONS);
}

/**
 * Get all known special filenames.
 */
export function getKnownFilenames(): string[] {
  return Object.keys(FILENAME_ICONS);
}

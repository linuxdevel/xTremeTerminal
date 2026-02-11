// src/utils/language-detect.ts — Map file extensions to Tree-sitter language identifiers

import * as path from "node:path";

// ── Language Map ────────────────────────────────────────────────────

const LANGUAGE_MAP: Record<string, string> = {
  // JavaScript / TypeScript
  ".ts": "typescript",
  ".tsx": "tsx",
  ".js": "javascript",
  ".jsx": "jsx",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".mts": "typescript",
  ".cts": "typescript",

  // Web
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".scss": "css",
  ".less": "css",

  // Data / Config
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",
  ".xml": "html",

  // Markdown
  ".md": "markdown",
  ".mdx": "markdown",

  // Systems
  ".rs": "rust",
  ".go": "go",
  ".c": "c",
  ".h": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".hpp": "cpp",
  ".hh": "cpp",
  ".zig": "zig",

  // Scripting
  ".py": "python",
  ".rb": "ruby",
  ".lua": "lua",
  ".sh": "bash",
  ".bash": "bash",
  ".zsh": "bash",
  ".fish": "bash",

  // JVM
  ".java": "java",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".scala": "scala",

  // Other
  ".swift": "swift",
  ".php": "php",
  ".ex": "elixir",
  ".exs": "elixir",
  ".erl": "erlang",
  ".hs": "haskell",
  ".sql": "sql",
  ".r": "r",
  ".R": "r",
  ".dart": "dart",
  ".vim": "viml",
  ".el": "elisp",
  ".clj": "clojure",
  ".cs": "c_sharp",
  ".fs": "ocaml",
  ".ml": "ocaml",
  ".nix": "nix",
  ".tf": "hcl",
  ".proto": "protobuf",
  ".graphql": "graphql",
  ".gql": "graphql",
  ".dockerfile": "dockerfile",
};

// ── Filename-based detection ────────────────────────────────────────

const FILENAME_MAP: Record<string, string> = {
  "Dockerfile": "dockerfile",
  "Makefile": "make",
  "CMakeLists.txt": "cmake",
  "Jenkinsfile": "groovy",
  ".gitignore": "gitignore",
  ".env": "bash",
  ".bashrc": "bash",
  ".bash_profile": "bash",
  ".zshrc": "bash",
  ".profile": "bash",
};

// ── Public API ──────────────────────────────────────────────────────

/**
 * Detect the Tree-sitter language for a file based on its extension or name.
 * Returns null if the language cannot be determined.
 */
export function detectLanguage(filePath: string): string | null {
  const basename = path.basename(filePath);

  // Check filename-based matches first (exact match)
  if (FILENAME_MAP[basename]) {
    return FILENAME_MAP[basename]!;
  }

  // Check extension-based matches
  const ext = path.extname(filePath).toLowerCase();
  if (ext && LANGUAGE_MAP[ext]) {
    return LANGUAGE_MAP[ext]!;
  }

  return null;
}

/**
 * Get all supported file extensions.
 */
export function getSupportedExtensions(): string[] {
  return Object.keys(LANGUAGE_MAP);
}

/**
 * Get all supported languages (unique values).
 */
export function getSupportedLanguages(): string[] {
  return [...new Set(Object.values(LANGUAGE_MAP))].sort();
}

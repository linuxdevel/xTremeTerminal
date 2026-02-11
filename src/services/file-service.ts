// src/services/file-service.ts — File system operations (no TUI dependency)

import * as fs from "node:fs";
import * as path from "node:path";

// ── Types ──────────────────────────────────────────────────────────

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isExpanded: boolean;
  depth: number;
  children?: FileEntry[];
  size?: number;
  modified?: Date;
}

export interface FileStats {
  size: number;
  modified: Date;
  isDirectory: boolean;
  isSymlink: boolean;
}

// ── Constants ──────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const WARN_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const BINARY_CHECK_BYTES = 8192;

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
  ".mp3", ".mp4", ".avi", ".mov", ".mkv", ".flac", ".wav",
  ".zip", ".tar", ".gz", ".7z", ".rar", ".bz2", ".xz",
  ".exe", ".dll", ".so", ".dylib", ".o", ".a",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".class", ".pyc", ".pyo",
]);

// Directories/files to hide from the tree
const HIDDEN_ENTRIES = new Set([
  "node_modules",
  ".git",
  ".DS_Store",
  "Thumbs.db",
  ".hg",
  ".svn",
  "dist",
  "coverage",
  ".next",
  ".nuxt",
  ".cache",
]);

// ── File Service ───────────────────────────────────────────────────

export class FileService {
  /**
   * Read a directory and return sorted entries (dirs first, then files, alphabetical).
   * Hidden entries (node_modules, .git, etc.) are excluded by default.
   */
  async readDirectory(
    dirPath: string,
    depth = 0,
    includeHidden = false,
  ): Promise<FileEntry[]> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      const fileEntries: FileEntry[] = [];

      for (const entry of entries) {
        // Skip hidden system entries
        if (!includeHidden && HIDDEN_ENTRIES.has(entry.name)) continue;
        // Skip dotfiles by default
        if (!includeHidden && entry.name.startsWith(".")) continue;

        const fullPath = path.join(dirPath, entry.name);
        const isDir = entry.isDirectory();

        fileEntries.push({
          name: entry.name,
          path: fullPath,
          isDirectory: isDir,
          isExpanded: false,
          depth,
          children: isDir ? undefined : undefined,
        });
      }

      // Sort: directories first, then alphabetical (case-insensitive)
      fileEntries.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });

      return fileEntries;
    } catch (error) {
      // Return empty for permission errors or missing dirs
      return [];
    }
  }

  /**
   * Read file content as text. Returns null if file is binary or too large.
   */
  async readFileContent(filePath: string): Promise<string | null> {
    try {
      const stats = await fs.promises.stat(filePath);

      if (stats.size > MAX_FILE_SIZE) {
        return null; // Too large
      }

      const content = await fs.promises.readFile(filePath, "utf-8");
      return content;
    } catch {
      return null;
    }
  }

  /**
   * Write content to a file.
   */
  async writeFileContent(filePath: string, content: string): Promise<void> {
    await fs.promises.writeFile(filePath, content, "utf-8");
  }

  /**
   * Get file stats.
   */
  async getFileStats(filePath: string): Promise<FileStats | null> {
    try {
      const stats = await fs.promises.lstat(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isSymlink: stats.isSymbolicLink(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Determine if a file is a text file (not binary).
   */
  async isTextFile(filePath: string): Promise<boolean> {
    const ext = path.extname(filePath).toLowerCase();

    // Check known binary extensions first
    if (BINARY_EXTENSIONS.has(ext)) {
      return false;
    }

    try {
      // Read first N bytes and check for null bytes
      const fd = await fs.promises.open(filePath, "r");
      try {
        const buffer = Buffer.alloc(BINARY_CHECK_BYTES);
        const { bytesRead } = await fd.read(buffer, 0, BINARY_CHECK_BYTES, 0);

        for (let i = 0; i < bytesRead; i++) {
          if (buffer[i] === 0) {
            return false; // Null byte found => binary
          }
        }
        return true;
      } finally {
        await fd.close();
      }
    } catch {
      return false;
    }
  }

  /**
   * Check if a file is too large to open.
   */
  async checkFileSize(filePath: string): Promise<"ok" | "warn" | "too-large"> {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size > MAX_FILE_SIZE) return "too-large";
      if (stats.size > WARN_FILE_SIZE) return "warn";
      return "ok";
    } catch {
      return "too-large";
    }
  }

  /**
   * Build the initial tree for a root directory (one level deep).
   */
  async buildTree(rootPath: string): Promise<FileEntry[]> {
    return this.readDirectory(rootPath, 0);
  }

  /**
   * Expand a directory entry by loading its children.
   */
  async expandDirectory(entry: FileEntry): Promise<FileEntry[]> {
    if (!entry.isDirectory) return [];

    const children = await this.readDirectory(entry.path, entry.depth + 1);
    entry.children = children;
    entry.isExpanded = true;
    return children;
  }

  /**
   * Collapse a directory entry.
   */
  collapseDirectory(entry: FileEntry): void {
    entry.isExpanded = false;
    // Keep children in memory for fast re-expand
  }

  /**
   * Flatten the tree into a list of visible entries (for rendering).
   * Only includes children of expanded directories.
   */
  flattenTree(entries: FileEntry[]): FileEntry[] {
    const result: FileEntry[] = [];

    const walk = (items: FileEntry[]): void => {
      for (const item of items) {
        result.push(item);
        if (item.isDirectory && item.isExpanded && item.children) {
          walk(item.children);
        }
      }
    };

    walk(entries);
    return result;
  }

  /**
   * Check if a path exists.
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a new file with empty content.
   */
  async createFile(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, "", "utf-8");
  }

  /**
   * Create a new directory.
   */
  async createDirectory(dirPath: string): Promise<void> {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }

  /**
   * Delete a file or directory.
   */
  async delete(filePath: string): Promise<void> {
    await fs.promises.rm(filePath, { recursive: true, force: true });
  }

  /**
   * Rename/move a file or directory.
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    await fs.promises.rename(oldPath, newPath);
  }
}

// ── Singleton Instance ─────────────────────────────────────────────

export const fileService = new FileService();

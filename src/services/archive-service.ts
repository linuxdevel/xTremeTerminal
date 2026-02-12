// src/services/archive-service.ts — Archive I/O operations (no TUI dependency)

import * as path from "node:path";

// ── Types ──────────────────────────────────────────────────────────

export interface ArchiveEntry {
  path: string;
  type: "file" | "directory";
  size: number;
  modified?: Date;
}

// ── Archive Service ───────────────────────────────────────────────

export class ArchiveService {
  /**
   * List all entries in an archive.
   */
  async listEntries(archivePath: string): Promise<ArchiveEntry[]> {
    try {
      const data = await Bun.file(archivePath).arrayBuffer();
      const archive = new Bun.Archive(data);
      const files = await archive.files();
      
      const entries: ArchiveEntry[] = [];
      for (const [name, file] of files) {
        // Directories often end with / in tarballs
        const isDir = name.endsWith("/");
        entries.push({
          path: name,
          type: isDir ? "directory" : "file",
          size: file.size,
        });
      }
      
      // Sort: directories first, then alphabetical (case-insensitive)
      entries.sort((a, b) => {
        const aIsDir = a.type === "directory";
        const bIsDir = b.type === "directory";
        
        if (aIsDir !== bIsDir) {
          return aIsDir ? -1 : 1;
        }
        
        return a.path.toLowerCase().localeCompare(b.path.toLowerCase());
      });

      return entries;
    } catch (error) {
      console.error(`Failed to list entries in ${archivePath}:`, error);
      return [];
    }
  }

  /**
   * Read a single file's content from the archive as text.
   */
  async readFile(archivePath: string, entryPath: string): Promise<string | null> {
    try {
      const data = await Bun.file(archivePath).arrayBuffer();
      const archive = new Bun.Archive(data);
      const files = await archive.files();
      
      const file = files.get(entryPath);
      if (!file) return null;
      if (file.size === 0) return ""; 
      
      return await file.text();
    } catch (error) {
      console.error(`Failed to read ${entryPath} from ${archivePath}:`, error);
      return null;
    }
  }

  /**
   * Extract from archive.
   * If entryPath is null, extracts the entire archive.
   */
  async extract(archivePath: string, entryPath: string | null, targetDir: string): Promise<boolean> {
    try {
      const data = await Bun.file(archivePath).arrayBuffer();
      const archive = new Bun.Archive(data);
      
      if (entryPath) {
        // If it's a directory, extract with glob to get all children
        const glob = entryPath.endsWith("/") ? `${entryPath}**` : entryPath;
        await archive.extract(targetDir, { glob });
      } else {
        await archive.extract(targetDir);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to extract ${entryPath || "all"} from ${archivePath} to ${targetDir}:`, error);
      return false;
    }
  }

  /**
   * Check if a file path is a supported archive format.
   * Currently supports: .tar, .tar.gz, .tgz
   */
  isArchive(filePath: string): boolean {
    const lower = filePath.toLowerCase();
    return (
      lower.endsWith(".tar.gz") || 
      lower.endsWith(".tgz") || 
      lower.endsWith(".tar")
    );
  }
}

// ── Singleton Instance ─────────────────────────────────────────────

export const archiveService = new ArchiveService();

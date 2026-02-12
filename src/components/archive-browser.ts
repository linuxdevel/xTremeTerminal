// src/components/archive-browser.ts — Archive tree browser component
import type { CliRenderer, KeyEvent } from "@opentui/core";
import { BoxRenderable, TextRenderable } from "@opentui/core";
import * as path from "node:path";
import { archiveService } from "../services/archive-service.ts";
import type { ArchiveEntry } from "../services/archive-service.ts";
import { getFileIcon } from "../utils/file-icons.ts";
import {
  BG_SECONDARY,
  BG_HIGHLIGHT,
  FG_PRIMARY,
  ACCENT,
} from "../theme.ts";

const INDENT_SIZE = 2;

export class ArchiveBrowser {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private itemRenderables: TextRenderable[] = [];

  private archivePath: string = "";
  private _entries: ArchiveEntry[] = [];
  private _selectedIndex = 0;

  onFileSelect: ((entryPath: string) => void) | null = null;
  onExtract: ((entry: ArchiveEntry) => void) | null = null;
  onExtractAll: (() => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    const uniqueId = `archive-browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.container = new BoxRenderable(renderer, {
      id: uniqueId,
      width: "100%",
      flexGrow: 1,
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
    });
  }

  get renderable(): BoxRenderable { return this.container; }
  get entries(): ArchiveEntry[] { return this._entries; }

  setArchive(archivePath: string): void {
    this.archivePath = archivePath;
  }

  async load(): Promise<void> {
    this._entries = await archiveService.listEntries(this.archivePath);
    this._selectedIndex = 0;
    // Don't render yet - wait until container is added to layout
  }

  handleKeyPress(event: KeyEvent): boolean {
    switch (event.name) {
      case "up":
        if (this._selectedIndex > 0) {
          this._selectedIndex--;
          this.renderItems();
          // this.scrollBox.scrollTo(this._selectedIndex);
        }
        return true;
      case "down":
        if (this._selectedIndex < this._entries.length - 1) {
          this._selectedIndex++;
          this.renderItems();
          // this.scrollBox.scrollTo(this._selectedIndex);
        }
        return true;
      case "left":
      case "right":
        // Collapse/Expand not implemented yet (archive listing is flat from Bun.Archive for now)
        return true;
      case "return":
        const selected = this._entries[this._selectedIndex];
        if (selected && selected.type === "file") {
          this.onFileSelect?.(selected.path);
        }
        return true;
      case "e":
        if (!event.ctrl && !event.meta && !event.shift) {
          const entry = this._entries[this._selectedIndex];
          if (entry) this.onExtract?.(entry);
          return true;
        }
        if (event.ctrl) {
          this.onExtractAll?.();
          return true;
        }
        return false;
      default:
        return false;
    }
  }

  destroy(): void {
    this.clearItems();
    this.container.destroyRecursively();
  }

  private clearItems(): void {
    for (const item of this.itemRenderables) {
      item.destroy();
    }
    this.itemRenderables = [];
  }

  /** Render archive entry items into the container. Call after container is in layout. */
  renderItems(): void {
    this.clearItems();
    for (let i = 0; i < this._entries.length; i++) {
      const entry = this._entries[i]!;
      const row = this.createItemRow(entry, i);
      this.itemRenderables.push(row);
      this.container.add(row);
    }
  }

  private createItemRow(entry: ArchiveEntry, index: number): TextRenderable {
    const isSelected = index === this._selectedIndex;
    const isDir = entry.type === "directory";
    const depth = (entry.path.match(/\//g) || []).length - (entry.path.endsWith("/") ? 1 : 0);
    const indent = " ".repeat(depth * INDENT_SIZE);
    const basename = entry.path.endsWith("/") 
      ? path.basename(entry.path.slice(0, -1)) + "/"
      : path.basename(entry.path);
    const icon = getFileIcon(basename, isDir, true);
    const bg = isSelected ? BG_HIGHLIGHT : BG_SECONDARY;
    const fg = isDir ? ACCENT : FG_PRIMARY;

    const text = new TextRenderable(this.renderer, {
      id: `archive-item-${index}`,
      content: `${indent}${icon} ${basename}`,
      fg,
      bg,
      width: "100%",
      height: 1,
      truncate: true,
    });

    return text;
  }
}

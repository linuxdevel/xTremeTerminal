// src/components/file-tree.ts — File/directory tree browser component

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { BoxRenderable, TextRenderable, ScrollBoxRenderable } from "@opentui/core";

import type { FileEntry } from "../services/file-service.ts";
import { fileService } from "../services/file-service.ts";
import { getFileIcon } from "../utils/file-icons.ts";
import {
  BG_SECONDARY,
  BG_HIGHLIGHT,
  FG_PRIMARY,
  FG_MUTED,
  ACCENT,
} from "../theme.ts";

// ── Constants ──────────────────────────────────────────────────────

const INDENT_SIZE = 2;
const ICON_WIDTH = 3; // icon + space

// ── File Tree Component ────────────────────────────────────────────

export class FileTree {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private scrollBox: ScrollBoxRenderable;
  private titleBar: TextRenderable;
  private itemRenderables: BoxRenderable[] = [];

  private rootPath: string;
  private rootEntries: FileEntry[] = [];
  private flatItems: FileEntry[] = [];
  private _selectedIndex = 0;

  // ── Event Callbacks ──────────────────────────────────────────────

  onFileSelect: ((filePath: string) => void) | null = null;
  onDirectoryToggle: ((entry: FileEntry) => void) | null = null;

  constructor(renderer: CliRenderer, rootPath: string) {
    this.renderer = renderer;
    this.rootPath = rootPath;

    // Container for the whole file tree
    this.container = new BoxRenderable(renderer, {
      id: "file-tree-container",
      width: "100%",
      flexGrow: 1,
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
    });

    // Title bar
    this.titleBar = new TextRenderable(renderer, {
      id: "file-tree-title",
      content: " EXPLORER",
      fg: FG_MUTED,
      width: "100%",
      height: 1,
    });

    // Scroll box for tree items
    this.scrollBox = new ScrollBoxRenderable(renderer, {
      id: "file-tree-scroll",
      width: "100%",
      flexGrow: 1,
      backgroundColor: BG_SECONDARY,
      scrollY: true,
      scrollX: false,
    });

    this.container.add(this.titleBar);
    this.container.add(this.scrollBox);
  }

  // ── Public API ───────────────────────────────────────────────────

  /** Get the container renderable to add to the layout */
  get renderable(): BoxRenderable {
    return this.container;
  }

  get selectedIndex(): number {
    return this._selectedIndex;
  }

  get selectedEntry(): FileEntry | undefined {
    return this.flatItems[this._selectedIndex];
  }

  get itemCount(): number {
    return this.flatItems.length;
  }

  /** Load the initial directory tree */
  async load(rootPath?: string): Promise<void> {
    if (rootPath) {
      this.rootPath = rootPath;
    }
    this.rootEntries = await fileService.buildTree(this.rootPath);
    this.refreshFlatList();
    this.render();
  }

  /** Handle a keyboard event. Returns true if consumed. */
  handleKeyPress(event: KeyEvent): boolean {
    switch (event.name) {
      case "up":
        this.moveUp();
        return true;
      case "down":
        this.moveDown();
        return true;
      case "return":
      case "right":
        this.expandOrEnter();
        return true;
      case "left":
        this.collapseOrParent();
        return true;
      case "home":
        this.moveToFirst();
        return true;
      case "end":
        this.moveToLast();
        return true;
      case "pageup":
        this.pageUp();
        return true;
      case "pagedown":
        this.pageDown();
        return true;
      default:
        return false;
    }
  }

  // ── Navigation ───────────────────────────────────────────────────

  moveUp(): void {
    if (this._selectedIndex > 0) {
      this._selectedIndex--;
      this.updateSelection();
    }
  }

  moveDown(): void {
    if (this._selectedIndex < this.flatItems.length - 1) {
      this._selectedIndex++;
      this.updateSelection();
    }
  }

  moveToFirst(): void {
    this._selectedIndex = 0;
    this.updateSelection();
  }

  moveToLast(): void {
    this._selectedIndex = Math.max(0, this.flatItems.length - 1);
    this.updateSelection();
  }

  pageUp(): void {
    const pageSize = this.getVisibleItemCount();
    this._selectedIndex = Math.max(0, this._selectedIndex - pageSize);
    this.updateSelection();
  }

  pageDown(): void {
    const pageSize = this.getVisibleItemCount();
    this._selectedIndex = Math.min(
      this.flatItems.length - 1,
      this._selectedIndex + pageSize,
    );
    this.updateSelection();
  }

  async expandOrEnter(): Promise<void> {
    const entry = this.flatItems[this._selectedIndex];
    if (!entry) return;

    if (entry.isDirectory) {
      if (entry.isExpanded) {
        // Already expanded, collapse instead if Enter was pressed
        fileService.collapseDirectory(entry);
      } else {
        await fileService.expandDirectory(entry);
      }
      this.onDirectoryToggle?.(entry);
      this.refreshFlatList();
      this.render();
    } else {
      // Open the file
      this.onFileSelect?.(entry.path);
    }
  }

  collapseOrParent(): void {
    const entry = this.flatItems[this._selectedIndex];
    if (!entry) return;

    if (entry.isDirectory && entry.isExpanded) {
      // Collapse this directory
      fileService.collapseDirectory(entry);
      this.onDirectoryToggle?.(entry);
      this.refreshFlatList();
      this.render();
    } else {
      // Move to parent directory
      this.moveToParent(entry);
    }
  }

  // ── Internal ─────────────────────────────────────────────────────

  private moveToParent(entry: FileEntry): void {
    if (entry.depth === 0) return;

    // Walk backwards to find the parent directory
    for (let i = this._selectedIndex - 1; i >= 0; i--) {
      const candidate = this.flatItems[i];
      if (candidate && candidate.isDirectory && candidate.depth === entry.depth - 1) {
        this._selectedIndex = i;
        this.updateSelection();
        return;
      }
    }
  }

  private refreshFlatList(): void {
    this.flatItems = fileService.flattenTree(this.rootEntries);
    // Clamp selected index
    if (this._selectedIndex >= this.flatItems.length) {
      this._selectedIndex = Math.max(0, this.flatItems.length - 1);
    }
  }

  private getVisibleItemCount(): number {
    // Approximate based on scroll box height
    return Math.max(1, this.scrollBox.height - 1);
  }

  /** Rebuild all item renderables from the flat list */
  private render(): void {
    // Clear existing items
    for (const item of this.itemRenderables) {
      item.destroyRecursively();
    }
    this.itemRenderables = [];

    // Create a renderable for each visible item
    for (let i = 0; i < this.flatItems.length; i++) {
      const entry = this.flatItems[i]!;
      const row = this.createItemRow(entry, i);
      this.itemRenderables.push(row);
      this.scrollBox.add(row);
    }
  }

  /** Create a renderable row for a single tree item */
  private createItemRow(entry: FileEntry, index: number): BoxRenderable {
    const isSelected = index === this._selectedIndex;
    const indent = " ".repeat(entry.depth * INDENT_SIZE);
    const icon = getFileIcon(entry.name, entry.isDirectory, entry.isExpanded);

    // Build display string
    const displayText = `${indent}${icon} ${entry.name}`;

    // Choose colors
    const bg = isSelected ? BG_HIGHLIGHT : BG_SECONDARY;
    const fg = entry.isDirectory ? ACCENT : FG_PRIMARY;

    const row = new BoxRenderable(this.renderer, {
      id: `tree-item-${index}`,
      width: "100%",
      height: 1,
      flexDirection: "row",
      backgroundColor: bg,
    });

    const text = new TextRenderable(this.renderer, {
      id: `tree-text-${index}`,
      content: displayText,
      fg,
      width: "100%",
      height: 1,
      truncate: true,
    });

    row.add(text);
    return row;
  }

  /** Update visual selection (highlight current, unhighlight previous) */
  private updateSelection(): void {
    // Re-render is the simplest approach for now
    this.render();
    this.scrollToSelected();
  }

  /** Scroll so the selected item is visible */
  private scrollToSelected(): void {
    // ScrollBox handles this: scroll to the selected item's position
    if (this._selectedIndex >= 0 && this._selectedIndex < this.itemRenderables.length) {
      this.scrollBox.scrollTo(this._selectedIndex);
    }
  }

  /** Clean up */
  destroy(): void {
    for (const item of this.itemRenderables) {
      item.destroyRecursively();
    }
    this.itemRenderables = [];
    this.container.destroyRecursively();
  }
}

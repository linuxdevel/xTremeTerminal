// src/components/file-tree.ts — File/directory tree browser component

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { BoxRenderable, TextRenderable, ScrollBoxRenderable, InputRenderable } from "@opentui/core";

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
  onCreateFile: ((parentDir: string) => void) | null = null;
  onCreateDirectory: ((parentDir: string) => void) | null = null;
  onRename: ((entry: FileEntry) => void) | null = null;
  onDelete: ((entry: FileEntry) => void) | null = null;

  // Inline input state
  private _inlineInput: InputRenderable | null = null;
  private _inlineInputRow: BoxRenderable | null = null;
  private _inlineMode: "new-file" | "new-dir" | "rename" | null = null;

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
    // If inline input is active, delegate to it
    if (this._inlineInput) {
      return this.handleInlineInputKey(event);
    }

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
      case "a":
        if (!event.ctrl && !event.meta && !event.shift) {
          this.startNewFile();
          return true;
        }
        if (event.shift && !event.ctrl && !event.meta) {
          this.startNewDirectory();
          return true;
        }
        return false;
      case "A":
        if (!event.ctrl && !event.meta) {
          this.startNewDirectory();
          return true;
        }
        return false;
      case "f2":
        this.startRename();
        return true;
      case "delete":
      case "backspace":
        this.requestDelete();
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

  /** Rebuild renderables including the inline input row at the right position */
  private renderWithInlineInput(): void {
    // Clear existing items from scrollBox
    for (const item of this.itemRenderables) {
      item.destroyRecursively();
    }
    this.itemRenderables = [];

    const insertIndex = this._inlineMode === "rename" ? this._selectedIndex : this._selectedIndex + 1;

    for (let i = 0; i < this.flatItems.length; i++) {
      // For rename mode, skip the original item at the selected index
      if (this._inlineMode === "rename" && i === this._selectedIndex) {
        // Add inline input row in place of the renamed item
        if (this._inlineInputRow) {
          this.scrollBox.add(this._inlineInputRow);
        }
        continue;
      }

      const entry = this.flatItems[i]!;
      const row = this.createItemRow(entry, i);
      this.itemRenderables.push(row);
      this.scrollBox.add(row);

      // For new file/dir, insert inline input after the selected item
      if (this._inlineMode !== "rename" && i === this._selectedIndex && this._inlineInputRow) {
        this.scrollBox.add(this._inlineInputRow);
      }
    }

    // If insertion point is at the end
    if (this._inlineMode !== "rename" && insertIndex >= this.flatItems.length && this._inlineInputRow) {
      this.scrollBox.add(this._inlineInputRow);
    }
  }

  /** Scroll so the selected item is visible */
  private scrollToSelected(): void {
    // ScrollBox handles this: scroll to the selected item's position
    if (this._selectedIndex >= 0 && this._selectedIndex < this.itemRenderables.length) {
      this.scrollBox.scrollTo(this._selectedIndex);
    }
  }

  // ── File Operations ──────────────────────────────────────────────

  /** Get the directory path for the selected entry (entry itself if dir, parent if file) */
  private getSelectedDir(): string {
    const entry = this.flatItems[this._selectedIndex];
    if (!entry) return this.rootPath;
    if (entry.isDirectory) return entry.path;
    // Return the parent directory of the file
    const parts = entry.path.split("/");
    parts.pop();
    return parts.join("/") || this.rootPath;
  }

  /** Start inline input for creating a new file */
  private startNewFile(): void {
    const parentDir = this.getSelectedDir();
    this._inlineMode = "new-file";
    this.showInlineInput("", parentDir);
  }

  /** Start inline input for creating a new directory */
  private startNewDirectory(): void {
    const parentDir = this.getSelectedDir();
    this._inlineMode = "new-dir";
    this.showInlineInput("", parentDir);
  }

  /** Start inline input for renaming */
  private startRename(): void {
    const entry = this.flatItems[this._selectedIndex];
    if (!entry) return;
    this._inlineMode = "rename";
    this.showInlineInput(entry.name, "");
  }

  /** Request deletion of the selected entry */
  private requestDelete(): void {
    const entry = this.flatItems[this._selectedIndex];
    if (!entry) return;
    this.onDelete?.(entry);
  }

  /** Show an inline input at the current position */
  private showInlineInput(initialValue: string, _context: string): void {
    this.removeInlineInput();

    const entry = this.flatItems[this._selectedIndex];
    const depth = entry ? (entry.isDirectory ? entry.depth + 1 : entry.depth) : 0;
    if (this._inlineMode === "rename" && entry) {
      // Rename: same depth as the entry
    }
    const adjustedDepth = this._inlineMode === "rename" && entry ? entry.depth : depth;
    const indent = " ".repeat(adjustedDepth * INDENT_SIZE);
    const prefix = this._inlineMode === "new-dir" ? "+" : this._inlineMode === "rename" ? ">" : "+";

    this._inlineInputRow = new BoxRenderable(this.renderer, {
      id: "tree-inline-row",
      width: "100%",
      height: 1,
      flexDirection: "row",
      backgroundColor: BG_HIGHLIGHT,
    });

    const prefixText = new TextRenderable(this.renderer, {
      id: "tree-inline-prefix",
      content: `${indent}${prefix} `,
      fg: ACCENT,
      width: indent.length + 2,
      height: 1,
    });

    this._inlineInput = new InputRenderable(this.renderer, {
      id: "tree-inline-input",
      flexGrow: 1,
      backgroundColor: BG_HIGHLIGHT,
      focusedBackgroundColor: BG_HIGHLIGHT,
      textColor: FG_PRIMARY,
      focusedTextColor: FG_PRIMARY,
      cursorColor: ACCENT,
      value: initialValue,
    });

    this._inlineInputRow.add(prefixText);
    this._inlineInputRow.add(this._inlineInput);

    // Insert after current selection — re-render with inline input
    this.renderWithInlineInput();

    this._inlineInput.focus();
  }

  /** Remove the inline input */
  private removeInlineInput(): void {
    if (this._inlineInputRow) {
      this._inlineInputRow.destroyRecursively();
      this._inlineInputRow = null;
      this._inlineInput = null;
      this._inlineMode = null;
    }
  }

  /** Handle keyboard events while inline input is active */
  private handleInlineInputKey(event: KeyEvent): boolean {
    if (!this._inlineInput) return false;

    // Escape — cancel inline input
    if (event.name === "escape") {
      this.removeInlineInput();
      return true;
    }

    // Enter — submit
    if (event.name === "return") {
      const value = this._inlineInput.value.toString().trim();
      if (value.length > 0) {
        this.submitInlineInput(value);
      } else {
        this.removeInlineInput();
      }
      return true;
    }

    // Delegate to the input
    return this._inlineInput.handleKeyPress(event);
  }

  /** Submit the inline input value */
  private submitInlineInput(name: string): void {
    const mode = this._inlineMode;
    const entry = this.flatItems[this._selectedIndex];
    this.removeInlineInput();

    if (mode === "new-file") {
      const parentDir = entry
        ? (entry.isDirectory ? entry.path : this.getSelectedDir())
        : this.rootPath;
      this.onCreateFile?.(parentDir + "/" + name);
    } else if (mode === "new-dir") {
      const parentDir = entry
        ? (entry.isDirectory ? entry.path : this.getSelectedDir())
        : this.rootPath;
      this.onCreateDirectory?.(parentDir + "/" + name);
    } else if (mode === "rename" && entry) {
      this.onRename?.(entry);
      // Store the new name for the app to use
      this._pendingRenameName = name;
    }
  }

  // Temporary storage for rename operations
  private _pendingRenameName = "";

  /** Get the pending rename name (set after inline rename submit) */
  get pendingRenameName(): string {
    return this._pendingRenameName;
  }

  /** Clear the pending rename name */
  clearPendingRenameName(): void {
    this._pendingRenameName = "";
  }

  /** Check if inline input is active */
  get isInlineInputActive(): boolean {
    return this._inlineInput !== null;
  }

  /** Clean up */
  destroy(): void {
    this.removeInlineInput();
    for (const item of this.itemRenderables) {
      item.destroyRecursively();
    }
    this.itemRenderables = [];
    this.container.destroyRecursively();
  }
}

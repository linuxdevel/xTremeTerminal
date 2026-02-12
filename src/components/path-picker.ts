// src/components/path-picker.ts — Directory selection dialog

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { BoxRenderable, TextRenderable, ScrollBoxRenderable } from "@opentui/core";
import * as path from "node:path";
import { fileService } from "../services/file-service.ts";
import {
  BG_SECONDARY,
  FG_PRIMARY,
  FG_SECONDARY,
  ACCENT,
  BG_HIGHLIGHT,
} from "../theme.ts";

// ── Types ──────────────────────────────────────────────────────────

export interface PathPickerOptions {
  title: string;
  initialPath: string;
  onSelect: (selectedPath: string) => void;
  onCancel: () => void;
}

// ── Constants ──────────────────────────────────────────────────────

const DIALOG_WIDTH = 60;
const DIALOG_HEIGHT = 15;

// ── PathPicker Component ───────────────────────────────────────────

export class PathPicker {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private titleText: TextRenderable;
  private pathText: TextRenderable;
  private scrollBox: BoxRenderable;
  private itemsContainer: BoxRenderable;
  private buttonsRow: BoxRenderable;
  private selectBtn: TextRenderable;
  private cancelBtn: TextRenderable;
  private itemRows: TextRenderable[] = [];

  private _isVisible = false;
  private _currentPath = "";
  private _entries: string[] = [];
  private _selectedIndex = 0;
  private _selectedButton: "list" | "select" | "cancel" = "list";

  private _onSelect: ((selectedPath: string) => void) | null = null;
  private _onCancel: (() => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    // Main container — absolute overlay, centered at top
    this.container = new BoxRenderable(renderer, {
      id: "path-picker",
      position: "absolute",
      top: 5,
      left: "50%",
      width: DIALOG_WIDTH,
      height: DIALOG_HEIGHT,
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
      border: true,
      borderStyle: "rounded",
      borderColor: ACCENT,
      zIndex: 210,
    });

    // Title
    this.titleText = new TextRenderable(renderer, {
      id: "path-picker-title",
      content: "",
      fg: ACCENT,
      width: "100%",
      height: 1,
    });

    // Current Path display
    this.pathText = new TextRenderable(renderer, {
      id: "path-picker-path",
      content: "",
      fg: FG_SECONDARY,
      width: "100%",
      height: 1,
    });

    // Directory list scrollbox
    this.scrollBox = new BoxRenderable(renderer, {
      id: "path-picker-scroll",
      width: "100%",
      flexGrow: 1,
      flexDirection: "column",
    });

    this.itemsContainer = new BoxRenderable(renderer, {
      id: "path-picker-items",
      width: "100%",
      flexGrow: 1,
      flexDirection: "column",
    });
    this.scrollBox.add(this.itemsContainer);

    // Buttons row
    this.buttonsRow = new BoxRenderable(renderer, {
      id: "path-picker-buttons",
      flexDirection: "row",
      width: "100%",
      height: 1,
      justifyContent: "center",
      marginTop: 0,
    });

    this.selectBtn = new TextRenderable(renderer, {
      id: "path-picker-select",
      content: " [Select Here] ",
      width: 15,
    });

    this.cancelBtn = new TextRenderable(renderer, {
      id: "path-picker-cancel",
      content: " [Cancel] ",
      width: 12,
    });

    this.buttonsRow.add(this.selectBtn);
    this.buttonsRow.add(new TextRenderable(renderer, { id: "p-sp", content: "  ", width: 2 }));
    this.buttonsRow.add(this.cancelBtn);

    // Assemble
    this.container.add(this.titleText);
    this.container.add(this.pathText);
    this.container.add(this.scrollBox);
    this.container.add(this.buttonsRow);

    // Initially hidden
    this.container.visible = false;
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Get the container renderable to add to the layout */
  get renderable(): BoxRenderable {
    return this.container;
  }

  /** Whether the dialog is currently visible */
  get isVisible(): boolean {
    return this._isVisible;
  }

  /** Show the path picker dialog */
  async show(options: PathPickerOptions): Promise<void> {
    this._isVisible = true;
    this._currentPath = path.resolve(options.initialPath);
    this._onSelect = options.onSelect;
    this._onCancel = options.onCancel;
    this._selectedIndex = 0;
    this._selectedButton = "list";

    this.titleText.content = ` ${options.title}`;
    await this.refreshList();
    this.container.visible = true;
  }

  /** Hide the dialog */
  hide(): void {
    this._isVisible = false;
    this.container.visible = false;
    this._onSelect = null;
    this._onCancel = null;
  }

  /** Handle keyboard events. Returns true if consumed. */
  handleKeyPress(event: KeyEvent): boolean {
    if (!this._isVisible) return false;

    // Escape — cancel
    if (event.name === "escape") {
      this.doCancel();
      return true;
    }

    if (this._selectedButton === "list") {
      if (event.name === "up") {
        if (this._selectedIndex > 0) {
          this._selectedIndex--;
          this.renderItems();
        }
        return true;
      }
      
      if (event.name === "down") {
        if (this._selectedIndex < this._entries.length - 1) {
          this._selectedIndex++;
          this.renderItems();
        } else if (this._entries.length > 0) {
          this._selectedButton = "select";
          this.renderItems();
        }
        return true;
      }
      
      if (event.name === "return") {
        const selected = this._entries[this._selectedIndex];
        if (selected) {
          this._currentPath = path.resolve(this._currentPath, selected);
          this._selectedIndex = 0;
          this.refreshList();
        }
        return true;
      }
    } else {
      // Button focus
      if (event.name === "up") {
        this._selectedButton = "list";
        this.renderItems();
        return true;
      }
      
      if (event.name === "left" || event.name === "right") {
        this._selectedButton = this._selectedButton === "select" ? "cancel" : "select";
        this.updateButtonHighlight();
        return true;
      }
      
      if (event.name === "return") {
        if (this._selectedButton === "select") {
          this.doSelect();
        } else {
          this.doCancel();
        }
        return true;
      }
    }

    if (event.name === "tab") {
       if (this._selectedButton === "list") this._selectedButton = "select";
       else if (this._selectedButton === "select") this._selectedButton = "cancel";
       else this._selectedButton = "list";
       this.renderItems();
       return true;
    }

    return true; // Consume all keys
  }

  /** Clean up */
  destroy(): void {
    this.container.destroyRecursively();
  }

  // ── Internal ────────────────────────────────────────────────────

  private async refreshList(): Promise<void> {
    this.pathText.content = ` ${this._currentPath}`;
    
    try {
      const entries = await fileService.readDirectory(this._currentPath, 0, true);
      // Filter for directories only and sort
      this._entries = entries
        .filter(e => e.isDirectory)
        .map(e => e.name);
      
      // Add ".." if not at root
      const parent = path.dirname(this._currentPath);
      if (parent !== this._currentPath) {
        this._entries.unshift("..");
      }
    } catch {
      this._entries = [".."];
    }

    this._selectedIndex = Math.min(this._selectedIndex, Math.max(0, this._entries.length - 1));
    this.renderItems();
  }

  private renderItems(): void {
    // Clear existing
    for (const row of this.itemRows) {
      this.itemsContainer.remove(row.id);
      row.destroy();
    }
    this.itemRows = [];
    
    this._entries.forEach((name, index) => {
      const isSelected = this._selectedButton === "list" && index === this._selectedIndex;
      const item = new TextRenderable(this.renderer, {
        id: `pp-item-${index}-${Date.now()}`,
        content: `${isSelected ? ">" : " "} ${name}/`,
        fg: isSelected ? ACCENT : FG_PRIMARY,
        bg: isSelected ? BG_HIGHLIGHT : undefined,
        height: 1,
        width: "100%",
      });
      this.itemsContainer.add(item);
      this.itemRows.push(item);
    });

    this.updateButtonHighlight();
    
    // Ensure selected item is visible in scrollbox
    if (this._selectedButton === "list") {
      // this.scrollBox.scrollTo(this._selectedIndex);
    } else {
      // Scroll to bottom when buttons are focused
      // this.scrollBox.scrollTo(this._entries.length);
    }
  }

  private updateButtonHighlight(): void {
    const isSelect = this._selectedButton === "select";
    const isCancel = this._selectedButton === "cancel";

    this.selectBtn.content = isSelect ? ">[Select Here]" : " [Select Here]";
    this.selectBtn.fg = isSelect ? ACCENT : FG_PRIMARY;
    
    this.cancelBtn.content = isCancel ? ">[Cancel]" : " [Cancel]";
    this.cancelBtn.fg = isCancel ? ACCENT : FG_PRIMARY;
  }

  private doSelect(): void {
    const callback = this._onSelect;
    const selectedPath = this._currentPath;
    this.hide();
    callback?.(selectedPath);
  }

  private doCancel(): void {
    const callback = this._onCancel;
    this.hide();
    callback?.();
  }
}

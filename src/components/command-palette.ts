// src/components/command-palette.ts — Command palette overlay component

import type { CliRenderer, KeyEvent } from "@opentui/core";
import {
  BoxRenderable,
  TextRenderable,
  InputRenderable,
  ScrollBoxRenderable,
} from "@opentui/core";

import {
  BG_SECONDARY,
  BG_HIGHLIGHT,
  BG_SELECTION,
  FG_PRIMARY,
  FG_SECONDARY,
  FG_MUTED,
  ACCENT,
} from "../theme.ts";

// ── Types ──────────────────────────────────────────────────────────

export interface Command {
  id: string;
  label: string;
  shortcut: string | null;
  category: string;
  action: () => void;
}

// ── Constants ──────────────────────────────────────────────────────

const PALETTE_WIDTH = 50;
const PALETTE_MAX_VISIBLE = 10;

// ── CommandPalette Component ───────────────────────────────────────

export class CommandPalette {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private searchInput: InputRenderable;
  private commandList: ScrollBoxRenderable;
  private commandRows: TextRenderable[] = [];

  private _isVisible = false;
  private _commands: Command[] = [];
  private _filteredCommands: Command[] = [];
  private _selectedIndex = 0;
  private _query = "";

  // ── Event Callbacks ─────────────────────────────────────────────

  onClose: (() => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    // Main container — absolute overlay, centered at top
    this.container = new BoxRenderable(renderer, {
      id: "command-palette",
      position: "absolute",
      top: 2,
      left: "50%",
      width: PALETTE_WIDTH,
      height: 3, // minimum: input + border
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
      border: true,
      borderStyle: "rounded",
      borderColor: ACCENT,
      zIndex: 300,
    });

    // Search input row
    const inputRow = new BoxRenderable(renderer, {
      id: "palette-input-row",
      flexDirection: "row",
      width: "100%",
      height: 1,
    });

    const prompt = new TextRenderable(renderer, {
      id: "palette-prompt",
      content: " > ",
      fg: ACCENT,
      width: 3,
    });

    this.searchInput = new InputRenderable(renderer, {
      id: "palette-input",
      flexGrow: 1,
      backgroundColor: BG_HIGHLIGHT,
      focusedBackgroundColor: BG_HIGHLIGHT,
      textColor: FG_PRIMARY,
      focusedTextColor: FG_PRIMARY,
      cursorColor: ACCENT,
      placeholder: "Type a command...",
    });

    inputRow.add(prompt);
    inputRow.add(this.searchInput);

    // Separator
    const separator = new TextRenderable(renderer, {
      id: "palette-separator",
      content: "─".repeat(PALETTE_WIDTH - 2),
      fg: FG_MUTED,
      width: "100%",
      height: 1,
    });

    // Scrollable command list
    this.commandList = new ScrollBoxRenderable(renderer, {
      id: "palette-list",
      width: "100%",
      flexGrow: 1,
      flexDirection: "column",
    });

    // Assemble
    this.container.add(inputRow);
    this.container.add(separator);
    this.container.add(this.commandList);

    // Wire up search input events
    this.searchInput.on("input", (value: string) => {
      this._query = value;
      this.filterCommands();
    });

    // Initially hidden
    this.container.visible = false;
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Get the container renderable */
  get renderable(): BoxRenderable {
    return this.container;
  }

  /** Whether the palette is visible */
  get isVisible(): boolean {
    return this._isVisible;
  }

  /** Get the currently selected index */
  get selectedIndex(): number {
    return this._selectedIndex;
  }

  /** Get the current query text */
  get query(): string {
    return this._query;
  }

  /** Get the number of filtered commands currently shown */
  get filteredCount(): number {
    return this._filteredCommands.length;
  }

  /** Get the total number of registered commands */
  get commandCount(): number {
    return this._commands.length;
  }

  /** Register commands for the palette */
  registerCommands(commands: Command[]): void {
    this._commands = commands;
    this._filteredCommands = [...commands];
  }

  /** Show the command palette */
  show(): void {
    this._isVisible = true;
    this._query = "";
    this._selectedIndex = 0;
    this._filteredCommands = [...this._commands];

    // Reset input
    this.searchInput.setText("");

    this.renderCommandList();
    this.container.visible = true;
    this.searchInput.focus();
  }

  /** Hide the command palette */
  hide(): void {
    this._isVisible = false;
    this.container.visible = false;
    this.searchInput.blur();
    this.onClose?.();
  }

  /** Handle keyboard events. Returns true if consumed. */
  handleKeyPress(event: KeyEvent): boolean {
    if (!this._isVisible) return false;

    // Escape — close
    if (event.name === "escape") {
      this.hide();
      return true;
    }

    // Enter — execute selected command
    if (event.name === "return" && !event.ctrl && !event.shift) {
      this.executeSelected();
      return true;
    }

    // Up arrow — move selection up
    if (event.name === "up") {
      this.moveUp();
      return true;
    }

    // Down arrow — move selection down
    if (event.name === "down") {
      this.moveDown();
      return true;
    }

    // Delegate to search input for text editing
    return this.searchInput.handleKeyPress(event);
  }

  /** Move selection up */
  moveUp(): void {
    if (this._filteredCommands.length === 0) return;
    this._selectedIndex = (this._selectedIndex - 1 + this._filteredCommands.length) % this._filteredCommands.length;
    this.updateSelection();
  }

  /** Move selection down */
  moveDown(): void {
    if (this._filteredCommands.length === 0) return;
    this._selectedIndex = (this._selectedIndex + 1) % this._filteredCommands.length;
    this.updateSelection();
  }

  /** Execute the currently selected command */
  executeSelected(): void {
    if (this._filteredCommands.length === 0 || this._selectedIndex >= this._filteredCommands.length) {
      return;
    }

    const command = this._filteredCommands[this._selectedIndex]!;
    this.hide();
    command.action();
  }

  /** Clean up */
  destroy(): void {
    this.container.destroyRecursively();
  }

  // ── Internal ────────────────────────────────────────────────────

  private filterCommands(): void {
    const query = this._query.toLowerCase().trim();

    if (!query) {
      this._filteredCommands = [...this._commands];
    } else {
      this._filteredCommands = this._commands.filter((cmd) => {
        const searchable = `${cmd.label} ${cmd.category}`.toLowerCase();
        return searchable.includes(query);
      });
    }

    this._selectedIndex = 0;
    this.renderCommandList();
  }

  private renderCommandList(): void {
    // Clear existing command rows
    for (const row of this.commandRows) {
      this.commandList.remove(row.id);
      row.destroy();
    }
    this.commandRows = [];

    // Calculate height
    const visibleCount = Math.min(this._filteredCommands.length, PALETTE_MAX_VISIBLE);
    // 3 = input row (1) + separator (1) + border (1 top)
    this.container.height = visibleCount + 3;

    if (this._filteredCommands.length === 0) {
      const emptyRow = new TextRenderable(this.renderer, {
        id: "palette-empty",
        content: "  No matching commands",
        fg: FG_SECONDARY,
        width: "100%",
        height: 1,
      });
      this.commandList.add(emptyRow);
      this.commandRows.push(emptyRow);
      return;
    }

    // Render each filtered command
    for (let i = 0; i < this._filteredCommands.length; i++) {
      const cmd = this._filteredCommands[i]!;
      const isSelected = i === this._selectedIndex;

      const label = this.formatCommandRow(cmd, isSelected);
      const row = new TextRenderable(this.renderer, {
        id: `palette-cmd-${i}`,
        content: label,
        fg: isSelected ? ACCENT : FG_PRIMARY,
        bg: isSelected ? BG_SELECTION : undefined,
        width: "100%",
        height: 1,
      });

      this.commandList.add(row);
      this.commandRows.push(row);
    }
  }

  private updateSelection(): void {
    // Update visual state of command rows
    for (let i = 0; i < this.commandRows.length && i < this._filteredCommands.length; i++) {
      const row = this.commandRows[i]!;
      const cmd = this._filteredCommands[i]!;
      const isSelected = i === this._selectedIndex;

      row.content = this.formatCommandRow(cmd, isSelected);
      row.fg = isSelected ? ACCENT : FG_PRIMARY;
      row.bg = isSelected ? BG_SELECTION : undefined;
    }

    // Scroll to keep selection visible
    if (this._selectedIndex < this.commandRows.length) {
      this.commandList.scrollTo(this._selectedIndex);
    }
  }

  private formatCommandRow(cmd: Command, isSelected: boolean): string {
    const marker = isSelected ? ">" : " ";
    const shortcutText = cmd.shortcut ?? "";
    const labelWidth = PALETTE_WIDTH - 6 - shortcutText.length;
    const paddedLabel = cmd.label.substring(0, labelWidth).padEnd(labelWidth);
    return `${marker} ${paddedLabel} ${shortcutText}`;
  }
}

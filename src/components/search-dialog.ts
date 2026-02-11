// src/components/search-dialog.ts — Find & replace overlay component

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { BoxRenderable, TextRenderable, InputRenderable } from "@opentui/core";

import {
  BG_HIGHLIGHT,
  BG_SECONDARY,
  FG_PRIMARY,
  FG_SECONDARY,
  ACCENT,
  WARNING,
} from "../theme.ts";

// ── Types ──────────────────────────────────────────────────────────

export interface SearchMatch {
  start: number;
  end: number;
}

export type SearchMode = "find" | "replace";

// ── SearchDialog Component ─────────────────────────────────────────

const DIALOG_WIDTH = 50;
const FIND_DIALOG_HEIGHT = 3;
const REPLACE_DIALOG_HEIGHT = 5;

export class SearchDialog {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private searchInput: InputRenderable;
  private replaceInput: InputRenderable;
  private replaceRow: BoxRenderable;
  private matchInfo: TextRenderable;
  private actionsRow: BoxRenderable;

  private _isVisible = false;
  private _mode: SearchMode = "find";
  private _searchTerm = "";
  private _replaceTerm = "";
  private _matches: SearchMatch[] = [];
  private _currentMatchIndex = -1;
  private _focusedField: "search" | "replace" = "search";

  // ── Event Callbacks ─────────────────────────────────────────────

  onSearchChange: ((term: string) => void) | null = null;
  onNavigate: ((match: SearchMatch, index: number) => void) | null = null;
  onReplace: ((match: SearchMatch, replacement: string) => void) | null = null;
  onReplaceAll: ((term: string, replacement: string) => void) | null = null;
  onClose: (() => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    // Main container — absolute overlay
    this.container = new BoxRenderable(renderer, {
      id: "search-dialog",
      position: "absolute",
      top: 1,
      right: 1,
      width: DIALOG_WIDTH,
      height: FIND_DIALOG_HEIGHT,
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
      border: true,
      borderStyle: "rounded",
      borderColor: ACCENT,
      zIndex: 100,
    });

    // ── Row 1: Search input ─────────────────────────────────────
    const searchRow = new BoxRenderable(renderer, {
      id: "search-row",
      flexDirection: "row",
      width: "100%",
      height: 1,
    });

    const searchLabel = new TextRenderable(renderer, {
      id: "search-label",
      content: " Find: ",
      fg: FG_SECONDARY,
      width: 7,
    });

    this.searchInput = new InputRenderable(renderer, {
      id: "search-input",
      flexGrow: 1,
      backgroundColor: BG_HIGHLIGHT,
      focusedBackgroundColor: BG_HIGHLIGHT,
      textColor: FG_PRIMARY,
      focusedTextColor: FG_PRIMARY,
      cursorColor: ACCENT,
      placeholder: "Search...",
    });

    this.matchInfo = new TextRenderable(renderer, {
      id: "search-match-info",
      content: "",
      fg: FG_SECONDARY,
      width: 10,
    });

    searchRow.add(searchLabel);
    searchRow.add(this.searchInput);
    searchRow.add(this.matchInfo);

    // ── Row 2: Replace input ────────────────────────────────────
    this.replaceRow = new BoxRenderable(renderer, {
      id: "replace-row",
      flexDirection: "row",
      width: "100%",
      height: 1,
    });

    const replaceLabel = new TextRenderable(renderer, {
      id: "replace-label",
      content: " With: ",
      fg: FG_SECONDARY,
      width: 7,
    });

    this.replaceInput = new InputRenderable(renderer, {
      id: "replace-input",
      flexGrow: 1,
      backgroundColor: BG_HIGHLIGHT,
      focusedBackgroundColor: BG_HIGHLIGHT,
      textColor: FG_PRIMARY,
      focusedTextColor: FG_PRIMARY,
      cursorColor: ACCENT,
      placeholder: "Replace...",
    });

    // Actions for replace mode
    this.actionsRow = new BoxRenderable(renderer, {
      id: "replace-actions",
      flexDirection: "row",
      width: "100%",
      height: 1,
    });

    const replaceBtn = new TextRenderable(renderer, {
      id: "replace-btn",
      content: " [Enter:Replace]",
      fg: WARNING,
    });

    const replaceAllBtn = new TextRenderable(renderer, {
      id: "replace-all-btn",
      content: " [Ctrl+Enter:All]",
      fg: WARNING,
    });

    const navHint = new TextRenderable(renderer, {
      id: "nav-hint",
      content: " [↑↓:Nav]",
      fg: FG_SECONDARY,
    });

    this.actionsRow.add(replaceBtn);
    this.actionsRow.add(replaceAllBtn);
    this.actionsRow.add(navHint);

    this.replaceRow.add(replaceLabel);
    this.replaceRow.add(this.replaceInput);

    // Assemble
    this.container.add(searchRow);
    this.container.add(this.replaceRow);
    this.container.add(this.actionsRow);

    // Wire up search input events
    this.searchInput.on("input", (value: string) => {
      this._searchTerm = value;
      this.onSearchChange?.(value);
    });

    this.replaceInput.on("input", (value: string) => {
      this._replaceTerm = value;
    });

    // Initially hidden
    this.container.visible = false;
    this.replaceRow.visible = false;
    this.actionsRow.visible = false;
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

  /** Get the current search term */
  get searchTerm(): string {
    return this._searchTerm;
  }

  /** Get the current replace term */
  get replaceTerm(): string {
    return this._replaceTerm;
  }

  /** Get the current mode */
  get mode(): SearchMode {
    return this._mode;
  }

  /** Get the current match index (0-based, -1 if none) */
  get currentMatchIndex(): number {
    return this._currentMatchIndex;
  }

  /** Get total match count */
  get matchCount(): number {
    return this._matches.length;
  }

  /** Show the search dialog */
  show(mode: SearchMode = "find"): void {
    this._isVisible = true;
    this._mode = mode;
    this.container.visible = true;

    if (mode === "replace") {
      this.replaceRow.visible = true;
      this.actionsRow.visible = true;
      this.container.height = REPLACE_DIALOG_HEIGHT;
    } else {
      this.replaceRow.visible = false;
      this.actionsRow.visible = false;
      this.container.height = FIND_DIALOG_HEIGHT;
    }

    this._focusedField = "search";
    this.searchInput.focus();
  }

  /** Hide the search dialog */
  hide(): void {
    this._isVisible = false;
    this.container.visible = false;
    this.searchInput.blur();
    this.replaceInput.blur();
    this._matches = [];
    this._currentMatchIndex = -1;
    this.updateMatchInfo();
    this.onClose?.();
  }

  /** Update the list of matches from external search */
  setMatches(matches: SearchMatch[]): void {
    this._matches = matches;
    if (matches.length > 0 && this._currentMatchIndex === -1) {
      this._currentMatchIndex = 0;
    } else if (matches.length === 0) {
      this._currentMatchIndex = -1;
    } else if (this._currentMatchIndex >= matches.length) {
      this._currentMatchIndex = matches.length - 1;
    }
    this.updateMatchInfo();
  }

  /** Navigate to the next match */
  findNext(): void {
    if (this._matches.length === 0) return;
    this._currentMatchIndex = (this._currentMatchIndex + 1) % this._matches.length;
    this.updateMatchInfo();
    const match = this._matches[this._currentMatchIndex]!;
    this.onNavigate?.(match, this._currentMatchIndex);
  }

  /** Navigate to the previous match */
  findPrevious(): void {
    if (this._matches.length === 0) return;
    this._currentMatchIndex = (this._currentMatchIndex - 1 + this._matches.length) % this._matches.length;
    this.updateMatchInfo();
    const match = this._matches[this._currentMatchIndex]!;
    this.onNavigate?.(match, this._currentMatchIndex);
  }

  /** Replace the current match */
  replaceCurrent(): void {
    if (this._matches.length === 0 || this._currentMatchIndex < 0) return;
    const match = this._matches[this._currentMatchIndex]!;
    this.onReplace?.(match, this._replaceTerm);
  }

  /** Replace all matches */
  replaceAllMatches(): void {
    if (this._matches.length === 0) return;
    this.onReplaceAll?.(this._searchTerm, this._replaceTerm);
  }

  /** Handle keyboard events for the search dialog. Returns true if consumed. */
  handleKeyPress(event: KeyEvent): boolean {
    if (!this._isVisible) return false;

    // Escape — close dialog
    if (event.name === "escape") {
      this.hide();
      return true;
    }

    // Tab — switch between search and replace fields
    if (event.name === "tab" && !event.ctrl && this._mode === "replace") {
      if (this._focusedField === "search") {
        this._focusedField = "replace";
        this.searchInput.blur();
        this.replaceInput.focus();
      } else {
        this._focusedField = "search";
        this.replaceInput.blur();
        this.searchInput.focus();
      }
      return true;
    }

    // Enter — in search mode: find next; in replace mode: replace current
    if (event.name === "return" && !event.ctrl && !event.shift) {
      if (this._mode === "replace" && this._focusedField === "replace") {
        this.replaceCurrent();
      } else {
        this.findNext();
      }
      return true;
    }

    // Ctrl+Enter — replace all (in replace mode)
    if (event.name === "return" && event.ctrl) {
      if (this._mode === "replace") {
        this.replaceAllMatches();
      }
      return true;
    }

    // Arrow up/down — navigate matches
    if (event.name === "up" && event.ctrl) {
      this.findPrevious();
      return true;
    }

    if (event.name === "down" && event.ctrl) {
      this.findNext();
      return true;
    }

    // Shift+Enter — find previous
    if (event.name === "return" && event.shift) {
      this.findPrevious();
      return true;
    }

    // Delegate to the focused input
    if (this._focusedField === "search") {
      return this.searchInput.handleKeyPress(event);
    } else {
      return this.replaceInput.handleKeyPress(event);
    }
  }

  /** Clean up */
  destroy(): void {
    this.container.destroyRecursively();
  }

  // ── Internal ────────────────────────────────────────────────────

  private updateMatchInfo(): void {
    if (this._matches.length === 0) {
      if (this._searchTerm.length > 0) {
        this.matchInfo.content = " No match";
      } else {
        this.matchInfo.content = "";
      }
    } else {
      this.matchInfo.content = ` ${this._currentMatchIndex + 1}/${this._matches.length}`;
    }
  }
}

// src/components/help-dialog.ts — Help dialog overlay component

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
  INFO,
} from "../theme.ts";

import { EMBEDDED_DOCS, getEmbeddedDoc } from "../help-content.ts";

// ── Types ──────────────────────────────────────────────────────────

export type HelpMode = "search" | "topics";

export interface HelpTopic {
  title: string;
  filename: string;
}

// ── Constants ──────────────────────────────────────────────────────

const DIALOG_WIDTH = 60;
const DIALOG_HEIGHT = 20;

const HELP_TOPICS: HelpTopic[] = [
  { title: "Keyboard Shortcuts", filename: "keyboard-shortcuts.md" },
  { title: "Getting Started", filename: "getting-started.md" },
  { title: "User Guide", filename: "user-guide.md" },
  { title: "Configuration", filename: "configuration.md" },
  { title: "Architecture", filename: "architecture.md" },
];

// ── HelpDialog Component ───────────────────────────────────────────

export class HelpDialog {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private titleText: TextRenderable;
  private searchInput: InputRenderable;
  private searchRow: BoxRenderable;
  private contentArea: ScrollBoxRenderable;
  private contentRows: TextRenderable[] = [];
  private topicRows: TextRenderable[] = [];

  private _isVisible = false;
  private _mode: HelpMode = "topics";
  private _selectedIndex = 0;
  private _query = "";
  private _viewingTopic = false;

  // ── Event Callbacks ─────────────────────────────────────────────

  onClose: (() => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    // Main container — absolute overlay, centered
    this.container = new BoxRenderable(renderer, {
      id: "help-dialog",
      position: "absolute",
      top: 3,
      left: "50%",
      width: DIALOG_WIDTH,
      height: DIALOG_HEIGHT,
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
      border: true,
      borderStyle: "rounded",
      borderColor: INFO,
      zIndex: 250,
    });

    // Title bar
    this.titleText = new TextRenderable(renderer, {
      id: "help-title",
      content: " Help Topics",
      fg: INFO,
      width: "100%",
      height: 1,
    });

    // Search row
    this.searchRow = new BoxRenderable(renderer, {
      id: "help-search-row",
      flexDirection: "row",
      width: "100%",
      height: 1,
    });

    const searchLabel = new TextRenderable(renderer, {
      id: "help-search-label",
      content: " > ",
      fg: ACCENT,
      width: 3,
    });

    this.searchInput = new InputRenderable(renderer, {
      id: "help-search-input",
      flexGrow: 1,
      backgroundColor: BG_HIGHLIGHT,
      focusedBackgroundColor: BG_HIGHLIGHT,
      textColor: FG_PRIMARY,
      focusedTextColor: FG_PRIMARY,
      cursorColor: ACCENT,
      placeholder: "Search docs...",
    });

    this.searchRow.add(searchLabel);
    this.searchRow.add(this.searchInput);

    // Separator
    const separator = new TextRenderable(renderer, {
      id: "help-separator",
      content: "─".repeat(DIALOG_WIDTH - 2),
      fg: FG_MUTED,
      width: "100%",
      height: 1,
    });

    // Scrollable content area
    this.contentArea = new ScrollBoxRenderable(renderer, {
      id: "help-content",
      width: "100%",
      flexGrow: 1,
      flexDirection: "column",
    });

    // Assemble
    this.container.add(this.titleText);
    this.container.add(this.searchRow);
    this.container.add(separator);
    this.container.add(this.contentArea);

    // Wire search input events
    this.searchInput.on("input", (value: string) => {
      this._query = value;
      this.performSearch();
    });

    // Initially hidden
    this.container.visible = false;
    this.searchRow.visible = false;
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Get the container renderable */
  get renderable(): BoxRenderable {
    return this.container;
  }

  /** Whether the dialog is visible */
  get isVisible(): boolean {
    return this._isVisible;
  }

  /** Get the current mode */
  get mode(): HelpMode {
    return this._mode;
  }

  /** Get the selected index */
  get selectedIndex(): number {
    return this._selectedIndex;
  }

  /** Set the docs directory path (no longer needed — docs are embedded) */
  setDocsDir(_dir: string): void {
    // No-op: docs are now embedded in help-content.ts
  }

  /** Show the help dialog in the given mode */
  show(mode: HelpMode = "topics"): void {
    this._isVisible = true;
    this._mode = mode;
    this._selectedIndex = 0;
    this._viewingTopic = false;
    this.container.visible = true;

    if (mode === "search") {
      this.titleText.content = " Search Documentation";
      this.searchRow.visible = true;
      this.searchInput.setText("");
      this._query = "";
      this.searchInput.focus();
      this.clearContent();
    } else {
      this.titleText.content = " Help Topics";
      this.searchRow.visible = false;
      this.renderTopicList();
    }
  }

  /** Hide the help dialog */
  hide(): void {
    this._isVisible = false;
    this._viewingTopic = false;
    this.container.visible = false;
    this.searchInput.blur();
    this.onClose?.();
  }

  /** Handle keyboard events. Returns true if consumed. */
  handleKeyPress(event: KeyEvent): boolean {
    if (!this._isVisible) return false;

    // Escape — close or go back to topic list
    if (event.name === "escape") {
      if (this._viewingTopic) {
        // Go back to topic list
        this._viewingTopic = false;
        this.renderTopicList();
        return true;
      }
      this.hide();
      return true;
    }

    // In search mode, delegate most keys to the input
    if (this._mode === "search") {
      return this.searchInput.handleKeyPress(event);
    }

    // Topics mode navigation
    if (this._viewingTopic) {
      // While viewing a topic, only Escape goes back (handled above)
      // Arrow keys scroll the content
      if (event.name === "up") {
        this.contentArea.scrollBy(-1 / 5, "viewport");
        return true;
      }
      if (event.name === "down") {
        this.contentArea.scrollBy(1 / 5, "viewport");
        return true;
      }
      if (event.name === "pageup") {
        this.contentArea.scrollBy(-1 / 2, "viewport");
        return true;
      }
      if (event.name === "pagedown") {
        this.contentArea.scrollBy(1 / 2, "viewport");
        return true;
      }
      return true;
    }

    // Up — move selection up
    if (event.name === "up") {
      this._selectedIndex = (this._selectedIndex - 1 + HELP_TOPICS.length) % HELP_TOPICS.length;
      this.updateTopicHighlight();
      return true;
    }

    // Down — move selection down
    if (event.name === "down") {
      this._selectedIndex = (this._selectedIndex + 1) % HELP_TOPICS.length;
      this.updateTopicHighlight();
      return true;
    }

    // Enter — view selected topic
    if (event.name === "return") {
      this.viewTopic(this._selectedIndex);
      return true;
    }

    return true; // Consume all keys while dialog is open
  }

  /** Clean up */
  destroy(): void {
    this.container.destroyRecursively();
  }

  // ── Internal ────────────────────────────────────────────────────

  private clearContent(): void {
    for (const row of this.contentRows) {
      this.contentArea.remove(row.id);
      row.destroy();
    }
    this.contentRows = [];
    for (const row of this.topicRows) {
      this.contentArea.remove(row.id);
      row.destroy();
    }
    this.topicRows = [];
  }

  private renderTopicList(): void {
    this.clearContent();
    this.titleText.content = " Help Topics";

    for (let i = 0; i < HELP_TOPICS.length; i++) {
      const topic = HELP_TOPICS[i]!;
      const isSelected = i === this._selectedIndex;
      const marker = isSelected ? ">" : " ";

      const row = new TextRenderable(this.renderer, {
        id: `help-topic-${i}`,
        content: `${marker} ${topic.title}`,
        fg: isSelected ? ACCENT : FG_PRIMARY,
        bg: isSelected ? BG_SELECTION : undefined,
        width: "100%",
        height: 1,
      });

      this.contentArea.add(row);
      this.topicRows.push(row);
    }

    // Add hint at the bottom
    const hint = new TextRenderable(this.renderer, {
      id: "help-hint",
      content: " ↑↓ Navigate  Enter Select  Esc Close",
      fg: FG_SECONDARY,
      width: "100%",
      height: 1,
    });
    this.contentArea.add(hint);
    this.topicRows.push(hint);
  }

  private updateTopicHighlight(): void {
    for (let i = 0; i < HELP_TOPICS.length && i < this.topicRows.length; i++) {
      const row = this.topicRows[i]!;
      const topic = HELP_TOPICS[i]!;
      const isSelected = i === this._selectedIndex;
      const marker = isSelected ? ">" : " ";

      row.content = `${marker} ${topic.title}`;
      row.fg = isSelected ? ACCENT : FG_PRIMARY;
      row.bg = isSelected ? BG_SELECTION : undefined;
    }

    // Scroll to keep selection visible
    if (this._selectedIndex < this.topicRows.length) {
      this.contentArea.scrollTo(this._selectedIndex);
    }
  }

  private async viewTopic(index: number): Promise<void> {
    const topic = HELP_TOPICS[index];
    if (!topic) return;

    this._viewingTopic = true;
    this.titleText.content = ` ${topic.title}`;

    const content = getEmbeddedDoc(topic.filename);
    if (content === null) {
      this.showContentLines([" Could not load help file."]);
      return;
    }

    const lines = content.split("\n");
    this.showContentLines(lines);
  }

  private showContentLines(lines: string[]): void {
    this.clearContent();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      // Basic markdown rendering: headers get ACCENT color
      const isHeader = line.startsWith("#");
      const row = new TextRenderable(this.renderer, {
        id: `help-content-${i}`,
        content: ` ${line}`,
        fg: isHeader ? ACCENT : FG_PRIMARY,
        width: "100%",
        height: 1,
      });
      this.contentArea.add(row);
      this.contentRows.push(row);
    }

    // Add back hint
    const backHint = new TextRenderable(this.renderer, {
      id: "help-back-hint",
      content: " ↑↓ Scroll  PgUp/PgDn Fast scroll  Esc Back",
      fg: FG_SECONDARY,
      width: "100%",
      height: 1,
    });
    this.contentArea.add(backHint);
    this.contentRows.push(backHint);
  }

  private async performSearch(): Promise<void> {
    const query = this._query.toLowerCase().trim();
    if (!query) {
      this.clearContent();
      const hint = new TextRenderable(this.renderer, {
        id: "help-search-hint",
        content: " Type to search documentation...",
        fg: FG_SECONDARY,
        width: "100%",
        height: 1,
      });
      this.contentArea.add(hint);
      this.contentRows.push(hint);
      return;
    }

    this.clearContent();

    const results: Array<{ file: string; line: string; lineNum: number }> = [];

    for (const doc of EMBEDDED_DOCS) {
      const lines = doc.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? "";
        if (line.toLowerCase().includes(query)) {
          results.push({ file: doc.title, line: line.trim(), lineNum: i + 1 });
        }
      }
    }

    if (results.length === 0) {
      const noResults = new TextRenderable(this.renderer, {
        id: "help-no-results",
        content: ` No results for "${this._query}"`,
        fg: FG_SECONDARY,
        width: "100%",
        height: 1,
      });
      this.contentArea.add(noResults);
      this.contentRows.push(noResults);
      return;
    }

    // Show results (limit to 50)
    const displayResults = results.slice(0, 50);
    for (let i = 0; i < displayResults.length; i++) {
      const result = displayResults[i]!;
      const truncatedLine = result.line.length > DIALOG_WIDTH - 10
        ? result.line.substring(0, DIALOG_WIDTH - 13) + "..."
        : result.line;

      const row = new TextRenderable(this.renderer, {
        id: `help-result-${i}`,
        content: ` ${result.file}:${result.lineNum}: ${truncatedLine}`,
        fg: FG_PRIMARY,
        width: "100%",
        height: 1,
      });
      this.contentArea.add(row);
      this.contentRows.push(row);
    }

    if (results.length > 50) {
      const moreRow = new TextRenderable(this.renderer, {
        id: "help-more-results",
        content: ` ...and ${results.length - 50} more results`,
        fg: FG_SECONDARY,
        width: "100%",
        height: 1,
      });
      this.contentArea.add(moreRow);
      this.contentRows.push(moreRow);
    }
  }
}

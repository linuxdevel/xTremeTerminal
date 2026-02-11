// src/components/status-bar.ts — Bottom status bar component

import type { CliRenderer } from "@opentui/core";
import { BoxRenderable, TextRenderable } from "@opentui/core";

import {
  BG_SECONDARY,
  FG_PRIMARY,
  FG_SECONDARY,
  ACCENT,
  ERROR,
  WARNING,
  SUCCESS,
  INFO,
} from "../theme.ts";

// ── Types ──────────────────────────────────────────────────────────

export interface StatusBarState {
  filename: string | null;
  cursorLine: number;
  cursorColumn: number;
  language: string | null;
  encoding: string;
  indentStyle: string;
  isModified: boolean;
  totalLines: number;
}

export type MessageType = "info" | "error" | "warning" | "success";

// ── Constants ──────────────────────────────────────────────────────

const DEFAULT_MESSAGE_TIMEOUT = 3000;

const MESSAGE_COLORS: Record<MessageType, string> = {
  info: INFO,
  error: ERROR,
  warning: WARNING,
  success: SUCCESS,
};

// ── StatusBar Component ────────────────────────────────────────────

export class StatusBar {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private leftSection: TextRenderable;
  private centerSection: TextRenderable;
  private rightSection: TextRenderable;

  private _state: StatusBarState = {
    filename: null,
    cursorLine: 0,
    cursorColumn: 0,
    language: null,
    encoding: "UTF-8",
    indentStyle: "4 spaces",
    isModified: false,
    totalLines: 0,
  };

  private _messageTimer: ReturnType<typeof setTimeout> | null = null;
  private _showingMessage = false;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    // Container — row layout, full width, 1 row tall
    this.container = new BoxRenderable(renderer, {
      id: "status-bar-component",
      width: "100%",
      height: 1,
      flexDirection: "row",
      backgroundColor: BG_SECONDARY,
    });

    // Left section: filename + modified indicator
    this.leftSection = new TextRenderable(renderer, {
      id: "status-bar-left",
      content: " xTremeTerminal",
      fg: ACCENT,
      flexGrow: 1,
    });

    // Center section: cursor position
    this.centerSection = new TextRenderable(renderer, {
      id: "status-bar-center",
      content: "",
      fg: FG_PRIMARY,
      width: 20,
    });

    // Right section: language, encoding, indent
    this.rightSection = new TextRenderable(renderer, {
      id: "status-bar-right",
      content: "",
      fg: FG_SECONDARY,
      width: 35,
    });

    this.container.add(this.leftSection);
    this.container.add(this.centerSection);
    this.container.add(this.rightSection);

    this.renderState();
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Get the container renderable to add to the layout */
  get renderable(): BoxRenderable {
    return this.container;
  }

  /** Get the current state */
  get state(): StatusBarState {
    return { ...this._state };
  }

  /** Whether a temporary message is currently showing */
  get isShowingMessage(): boolean {
    return this._showingMessage;
  }

  /** Update the status bar with new state */
  update(state: Partial<StatusBarState>): void {
    this._state = { ...this._state, ...state };
    if (!this._showingMessage) {
      this.renderState();
    }
  }

  /** Show a temporary message that auto-dismisses */
  showMessage(text: string, type: MessageType = "info", timeout?: number): void {
    // Cancel any existing message timer
    this.clearMessageTimer();

    this._showingMessage = true;

    const color = MESSAGE_COLORS[type];
    this.leftSection.content = ` ${text}`;
    this.leftSection.fg = color;
    this.centerSection.content = "";
    this.rightSection.content = "";

    const ms = timeout ?? DEFAULT_MESSAGE_TIMEOUT;
    this._messageTimer = setTimeout(() => {
      this._messageTimer = null;
      this._showingMessage = false;
      this.renderState();
    }, ms);
  }

  /** Clean up */
  destroy(): void {
    this.clearMessageTimer();
    this.container.destroyRecursively();
  }

  // ── Internal ────────────────────────────────────────────────────

  private renderState(): void {
    const { filename, cursorLine, cursorColumn, language, encoding, indentStyle, isModified, totalLines } = this._state;

    // Left section: filename
    if (filename) {
      const modifiedMark = isModified ? " [+]" : "";
      this.leftSection.content = ` ${filename}${modifiedMark}`;
      this.leftSection.fg = isModified ? WARNING : ACCENT;
    } else {
      this.leftSection.content = " xTremeTerminal";
      this.leftSection.fg = ACCENT;
    }

    // Center section: cursor position
    if (filename || totalLines > 0) {
      this.centerSection.content = `Ln ${cursorLine + 1}, Col ${cursorColumn + 1}`;
    } else {
      this.centerSection.content = "";
    }

    // Right section: language | encoding | indent | lines
    const parts: string[] = [];
    if (language) parts.push(language);
    parts.push(encoding);
    parts.push(indentStyle);
    if (totalLines > 0) parts.push(`${totalLines} lines`);
    this.rightSection.content = parts.join(" | ") + " ";
  }

  private clearMessageTimer(): void {
    if (this._messageTimer) {
      clearTimeout(this._messageTimer);
      this._messageTimer = null;
    }
  }
}

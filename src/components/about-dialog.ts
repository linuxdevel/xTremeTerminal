// src/components/about-dialog.ts — About dialog overlay component

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { BoxRenderable, TextRenderable } from "@opentui/core";

import {
  BG_SECONDARY,
  FG_PRIMARY,
  FG_SECONDARY,
  ACCENT,
  INFO,
} from "../theme.ts";

// ── Constants ──────────────────────────────────────────────────────

const DIALOG_WIDTH = 48;
const DIALOG_HEIGHT = 12;

// ── AboutDialog Component ──────────────────────────────────────────

export class AboutDialog {
  private renderer: CliRenderer;
  private container: BoxRenderable;

  private _isVisible = false;

  // ── Event Callbacks ─────────────────────────────────────────────

  onClose: (() => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    // Main container — absolute overlay, centered
    this.container = new BoxRenderable(renderer, {
      id: "about-dialog",
      position: "absolute",
      top: 6,
      left: "50%",
      width: DIALOG_WIDTH,
      height: DIALOG_HEIGHT,
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
      border: true,
      borderStyle: "rounded",
      borderColor: ACCENT,
      zIndex: 260,
    });

    // Title
    const title = new TextRenderable(renderer, {
      id: "about-title",
      content: " xTerm",
      fg: ACCENT,
      width: "100%",
      height: 1,
    });

    // Subtitle
    const subtitle = new TextRenderable(renderer, {
      id: "about-subtitle",
      content: " Terminal Text Editor",
      fg: INFO,
      width: "100%",
      height: 1,
    });

    // Spacer
    const spacer1 = new BoxRenderable(renderer, {
      id: "about-spacer-1",
      width: "100%",
      height: 1,
    });

    // Version
    const version = new TextRenderable(renderer, {
      id: "about-version",
      content: " Version: 1.0.0",
      fg: FG_PRIMARY,
      width: "100%",
      height: 1,
    });

    // Author
    const author = new TextRenderable(renderer, {
      id: "about-author",
      content: " Author: xTerm Developer",
      fg: FG_PRIMARY,
      width: "100%",
      height: 1,
    });

    // License
    const license = new TextRenderable(renderer, {
      id: "about-license",
      content: " License: GPL-3.0",
      fg: FG_PRIMARY,
      width: "100%",
      height: 1,
    });

    // Spacer
    const spacer2 = new BoxRenderable(renderer, {
      id: "about-spacer-2",
      width: "100%",
      height: 1,
    });

    // Project link
    const projectLink = new TextRenderable(renderer, {
      id: "about-project-link",
      content: " github.com/linuxdevel/xTremeTerminal",
      fg: ACCENT,
      width: "100%",
      height: 1,
    });

    // Close hint
    const closeHint = new TextRenderable(renderer, {
      id: "about-close-hint",
      content: " Press Escape to close",
      fg: FG_SECONDARY,
      width: "100%",
      height: 1,
    });

    // Assemble
    this.container.add(title);
    this.container.add(subtitle);
    this.container.add(spacer1);
    this.container.add(version);
    this.container.add(author);
    this.container.add(license);
    this.container.add(spacer2);
    this.container.add(projectLink);
    this.container.add(closeHint);

    // Initially hidden
    this.container.visible = false;
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

  /** Show the about dialog */
  show(): void {
    this._isVisible = true;
    this.container.visible = true;
  }

  /** Hide the about dialog */
  hide(): void {
    this._isVisible = false;
    this.container.visible = false;
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

    return true; // Consume all keys while dialog is open
  }

  /** Clean up */
  destroy(): void {
    this.container.destroyRecursively();
  }
}

// src/components/confirm-dialog.ts — Confirmation dialog overlay component

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { BoxRenderable, TextRenderable } from "@opentui/core";

import {
  BG_SECONDARY,
  FG_PRIMARY,
  FG_SECONDARY,
  ACCENT,
  ERROR,
  WARNING,
} from "../theme.ts";

// ── Types ──────────────────────────────────────────────────────────

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// ── Constants ──────────────────────────────────────────────────────

const DIALOG_WIDTH = 44;
const DIALOG_HEIGHT = 7;

// ── ConfirmDialog Component ────────────────────────────────────────

export class ConfirmDialog {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private titleText: TextRenderable;
  private messageText: TextRenderable;
  private buttonsRow: BoxRenderable;
  private confirmBtn: TextRenderable;
  private cancelBtn: TextRenderable;

  private _isVisible = false;
  private _selectedButton: "confirm" | "cancel" = "cancel";
  private _confirmLabel = "Yes";
  private _cancelLabel = "No";

  private _onConfirm: (() => void) | null = null;
  private _onCancel: (() => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    // Main container — absolute overlay, centered
    this.container = new BoxRenderable(renderer, {
      id: "confirm-dialog",
      position: "absolute",
      top: 8,
      left: "50%",
      width: DIALOG_WIDTH,
      height: DIALOG_HEIGHT,
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
      border: true,
      borderStyle: "rounded",
      borderColor: WARNING,
      zIndex: 200,
    });

    // Title
    this.titleText = new TextRenderable(renderer, {
      id: "confirm-title",
      content: "",
      fg: WARNING,
      width: "100%",
      height: 1,
    });

    // Spacer
    const spacer1 = new BoxRenderable(renderer, {
      id: "confirm-spacer-1",
      width: "100%",
      height: 1,
    });

    // Message
    this.messageText = new TextRenderable(renderer, {
      id: "confirm-message",
      content: "",
      fg: FG_SECONDARY,
      width: "100%",
      height: 1,
    });

    // Spacer
    const spacer2 = new BoxRenderable(renderer, {
      id: "confirm-spacer-2",
      width: "100%",
      height: 1,
    });

    // Buttons row
    this.buttonsRow = new BoxRenderable(renderer, {
      id: "confirm-buttons",
      flexDirection: "row",
      width: "100%",
      height: 1,
      justifyContent: "center",
    });

    this.confirmBtn = new TextRenderable(renderer, {
      id: "confirm-btn-yes",
      content: "",
      fg: ERROR,
      width: 12,
    });

    const btnSpacer = new TextRenderable(renderer, {
      id: "confirm-btn-spacer",
      content: "    ",
      fg: FG_SECONDARY,
      width: 4,
    });

    this.cancelBtn = new TextRenderable(renderer, {
      id: "confirm-btn-no",
      content: "",
      fg: ACCENT,
      width: 12,
    });

    this.buttonsRow.add(this.confirmBtn);
    this.buttonsRow.add(btnSpacer);
    this.buttonsRow.add(this.cancelBtn);

    // Assemble
    this.container.add(this.titleText);
    this.container.add(spacer1);
    this.container.add(this.messageText);
    this.container.add(spacer2);
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

  /** Get the currently selected button */
  get selectedButton(): "confirm" | "cancel" {
    return this._selectedButton;
  }

  /** Show the confirmation dialog */
  show(options: ConfirmDialogOptions): void {
    this._isVisible = true;
    this._selectedButton = "cancel"; // Default to cancel for safety
    this._onConfirm = options.onConfirm;
    this._onCancel = options.onCancel;

    const confirmLabel = options.confirmLabel ?? "Yes";
    const cancelLabel = options.cancelLabel ?? "No";

    this._confirmLabel = confirmLabel;
    this._cancelLabel = cancelLabel;

    this.titleText.content = ` ${options.title}`;
    this.messageText.content = ` ${options.message}`;

    this.updateButtonHighlight();
    this.container.visible = true;
  }

  /** Hide the dialog */
  hide(): void {
    this._isVisible = false;
    this.container.visible = false;
    this._onConfirm = null;
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

    // Enter — execute selected action
    if (event.name === "return") {
      if (this._selectedButton === "confirm") {
        this.doConfirm();
      } else {
        this.doCancel();
      }
      return true;
    }

    // Left/Right or Tab — switch between buttons
    if (event.name === "left" || event.name === "right" || event.name === "tab") {
      this._selectedButton = this._selectedButton === "confirm" ? "cancel" : "confirm";
      this.updateButtonHighlight();
      return true;
    }

    // y key — confirm
    if (event.name === "y" && !event.ctrl && !event.meta) {
      this.doConfirm();
      return true;
    }

    // n key — cancel
    if (event.name === "n" && !event.ctrl && !event.meta) {
      this.doCancel();
      return true;
    }

    return true; // Consume all other keys while dialog is open
  }

  /** Clean up */
  destroy(): void {
    this.container.destroyRecursively();
  }

  // ── Internal ────────────────────────────────────────────────────

  private doConfirm(): void {
    const callback = this._onConfirm;
    this.hide();
    callback?.();
  }

  private doCancel(): void {
    const callback = this._onCancel;
    this.hide();
    callback?.();
  }

  private updateButtonHighlight(): void {
    const confirmSelected = this._selectedButton === "confirm";
    this.confirmBtn.content = confirmSelected ? `>[${this._confirmLabel}]` : ` [${this._confirmLabel}]`;
    this.cancelBtn.content = !confirmSelected ? `>[${this._cancelLabel}]` : ` [${this._cancelLabel}]`;
  }
}

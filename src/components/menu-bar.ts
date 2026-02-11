// src/components/menu-bar.ts — Menu bar component with dropdown menus

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { BoxRenderable, TextRenderable } from "@opentui/core";

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

export interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

export interface Menu {
  id: string;
  label: string;
  items: MenuItem[];
}

type MenuBarState = "closed" | "bar-focused" | "dropdown-open";

// ── Constants ──────────────────────────────────────────────────────

const DROPDOWN_WIDTH = 30;

// ── MenuBar Component ──────────────────────────────────────────────

export class MenuBar {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private barRow: BoxRenderable;
  private menuLabels: TextRenderable[] = [];
  private dropdown: BoxRenderable;
  private dropdownItems: TextRenderable[] = [];

  private _menus: Menu[] = [];
  private _state: MenuBarState = "closed";
  private _activeMenuIndex = 0;
  private _activeItemIndex = 0;

  // ── Event Callbacks ─────────────────────────────────────────────

  onClose: (() => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    // Container for the entire menu bar + dropdown
    this.container = new BoxRenderable(renderer, {
      id: "menu-bar-container",
      width: "100%",
      height: 1,
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
    });

    // The actual bar row (height: 1)
    this.barRow = new BoxRenderable(renderer, {
      id: "menu-bar-row",
      width: "100%",
      height: 1,
      flexDirection: "row",
      backgroundColor: BG_SECONDARY,
    });

    this.container.add(this.barRow);

    // Dropdown overlay (absolute, hidden initially)
    this.dropdown = new BoxRenderable(renderer, {
      id: "menu-dropdown",
      position: "absolute",
      top: 1,
      left: 0,
      width: DROPDOWN_WIDTH,
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
      border: true,
      borderStyle: "rounded",
      borderColor: FG_MUTED,
      zIndex: 250,
    });
    this.dropdown.visible = false;
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Get the container renderable to add to the layout */
  get renderable(): BoxRenderable {
    return this.container;
  }

  /** Get the dropdown renderable (must be added to root for absolute positioning) */
  get dropdownRenderable(): BoxRenderable {
    return this.dropdown;
  }

  /** Whether the menu bar is currently active (bar-focused or dropdown-open) */
  get isActive(): boolean {
    return this._state !== "closed";
  }

  /** Get the current state */
  get state(): MenuBarState {
    return this._state;
  }

  /** Get the active menu index */
  get activeMenuIndex(): number {
    return this._activeMenuIndex;
  }

  /** Get the active item index */
  get activeItemIndex(): number {
    return this._activeItemIndex;
  }

  /** Set the menus and render the bar labels */
  setMenus(menus: Menu[]): void {
    this._menus = menus;
    this.renderBarLabels();
  }

  /** Open/activate the menu bar (focus on the first menu) */
  open(): void {
    this._state = "bar-focused";
    this._activeMenuIndex = 0;
    this.updateBarHighlight();
  }

  /** Close the menu bar entirely */
  close(): void {
    this._state = "closed";
    this._activeMenuIndex = 0;
    this._activeItemIndex = 0;
    this.dropdown.visible = false;
    this.updateBarHighlight();
    this.onClose?.();
  }

  /** Toggle the menu bar open/closed */
  toggle(): void {
    if (this._state === "closed") {
      this.open();
    } else {
      this.close();
    }
  }

  /** Handle keyboard events. Returns true if consumed. */
  handleKeyPress(event: KeyEvent): boolean {
    if (this._state === "closed") return false;

    // Escape — close menu
    if (event.name === "escape") {
      this.close();
      return true;
    }

    if (this._state === "bar-focused") {
      return this.handleBarKeyPress(event);
    }

    if (this._state === "dropdown-open") {
      return this.handleDropdownKeyPress(event);
    }

    return true; // Consume all keys while active
  }

  /** Clean up */
  destroy(): void {
    this.dropdown.destroyRecursively();
    this.container.destroyRecursively();
  }

  // ── Internal: Bar Navigation ────────────────────────────────────

  private handleBarKeyPress(event: KeyEvent): boolean {
    // Left — previous menu
    if (event.name === "left") {
      this._activeMenuIndex = (this._activeMenuIndex - 1 + this._menus.length) % this._menus.length;
      this.updateBarHighlight();
      return true;
    }

    // Right — next menu
    if (event.name === "right") {
      this._activeMenuIndex = (this._activeMenuIndex + 1) % this._menus.length;
      this.updateBarHighlight();
      return true;
    }

    // Enter or Down — open dropdown
    if (event.name === "return" || event.name === "down") {
      this.openDropdown();
      return true;
    }

    return true; // Consume all keys while bar-focused
  }

  // ── Internal: Dropdown Navigation ───────────────────────────────

  private handleDropdownKeyPress(event: KeyEvent): boolean {
    const menu = this._menus[this._activeMenuIndex];
    if (!menu) return true;

    // Up — move item selection up
    if (event.name === "up") {
      this._activeItemIndex = (this._activeItemIndex - 1 + menu.items.length) % menu.items.length;
      this.updateDropdownHighlight();
      return true;
    }

    // Down — move item selection down
    if (event.name === "down") {
      this._activeItemIndex = (this._activeItemIndex + 1) % menu.items.length;
      this.updateDropdownHighlight();
      return true;
    }

    // Left — switch to previous menu dropdown
    if (event.name === "left") {
      this._activeMenuIndex = (this._activeMenuIndex - 1 + this._menus.length) % this._menus.length;
      this.updateBarHighlight();
      this.openDropdown();
      return true;
    }

    // Right — switch to next menu dropdown
    if (event.name === "right") {
      this._activeMenuIndex = (this._activeMenuIndex + 1) % this._menus.length;
      this.updateBarHighlight();
      this.openDropdown();
      return true;
    }

    // Enter — execute selected item
    if (event.name === "return") {
      const item = menu.items[this._activeItemIndex];
      if (item) {
        this.close();
        item.action();
      }
      return true;
    }

    return true; // Consume all keys while dropdown is open
  }

  // ── Internal: Rendering ─────────────────────────────────────────

  private renderBarLabels(): void {
    // Clear existing labels
    for (const label of this.menuLabels) {
      this.barRow.remove(label.id);
      label.destroy();
    }
    this.menuLabels = [];

    // Create label for each menu
    for (let i = 0; i < this._menus.length; i++) {
      const menu = this._menus[i]!;
      const label = new TextRenderable(this.renderer, {
        id: `menu-label-${i}`,
        content: ` ${menu.label} `,
        fg: FG_PRIMARY,
        width: menu.label.length + 2,
        height: 1,
      });
      this.barRow.add(label);
      this.menuLabels.push(label);
    }

    // Add spacer to fill remaining width
    const spacer = new TextRenderable(this.renderer, {
      id: "menu-bar-spacer",
      content: "",
      fg: FG_SECONDARY,
      flexGrow: 1,
    });
    this.barRow.add(spacer);
    this.menuLabels.push(spacer);
  }

  private updateBarHighlight(): void {
    for (let i = 0; i < this._menus.length; i++) {
      const label = this.menuLabels[i];
      if (!label) continue;

      if (this._state !== "closed" && i === this._activeMenuIndex) {
        label.fg = ACCENT;
        label.bg = BG_HIGHLIGHT;
      } else {
        label.fg = FG_PRIMARY;
        label.bg = undefined;
      }
    }
  }

  private openDropdown(): void {
    this._state = "dropdown-open";
    this._activeItemIndex = 0;

    const menu = this._menus[this._activeMenuIndex];
    if (!menu) return;

    // Position dropdown below the active menu label
    let leftOffset = 0;
    for (let i = 0; i < this._activeMenuIndex; i++) {
      const m = this._menus[i]!;
      leftOffset += m.label.length + 2;
    }
    this.dropdown.left = leftOffset;

    // Render dropdown items
    this.renderDropdownItems(menu);
    this.dropdown.visible = true;
  }

  private renderDropdownItems(menu: Menu): void {
    // Clear existing items
    for (const item of this.dropdownItems) {
      this.dropdown.remove(item.id);
      item.destroy();
    }
    this.dropdownItems = [];

    // Set dropdown height: items + border
    this.dropdown.height = menu.items.length + 2;

    for (let i = 0; i < menu.items.length; i++) {
      const menuItem = menu.items[i]!;
      const isSelected = i === this._activeItemIndex;
      const content = this.formatDropdownItem(menuItem, isSelected);

      const row = new TextRenderable(this.renderer, {
        id: `menu-dropdown-item-${i}`,
        content,
        fg: isSelected ? ACCENT : FG_PRIMARY,
        bg: isSelected ? BG_SELECTION : undefined,
        width: DROPDOWN_WIDTH - 2, // account for border
        height: 1,
      });

      this.dropdown.add(row);
      this.dropdownItems.push(row);
    }
  }

  private updateDropdownHighlight(): void {
    const menu = this._menus[this._activeMenuIndex];
    if (!menu) return;

    for (let i = 0; i < this.dropdownItems.length; i++) {
      const row = this.dropdownItems[i];
      const menuItem = menu.items[i];
      if (!row || !menuItem) continue;

      const isSelected = i === this._activeItemIndex;
      row.content = this.formatDropdownItem(menuItem, isSelected);
      row.fg = isSelected ? ACCENT : FG_PRIMARY;
      row.bg = isSelected ? BG_SELECTION : undefined;
    }
  }

  private formatDropdownItem(item: MenuItem, isSelected: boolean): string {
    const marker = isSelected ? ">" : " ";
    const shortcutText = item.shortcut ?? "";
    const availableWidth = DROPDOWN_WIDTH - 5 - shortcutText.length;
    const paddedLabel = item.label.substring(0, availableWidth).padEnd(availableWidth);
    return `${marker} ${paddedLabel} ${shortcutText}`;
  }
}

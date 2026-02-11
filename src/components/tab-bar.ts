// src/components/tab-bar.ts — Tab bar component for open files

import type { CliRenderer } from "@opentui/core";
import { BoxRenderable, TextRenderable } from "@opentui/core";

import type { TabState } from "../services/tab-manager.ts";
import {
  BG_PRIMARY,
  BG_SECONDARY,
  FG_PRIMARY,
  FG_SECONDARY,
  ACCENT,
} from "../theme.ts";

// ── TabBar Component ───────────────────────────────────────────────

export class TabBar {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private tabElements: Map<string, BoxRenderable> = new Map();
  private emptyText: TextRenderable;
  private _activeTabId: string | null = null;

  // ── Event Callbacks ─────────────────────────────────────────────

  onTabClick: ((id: string) => void) | null = null;
  onTabClose: ((id: string) => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    this.container = new BoxRenderable(renderer, {
      id: "tab-bar-container",
      width: "100%",
      height: 1,
      flexDirection: "row",
      backgroundColor: BG_SECONDARY,
    });

    this.emptyText = new TextRenderable(renderer, {
      id: "tab-bar-empty",
      content: " No files open",
      fg: FG_SECONDARY,
      width: "100%",
    });
    this.container.add(this.emptyText);
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Get the container renderable to add to the layout */
  get renderable(): BoxRenderable {
    return this.container;
  }

  /** Render the tab bar with the given tabs and active tab ID */
  render(tabs: TabState[], activeId: string | null): void {
    this._activeTabId = activeId;

    // Remove all existing tab elements
    for (const [id, el] of this.tabElements) {
      this.container.remove(el.id);
      el.destroyRecursively();
    }
    this.tabElements.clear();

    // Show empty text if no tabs
    if (tabs.length === 0) {
      this.emptyText.visible = true;
      return;
    }

    this.emptyText.visible = false;

    // Create tab elements
    for (const tab of tabs) {
      const isActive = tab.id === activeId;
      const modifiedDot = tab.isModified ? "● " : "";
      const label = ` ${modifiedDot}${tab.title} `;

      const tabBox = new BoxRenderable(this.renderer, {
        id: `tab-${tab.id}`,
        flexDirection: "row",
        backgroundColor: isActive ? BG_PRIMARY : BG_SECONDARY,
      });

      const tabText = new TextRenderable(this.renderer, {
        id: `tab-text-${tab.id}`,
        content: label,
        fg: isActive ? ACCENT : FG_SECONDARY,
      });

      // Separator between tabs
      const separator = new TextRenderable(this.renderer, {
        id: `tab-sep-${tab.id}`,
        content: "│",
        fg: FG_SECONDARY,
      });

      tabBox.add(tabText);
      tabBox.add(separator);

      this.container.add(tabBox);
      this.tabElements.set(tab.id, tabBox);
    }
  }

  /** Get the number of rendered tab elements */
  get tabCount(): number {
    return this.tabElements.size;
  }

  /** Clean up */
  destroy(): void {
    this.container.destroyRecursively();
  }
}

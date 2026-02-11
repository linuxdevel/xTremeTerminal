// src/services/tab-manager.ts — Tab state management service (no TUI dependency)

import * as path from "node:path";

// ── Types ──────────────────────────────────────────────────────────

export interface TabState {
  id: string;
  filePath: string | null;
  title: string;
  isModified: boolean;
  cursorLine: number;
  cursorColumn: number;
  scrollTop: number;
  language: string | null;
  content: string;
}

// ── TabManager ─────────────────────────────────────────────────────

let nextId = 1;

function generateTabId(): string {
  return `tab-${nextId++}`;
}

export class TabManager {
  private tabs: TabState[] = [];
  private activeTabId: string | null = null;
  private untitledCounter = 0;

  // ── Event Callbacks ─────────────────────────────────────────────

  onTabChange: ((tab: TabState) => void) | null = null;
  onTabClose: ((tab: TabState) => void) | null = null;
  onTabListChange: ((tabs: TabState[]) => void) | null = null;

  // ── Tab Operations ──────────────────────────────────────────────

  /** Open a tab for a file. If a tab already exists for this path, switch to it. */
  openTab(filePath: string, content: string, language: string | null = null): TabState {
    // Check if a tab already exists for this file
    const existing = this.findTabByPath(filePath);
    if (existing) {
      this.switchToTab(existing.id);
      return existing;
    }

    const tab: TabState = {
      id: generateTabId(),
      filePath,
      title: path.basename(filePath),
      isModified: false,
      cursorLine: 0,
      cursorColumn: 0,
      scrollTop: 0,
      language,
      content,
    };

    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.onTabListChange?.(this.tabs);
    this.onTabChange?.(tab);
    return tab;
  }

  /** Close a tab by ID. Returns the next active tab, or null if no tabs remain. */
  closeTab(id: string): TabState | null {
    const index = this.tabs.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const closedTab = this.tabs[index]!;
    this.tabs.splice(index, 1);
    this.onTabClose?.(closedTab);

    if (this.tabs.length === 0) {
      this.activeTabId = null;
      this.onTabListChange?.(this.tabs);
      return null;
    }

    // If we closed the active tab, switch to an adjacent one
    if (this.activeTabId === id) {
      const newIndex = Math.min(index, this.tabs.length - 1);
      const nextTab = this.tabs[newIndex]!;
      this.activeTabId = nextTab.id;
      this.onTabListChange?.(this.tabs);
      this.onTabChange?.(nextTab);
      return nextTab;
    }

    this.onTabListChange?.(this.tabs);
    return this.getActiveTab();
  }

  /** Switch to a tab by ID. */
  switchToTab(id: string): TabState | null {
    const tab = this.getTab(id);
    if (!tab) return null;

    if (this.activeTabId !== id) {
      this.activeTabId = id;
      this.onTabChange?.(tab);
    }
    return tab;
  }

  /** Switch to the next tab (wraps around). */
  nextTab(): TabState | null {
    if (this.tabs.length <= 1) return this.getActiveTab();

    const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
    const nextIndex = (currentIndex + 1) % this.tabs.length;
    const tab = this.tabs[nextIndex]!;
    this.activeTabId = tab.id;
    this.onTabChange?.(tab);
    return tab;
  }

  /** Switch to the previous tab (wraps around). */
  previousTab(): TabState | null {
    if (this.tabs.length <= 1) return this.getActiveTab();

    const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
    const prevIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    const tab = this.tabs[prevIndex]!;
    this.activeTabId = tab.id;
    this.onTabChange?.(tab);
    return tab;
  }

  /** Create a new untitled tab. */
  newUntitledTab(): TabState {
    this.untitledCounter++;
    const title = this.untitledCounter === 1 ? "Untitled" : `Untitled-${this.untitledCounter}`;

    const tab: TabState = {
      id: generateTabId(),
      filePath: null,
      title,
      isModified: false,
      cursorLine: 0,
      cursorColumn: 0,
      scrollTop: 0,
      language: null,
      content: "",
    };

    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.onTabListChange?.(this.tabs);
    this.onTabChange?.(tab);
    return tab;
  }

  // ── State Management ────────────────────────────────────────────

  /** Update the content for a tab. */
  updateTabContent(id: string, content: string): void {
    const tab = this.getTab(id);
    if (tab) {
      tab.content = content;
    }
  }

  /** Update cursor position for a tab. */
  updateTabCursor(id: string, line: number, col: number): void {
    const tab = this.getTab(id);
    if (tab) {
      tab.cursorLine = line;
      tab.cursorColumn = col;
    }
  }

  /** Update scroll position for a tab. */
  updateTabScroll(id: string, scrollTop: number): void {
    const tab = this.getTab(id);
    if (tab) {
      tab.scrollTop = scrollTop;
    }
  }

  /** Mark a tab as modified or not. */
  markModified(id: string, modified: boolean): void {
    const tab = this.getTab(id);
    if (tab && tab.isModified !== modified) {
      tab.isModified = modified;
      this.onTabListChange?.(this.tabs);
    }
  }

  /** Rename a tab (e.g., after Save As). */
  renameTab(id: string, newPath: string): void {
    const tab = this.getTab(id);
    if (tab) {
      tab.filePath = newPath;
      tab.title = path.basename(newPath);
      this.onTabListChange?.(this.tabs);
    }
  }

  // ── Queries ─────────────────────────────────────────────────────

  /** Get the currently active tab. */
  getActiveTab(): TabState | null {
    if (!this.activeTabId) return null;
    return this.getTab(this.activeTabId);
  }

  /** Get a tab by ID. */
  getTab(id: string): TabState | null {
    return this.tabs.find((t) => t.id === id) ?? null;
  }

  /** Get all tabs in order. */
  getAllTabs(): TabState[] {
    return [...this.tabs];
  }

  /** Find a tab by file path. */
  findTabByPath(filePath: string): TabState | null {
    return this.tabs.find((t) => t.filePath === filePath) ?? null;
  }

  /** Check if any tabs have unsaved changes. */
  hasUnsavedTabs(): boolean {
    return this.tabs.some((t) => t.isModified);
  }

  /** Get the active tab ID. */
  get activeId(): string | null {
    return this.activeTabId;
  }

  /** Get the number of open tabs. */
  get tabCount(): number {
    return this.tabs.length;
  }
}

// src/app.ts — Main application orchestrator

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { createCliRenderer } from "@opentui/core";

import { Layout } from "./components/layout.ts";
import { FileTree } from "./components/file-tree.ts";
import { Editor } from "./components/editor.ts";
import { TabBar } from "./components/tab-bar.ts";
import { TabManager } from "./services/tab-manager.ts";
import type { TabState } from "./services/tab-manager.ts";
import {
  matchesBinding,
  KB_TOGGLE_SIDEBAR,
  KB_QUIT,
  KB_FOCUS_TREE,
  KB_FOCUS_EDITOR,
  KB_SAVE,
  KB_NEXT_TAB,
  KB_PREV_TAB,
  KB_CLOSE_TAB,
  KB_NEW_FILE,
} from "./keybindings.ts";
import { BG_PRIMARY } from "./theme.ts";
import { fileService } from "./services/file-service.ts";
import { detectLanguage } from "./utils/language-detect.ts";

export interface AppOptions {
  /** Custom renderer (for testing) */
  renderer?: CliRenderer;
  /** Directory to open (defaults to cwd) */
  rootDir?: string;
}

type FocusTarget = "tree" | "editor";

export class App {
  private renderer!: CliRenderer;
  private layout!: Layout;
  private fileTree!: FileTree;
  private editor!: Editor;
  private tabBar!: TabBar;
  private tabManager!: TabManager;
  private _isRunning = false;
  private _focus: FocusTarget = "tree";

  /** Create and start the application */
  async start(options: AppOptions = {}): Promise<void> {
    const rootDir = options.rootDir ?? process.cwd();

    // Create or use provided renderer
    if (options.renderer) {
      this.renderer = options.renderer;
    } else {
      this.renderer = await createCliRenderer({
        exitOnCtrlC: false,
        useAlternateScreen: true,
        backgroundColor: BG_PRIMARY,
      });
    }

    // Create layout and mount it
    this.layout = new Layout(this.renderer);
    this.layout.mount();

    // Create tab manager
    this.tabManager = new TabManager();

    // Create and mount tab bar (replaces the tab bar placeholder in layout)
    this.tabBar = new TabBar(this.renderer);
    this.layout.replaceTabBarContent(this.tabBar.renderable);

    // Create and mount file tree
    this.fileTree = new FileTree(this.renderer, rootDir);
    this.layout.replaceSidebarContent(this.fileTree.renderable);

    // Create and mount editor
    this.editor = new Editor(this.renderer);
    this.layout.replaceEditorContent(this.editor.renderable);

    // Wire up tab manager events
    this.tabManager.onTabChange = (tab: TabState) => {
      this.switchToTab(tab);
    };

    this.tabManager.onTabListChange = (tabs: TabState[]) => {
      this.tabBar.render(tabs, this.tabManager.activeId);
    };

    // Wire up file tree events
    this.fileTree.onFileSelect = (filePath: string) => {
      this.openFile(filePath);
    };

    // Wire up editor events
    this.editor.onModifiedChange = (modified: boolean) => {
      const activeTab = this.tabManager.getActiveTab();
      if (activeTab) {
        this.tabManager.markModified(activeTab.id, modified);
      }
      this.updateStatusBar();
    };

    this.editor.onCursorChange = (line: number, col: number) => {
      const activeTab = this.tabManager.getActiveTab();
      if (activeTab) {
        this.tabManager.updateTabCursor(activeTab.id, line, col);
      }
      this.updateStatusBar();
    };

    this.editor.onSave = (path: string) => {
      const fileName = path.split("/").pop() ?? path;
      this.layout.setStatusText(` Saved: ${fileName}`);
    };

    // Load the file tree
    await this.fileTree.load();

    // Wire up keyboard handler
    this.renderer.keyInput.on("keypress", this.handleKeyPress.bind(this));

    // Wire up resize handler
    this.renderer.on("resize", this.handleResize.bind(this));

    this._isRunning = true;
    this.updateStatusBar();
  }

  /** Open a file in the editor (creates a tab or switches to existing) */
  private async openFile(filePath: string): Promise<void> {
    // Check if a tab already exists for this file
    const existing = this.tabManager.findTabByPath(filePath);
    if (existing) {
      this.tabManager.switchToTab(existing.id);
      this.setFocus("editor");
      return;
    }

    // Check if it's a text file first
    const isText = await fileService.isTextFile(filePath);
    if (!isText) {
      this.layout.setStatusText(` Cannot open binary file`);
      return;
    }

    // Load the file into the editor
    const success = await this.editor.loadFile(filePath);
    if (success) {
      // Save current tab content before creating new tab
      this.saveActiveTabState();

      // Create a new tab
      const content = this.editor.content;
      const language = this.editor.language;
      this.tabManager.openTab(filePath, content, language);
      this.setFocus("editor");
      this.updateStatusBar();
    } else {
      this.layout.setStatusText(` Failed to open file`);
    }
  }

  /** Switch the editor to display a tab's content */
  private async switchToTab(tab: TabState): Promise<void> {
    // Save current editor state to the previously active tab
    // (the tab manager has already switched activeTabId)

    await this.editor.swapContent(
      tab.filePath,
      tab.content,
      tab.language,
      tab.cursorLine,
      tab.cursorColumn,
    );

    if (tab.isModified) {
      // Re-apply the modified state after swap (swapContent resets it)
      this.editor.onModifiedChange = null; // Temporarily suppress
      // The modified state is tracked in the TabManager, not the editor
    }

    this.editor.onModifiedChange = (modified: boolean) => {
      const activeTab = this.tabManager.getActiveTab();
      if (activeTab) {
        this.tabManager.markModified(activeTab.id, modified);
      }
      this.updateStatusBar();
    };

    this.updateStatusBar();
  }

  /** Save the current editor state to the active tab */
  private saveActiveTabState(): void {
    const activeTab = this.tabManager.getActiveTab();
    if (activeTab) {
      this.tabManager.updateTabContent(activeTab.id, this.editor.content);
      this.tabManager.updateTabCursor(
        activeTab.id,
        this.editor.cursorLine,
        this.editor.cursorColumn,
      );
    }
  }

  private handleKeyPress(event: KeyEvent): void {
    // Quit
    if (matchesBinding(event, KB_QUIT)) {
      event.preventDefault();
      this.quit();
      return;
    }

    // Also handle Ctrl+C as quit
    if (event.ctrl && event.name === "c") {
      event.preventDefault();
      this.quit();
      return;
    }

    // Save file
    if (matchesBinding(event, KB_SAVE)) {
      event.preventDefault();
      this.saveCurrentFile();
      return;
    }

    // Toggle sidebar
    if (matchesBinding(event, KB_TOGGLE_SIDEBAR)) {
      event.preventDefault();
      this.layout.toggleSidebar();
      return;
    }

    // Focus switching
    if (matchesBinding(event, KB_FOCUS_TREE)) {
      event.preventDefault();
      this.setFocus("tree");
      return;
    }

    if (matchesBinding(event, KB_FOCUS_EDITOR)) {
      event.preventDefault();
      this.setFocus("editor");
      return;
    }

    // Tab navigation
    if (matchesBinding(event, KB_PREV_TAB)) {
      event.preventDefault();
      this.saveActiveTabState();
      this.tabManager.previousTab();
      return;
    }

    if (matchesBinding(event, KB_NEXT_TAB)) {
      event.preventDefault();
      this.saveActiveTabState();
      this.tabManager.nextTab();
      return;
    }

    // Close tab
    if (matchesBinding(event, KB_CLOSE_TAB)) {
      event.preventDefault();
      this.closeCurrentTab();
      return;
    }

    // New file
    if (matchesBinding(event, KB_NEW_FILE)) {
      event.preventDefault();
      this.newUntitledTab();
      return;
    }

    // Delegate to focused component
    if (this._focus === "tree") {
      if (this.fileTree.handleKeyPress(event)) {
        event.preventDefault();
      }
    } else if (this._focus === "editor") {
      if (this.editor.handleKeyPress(event)) {
        event.preventDefault();
        // Update tab content after edits
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab) {
          this.tabManager.updateTabContent(activeTab.id, this.editor.content);
        }
      }
    }
  }

  /** Save the current file */
  private async saveCurrentFile(): Promise<void> {
    if (!this.editor.hasFile) {
      this.layout.setStatusText(` No file to save`);
      return;
    }

    const success = await this.editor.saveFile();
    if (success) {
      const activeTab = this.tabManager.getActiveTab();
      if (activeTab) {
        this.tabManager.markModified(activeTab.id, false);
        this.tabManager.updateTabContent(activeTab.id, this.editor.content);
      }
    } else {
      this.layout.setStatusText(` Failed to save file`);
    }
  }

  /** Close the current tab */
  private async closeCurrentTab(): Promise<void> {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    // For now, close without confirmation (Phase 7/8 will add unsaved prompts)
    const nextTab = this.tabManager.closeTab(activeTab.id);
    if (nextTab) {
      // switchToTab is called via the onTabChange callback
    } else {
      // No more tabs — show welcome screen
      await this.editor.newFile();
      this.updateStatusBar();
    }
  }

  /** Create a new untitled tab */
  private async newUntitledTab(): Promise<void> {
    this.saveActiveTabState();
    await this.editor.newFile();
    this.tabManager.newUntitledTab();
    this.setFocus("editor");
    this.updateStatusBar();
  }

  /** Update the status bar with current editor state */
  private updateStatusBar(): void {
    const state = this.editor.state;

    if (state.filePath) {
      const fileName = state.filePath.split("/").pop() ?? state.filePath;
      const modifiedMark = state.isModified ? " [modified]" : "";
      const langStr = state.language ? ` | ${state.language}` : "";
      const cursorStr = ` Ln ${state.cursorLine + 1}, Col ${state.cursorColumn + 1}`;
      const tabCount = this.tabManager.tabCount;
      const tabStr = tabCount > 1 ? ` | Tab ${this.getActiveTabIndex() + 1}/${tabCount}` : "";
      this.layout.setStatusText(` ${fileName}${modifiedMark}${langStr} ${cursorStr}${tabStr}`);
    } else if (this.tabManager.tabCount > 0) {
      const activeTab = this.tabManager.getActiveTab();
      const title = activeTab?.title ?? "Untitled";
      this.layout.setStatusText(` ${title}`);
    } else {
      this.layout.setStatusText(` xTerm — Ctrl+Q to quit`);
    }
  }

  /** Get the 0-based index of the active tab */
  private getActiveTabIndex(): number {
    const tabs = this.tabManager.getAllTabs();
    const activeId = this.tabManager.activeId;
    return tabs.findIndex((t) => t.id === activeId);
  }

  private handleResize(_width: number, _height: number): void {
    // Yoga layout handles the resize automatically since we use
    // percentage-based and flexGrow sizing.
  }

  /** Set the current focus target */
  setFocus(target: FocusTarget): void {
    const oldFocus = this._focus;
    this._focus = target;

    // Update component focus states
    if (target === "editor") {
      this.editor.focus();
    } else {
      this.editor.blur();
    }
  }

  /** Get the current focus target */
  get focus(): FocusTarget {
    return this._focus;
  }

  /** Quit the application cleanly */
  quit(): void {
    this._isRunning = false;
    this.editor.destroy();
    this.tabBar.destroy();
    this.fileTree.destroy();
    this.layout.destroy();
    this.renderer.destroy();
  }

  /** Whether the app is currently running */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /** Access the layout (for testing and component integration) */
  getLayout(): Layout {
    return this.layout;
  }

  /** Access the file tree (for testing) */
  getFileTree(): FileTree {
    return this.fileTree;
  }

  /** Access the editor (for testing) */
  getEditor(): Editor {
    return this.editor;
  }

  /** Access the tab manager (for testing) */
  getTabManager(): TabManager {
    return this.tabManager;
  }

  /** Access the tab bar (for testing) */
  getTabBar(): TabBar {
    return this.tabBar;
  }

  /** Access the renderer (for testing) */
  getRenderer(): CliRenderer {
    return this.renderer;
  }
}

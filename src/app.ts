// src/app.ts — Main application orchestrator

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { createCliRenderer } from "@opentui/core";

import { Layout } from "./components/layout.ts";
import { FileTree } from "./components/file-tree.ts";
import { Editor } from "./components/editor.ts";
import { TabBar } from "./components/tab-bar.ts";
import { StatusBar } from "./components/status-bar.ts";
import { SearchDialog } from "./components/search-dialog.ts";
import { ConfirmDialog } from "./components/confirm-dialog.ts";
import { CommandPalette } from "./components/command-palette.ts";
import type { Command } from "./components/command-palette.ts";
import { MenuBar } from "./components/menu-bar.ts";
import type { Menu } from "./components/menu-bar.ts";
import { HelpDialog } from "./components/help-dialog.ts";
import { AboutDialog } from "./components/about-dialog.ts";
import { TabManager } from "./services/tab-manager.ts";
import type { TabState } from "./services/tab-manager.ts";
import type { FileEntry } from "./services/file-service.ts";
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
  KB_FIND,
  KB_REPLACE,
  KB_COMMAND_PALETTE,
  KB_MENU,
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

type FocusTarget = "tree" | "editor" | "search" | "confirm" | "palette" | "menu" | "help" | "about";

export class App {
  private renderer!: CliRenderer;
  private layout!: Layout;
  private fileTree!: FileTree;
  private editor!: Editor;
  private tabBar!: TabBar;
  private statusBar!: StatusBar;
  private tabManager!: TabManager;
  private searchDialog!: SearchDialog;
  private confirmDialog!: ConfirmDialog;
  private commandPalette!: CommandPalette;
  private menuBar!: MenuBar;
  private helpDialog!: HelpDialog;
  private aboutDialog!: AboutDialog;
  private _isRunning = false;
  private _focus: FocusTarget = "tree";
  private _previousFocus: FocusTarget = "editor";

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

    // Create and mount status bar (replaces the status bar placeholder in layout)
    this.statusBar = new StatusBar(this.renderer);
    this.layout.replaceStatusBarContent(this.statusBar.renderable);

    // Create search dialog (overlay, added to root)
    this.searchDialog = new SearchDialog(this.renderer);
    this.layout.root.add(this.searchDialog.renderable);

    // Create confirm dialog (overlay, added to root)
    this.confirmDialog = new ConfirmDialog(this.renderer);
    this.layout.root.add(this.confirmDialog.renderable);

    // Create command palette (overlay, added to root)
    this.commandPalette = new CommandPalette(this.renderer);
    this.layout.root.add(this.commandPalette.renderable);
    this.registerCommands();

    // Wire up command palette close event
    this.commandPalette.onClose = () => {
      this.setFocus(this._previousFocus === "palette" ? "editor" : this._previousFocus);
    };

    // Create and mount menu bar
    this.menuBar = new MenuBar(this.renderer);
    this.layout.replaceMenuBarContent(this.menuBar.renderable);
    this.layout.root.add(this.menuBar.dropdownRenderable);

    const menus: Menu[] = [
      {
        id: "file", label: "File", items: [
          { id: "file.open", label: "Open File", shortcut: "Ctrl+E", action: () => this.setFocus("tree") },
          { id: "file.save", label: "Save File", shortcut: "Ctrl+S", action: () => this.saveCurrentFile() },
          { id: "file.exit", label: "Exit", shortcut: "Ctrl+Q", action: () => this.quit() },
        ],
      },
      {
        id: "help", label: "Help", items: [
          { id: "help.search", label: "Search Docs", action: () => this.openHelp("search") },
          { id: "help.topics", label: "Help Topics", action: () => this.openHelp("topics") },
          { id: "help.about", label: "About", action: () => this.openAbout() },
        ],
      },
    ];
    this.menuBar.setMenus(menus);

    this.menuBar.onClose = () => {
      this.setFocus(this._previousFocus === "menu" ? "editor" : this._previousFocus);
    };

    // Create help dialog (overlay, added to root)
    this.helpDialog = new HelpDialog(this.renderer);
    const docsDir = rootDir + "/docs";
    this.helpDialog.setDocsDir(docsDir);
    this.layout.root.add(this.helpDialog.renderable);

    this.helpDialog.onClose = () => {
      this.setFocus(this._previousFocus === "help" ? "editor" : this._previousFocus);
    };

    // Create about dialog (overlay, added to root)
    this.aboutDialog = new AboutDialog(this.renderer);
    this.layout.root.add(this.aboutDialog.renderable);

    this.aboutDialog.onClose = () => {
      this.setFocus(this._previousFocus === "about" ? "editor" : this._previousFocus);
    };

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

    // Wire up file tree file operation events
    this.fileTree.onCreateFile = (filePath: string) => {
      this.createFileAtPath(filePath);
    };

    this.fileTree.onCreateDirectory = (dirPath: string) => {
      this.createDirectoryAtPath(dirPath);
    };

    this.fileTree.onRename = (entry) => {
      const newName = this.fileTree.pendingRenameName;
      this.fileTree.clearPendingRenameName();
      if (newName) {
        this.renameEntry(entry.path, newName);
      }
    };

    this.fileTree.onDelete = (entry) => {
      this.confirmDelete(entry);
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
      this.statusBar.showMessage(`Saved: ${fileName}`, "success");
    };

    // Wire up search dialog events
    this.searchDialog.onSearchChange = (term: string) => {
      this.performSearch(term);
    };

    this.searchDialog.onNavigate = (match, _index) => {
      this.editor.goToOffset(match.start);
      // Re-highlight with updated active index
      const matches = this.editor.findAll(this.searchDialog.searchTerm);
      this.editor.highlightSearchMatches(matches, this.searchDialog.currentMatchIndex);
    };

    this.searchDialog.onReplace = (match, replacement) => {
      this.editor.replaceRange(match.start, match.end, replacement);
      // Re-search after replacement
      this.performSearch(this.searchDialog.searchTerm);
    };

    this.searchDialog.onReplaceAll = (term, replacement) => {
      const count = this.editor.replaceAll(term, replacement);
      this.statusBar.showMessage(`Replaced ${count} occurrence${count !== 1 ? "s" : ""}`, "info");
      // Clear search after replace all
      this.editor.clearSearchHighlights();
      this.searchDialog.setMatches([]);
    };

    this.searchDialog.onClose = () => {
      this.editor.clearSearchHighlights();
      this.setFocus(this._previousFocus === "search" ? "editor" : this._previousFocus);
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
      this.statusBar.showMessage("Cannot open binary file", "warning");
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
      this.statusBar.showMessage("Failed to open file", "error");
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
    // If confirm dialog is visible, give it highest priority
    if (this.confirmDialog.isVisible) {
      if (this.confirmDialog.handleKeyPress(event)) {
        event.preventDefault();
      }
      return;
    }

    // If about dialog is visible
    if (this.aboutDialog.isVisible) {
      if (this.aboutDialog.handleKeyPress(event)) {
        event.preventDefault();
      }
      return;
    }

    // If help dialog is visible
    if (this.helpDialog.isVisible) {
      if (matchesBinding(event, KB_QUIT)) {
        event.preventDefault();
        this.helpDialog.hide();
        this.quit();
        return;
      }
      if (this.helpDialog.handleKeyPress(event)) {
        event.preventDefault();
      }
      return;
    }

    // If command palette is visible, give it high priority
    if (this.commandPalette.isVisible) {
      // Quit still works from command palette
      if (matchesBinding(event, KB_QUIT)) {
        event.preventDefault();
        this.commandPalette.hide();
        this.quit();
        return;
      }

      // Toggle palette off with same shortcut
      if (matchesBinding(event, KB_COMMAND_PALETTE)) {
        event.preventDefault();
        this.commandPalette.hide();
        return;
      }

      if (this.commandPalette.handleKeyPress(event)) {
        event.preventDefault();
      }
      return;
    }

    // If menu bar is active (bar-focused or dropdown-open)
    if (this.menuBar.isActive) {
      if (matchesBinding(event, KB_QUIT)) {
        event.preventDefault();
        this.menuBar.close();
        this.quit();
        return;
      }
      if (matchesBinding(event, KB_MENU)) {
        event.preventDefault();
        this.menuBar.close();
        return;
      }
      if (this.menuBar.handleKeyPress(event)) {
        event.preventDefault();
      }
      return;
    }

    // If search dialog is visible, give it first priority
    if (this.searchDialog.isVisible) {
      // Escape closes dialog (handled by search dialog)
      // Ctrl+F/H while search is open: toggle mode or close
      if (matchesBinding(event, KB_FIND)) {
        event.preventDefault();
        if (this.searchDialog.mode === "find") {
          this.searchDialog.hide();
        } else {
          this.searchDialog.show("find");
        }
        return;
      }
      if (matchesBinding(event, KB_REPLACE)) {
        event.preventDefault();
        if (this.searchDialog.mode === "replace") {
          this.searchDialog.hide();
        } else {
          this.searchDialog.show("replace");
        }
        return;
      }

      // Quit still works from search dialog
      if (matchesBinding(event, KB_QUIT)) {
        event.preventDefault();
        this.quit();
        return;
      }

      // Delegate to search dialog
      if (this.searchDialog.handleKeyPress(event)) {
        event.preventDefault();
      }
      return;
    }

    // Quit
    if (matchesBinding(event, KB_QUIT)) {
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

    // Find (Ctrl+F)
    if (matchesBinding(event, KB_FIND)) {
      event.preventDefault();
      this.openSearch("find");
      return;
    }

    // Find and Replace (Ctrl+H)
    if (matchesBinding(event, KB_REPLACE)) {
      event.preventDefault();
      this.openSearch("replace");
      return;
    }

    // Command Palette (Ctrl+Shift+P)
    if (matchesBinding(event, KB_COMMAND_PALETTE)) {
      event.preventDefault();
      this.openCommandPalette();
      return;
    }

    // Menu Bar (F10)
    if (matchesBinding(event, KB_MENU)) {
      event.preventDefault();
      this.openMenu();
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
        // Always refresh status bar after editor keystrokes (cursor position)
        this.updateStatusBar();
      }
    }
  }

  /** Save the current file */
  private async saveCurrentFile(): Promise<void> {
    if (!this.editor.hasFile) {
      this.statusBar.showMessage("No file to save", "warning");
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
      this.statusBar.showMessage("Failed to save file", "error");
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

  // ── File Operations ─────────────────────────────────────────────

  /** Create a new file at the given path */
  private async createFileAtPath(filePath: string): Promise<void> {
    try {
      const exists = await fileService.exists(filePath);
      if (exists) {
        this.statusBar.showMessage(`File already exists: ${filePath.split("/").pop()}`, "warning");
        return;
      }
      await fileService.createFile(filePath);
      await this.fileTree.load();
      // Open the new file in a tab
      await this.openFile(filePath);
      this.statusBar.showMessage(`Created: ${filePath.split("/").pop()}`, "success");
    } catch {
      this.statusBar.showMessage("Failed to create file", "error");
    }
  }

  /** Create a new directory at the given path */
  private async createDirectoryAtPath(dirPath: string): Promise<void> {
    try {
      const exists = await fileService.exists(dirPath);
      if (exists) {
        this.statusBar.showMessage(`Directory already exists: ${dirPath.split("/").pop()}`, "warning");
        return;
      }
      await fileService.createDirectory(dirPath);
      await this.fileTree.load();
      this.statusBar.showMessage(`Created directory: ${dirPath.split("/").pop()}`, "success");
    } catch {
      this.statusBar.showMessage("Failed to create directory", "error");
    }
  }

  /** Rename a file or directory */
  private async renameEntry(oldPath: string, newName: string): Promise<void> {
    try {
      const parts = oldPath.split("/");
      parts.pop();
      const newPath = parts.join("/") + "/" + newName;

      const exists = await fileService.exists(newPath);
      if (exists) {
        this.statusBar.showMessage(`Name already taken: ${newName}`, "warning");
        return;
      }

      await fileService.rename(oldPath, newPath);

      // Update any open tab that references the old path
      const tab = this.tabManager.findTabByPath(oldPath);
      if (tab) {
        this.tabManager.renameTab(tab.id, newPath);
      }

      await this.fileTree.load();
      this.statusBar.showMessage(`Renamed to: ${newName}`, "success");
      this.updateStatusBar();
    } catch {
      this.statusBar.showMessage("Failed to rename", "error");
    }
  }

  /** Show confirmation dialog before deleting */
  private confirmDelete(entry: FileEntry): void {
    const name = entry.name;
    const typeLabel = entry.isDirectory ? "directory" : "file";

    this.confirmDialog.show({
      title: `Delete ${typeLabel}?`,
      message: `"${name}" will be permanently deleted.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: () => {
        this.executeDelete(entry);
      },
      onCancel: () => {
        this.setFocus("tree");
      },
    });
  }

  /** Execute the delete operation */
  private async executeDelete(entry: FileEntry): Promise<void> {
    try {
      // Close any open tab for this file
      const tab = this.tabManager.findTabByPath(entry.path);
      if (tab) {
        const nextTab = this.tabManager.closeTab(tab.id);
        if (!nextTab && this.tabManager.tabCount === 0) {
          await this.editor.newFile();
        }
      }

      await fileService.delete(entry.path);
      await this.fileTree.load();
      this.statusBar.showMessage(`Deleted: ${entry.name}`, "success");
      this.setFocus("tree");
      this.updateStatusBar();
    } catch {
      this.statusBar.showMessage(`Failed to delete: ${entry.name}`, "error");
      this.setFocus("tree");
    }
  }

  /** Register all commands for the command palette */
  private registerCommands(): void {
    const commands: Command[] = [
      { id: "file.save", label: "Save File", shortcut: "Ctrl+S", category: "File", action: () => this.saveCurrentFile() },
      { id: "file.new", label: "New File", shortcut: "Ctrl+N", category: "File", action: () => this.newUntitledTab() },
      { id: "file.close", label: "Close Tab", shortcut: "Ctrl+W", category: "File", action: () => this.closeCurrentTab() },
      { id: "edit.undo", label: "Undo", shortcut: "Ctrl+Z", category: "Edit", action: () => this.editor.handleKeyPress({ name: "z", ctrl: true, shift: false, meta: false, sequence: "", preventDefault: () => {} } as any) },
      { id: "edit.redo", label: "Redo", shortcut: "Ctrl+Y", category: "Edit", action: () => this.editor.handleKeyPress({ name: "y", ctrl: true, shift: false, meta: false, sequence: "", preventDefault: () => {} } as any) },
      { id: "edit.find", label: "Find", shortcut: "Ctrl+F", category: "Edit", action: () => this.openSearch("find") },
      { id: "edit.replace", label: "Find & Replace", shortcut: "Ctrl+Shift+H", category: "Edit", action: () => this.openSearch("replace") },
      { id: "edit.selectAll", label: "Select All", shortcut: "Ctrl+A", category: "Edit", action: () => this.editor.handleKeyPress({ name: "a", ctrl: true, shift: false, meta: false, sequence: "", preventDefault: () => {} } as any) },
      { id: "view.toggleSidebar", label: "Toggle Sidebar", shortcut: "Ctrl+B", category: "View", action: () => this.layout.toggleSidebar() },
      { id: "view.commandPalette", label: "Command Palette", shortcut: "Ctrl+Shift+P", category: "View", action: () => this.openCommandPalette() },
      { id: "view.menu", label: "Menu Bar", shortcut: "F10", category: "View", action: () => this.openMenu() },
      { id: "nav.nextTab", label: "Next Tab", shortcut: "Alt+Right", category: "Navigation", action: () => { this.saveActiveTabState(); this.tabManager.nextTab(); } },
      { id: "nav.prevTab", label: "Previous Tab", shortcut: "Alt+Left", category: "Navigation", action: () => { this.saveActiveTabState(); this.tabManager.previousTab(); } },
      { id: "nav.focusTree", label: "Focus File Tree", shortcut: "Ctrl+E", category: "Navigation", action: () => this.setFocus("tree") },
      { id: "nav.focusEditor", label: "Focus Editor", shortcut: "Ctrl+G", category: "Navigation", action: () => this.setFocus("editor") },
      { id: "help.search", label: "Search Documentation", shortcut: null, category: "Help", action: () => this.openHelp("search") },
      { id: "help.topics", label: "Help Topics", shortcut: null, category: "Help", action: () => this.openHelp("topics") },
      { id: "help.about", label: "About xTremeTerminal", shortcut: null, category: "Help", action: () => this.openAbout() },
      { id: "app.quit", label: "Quit", shortcut: "Ctrl+Q", category: "Application", action: () => this.quit() },
    ];

    this.commandPalette.registerCommands(commands);
  }

  /** Open the command palette */
  private openCommandPalette(): void {
    this._previousFocus = this._focus;
    this.commandPalette.show();
    this._focus = "palette";
  }

  /** Open the menu bar */
  private openMenu(): void {
    this._previousFocus = this._focus;
    this.menuBar.open();
    this._focus = "menu";
  }

  /** Open the help dialog */
  private openHelp(mode: "search" | "topics"): void {
    this._previousFocus = this._focus;
    this.helpDialog.show(mode);
    this._focus = "help";
  }

  /** Open the about dialog */
  private openAbout(): void {
    this._previousFocus = this._focus;
    this.aboutDialog.show();
    this._focus = "about";
  }

  /** Open the search dialog */
  private openSearch(mode: "find" | "replace"): void {
    this._previousFocus = this._focus;
    this.searchDialog.show(mode);
    this.setFocus("search");

    // If the editor has a selection, pre-fill the search term
    if (this.editor.hasSelection) {
      const selectedText = this.editor.getSelectedText();
      if (selectedText && !selectedText.includes("\n")) {
        // Single-line selection only — pre-fill search
        // The search input will be populated via the InputRenderable
      }
    }
  }

  /** Perform search in the editor and update the search dialog */
  private performSearch(term: string): void {
    if (!term) {
      this.editor.clearSearchHighlights();
      this.searchDialog.setMatches([]);
      return;
    }

    const matches = this.editor.findAll(term);
    this.searchDialog.setMatches(matches);

    if (matches.length > 0) {
      // Highlight all matches
      this.editor.highlightSearchMatches(matches, this.searchDialog.currentMatchIndex);
      // Navigate to the first match
      const firstMatch = matches[this.searchDialog.currentMatchIndex]!;
      this.editor.goToOffset(firstMatch.start);
    } else {
      this.editor.clearSearchHighlights();
    }
  }

  /** Update the status bar with current editor state */
  private updateStatusBar(): void {
    const state = this.editor.state;

    if (state.filePath) {
      const fileName = state.filePath.split("/").pop() ?? state.filePath;
      const content = this.editor.content;
      const totalLines = content.split("\n").length;

      this.statusBar.update({
        filename: fileName,
        cursorLine: state.cursorLine,
        cursorColumn: state.cursorColumn,
        language: state.language,
        encoding: "UTF-8",
        indentStyle: "4 spaces",
        isModified: state.isModified,
        totalLines,
      });
    } else if (this.tabManager.tabCount > 0) {
      const activeTab = this.tabManager.getActiveTab();
      const title = activeTab?.title ?? "Untitled";
      this.statusBar.update({
        filename: title,
        cursorLine: state.cursorLine,
        cursorColumn: state.cursorColumn,
        language: null,
        encoding: "UTF-8",
        indentStyle: "4 spaces",
        isModified: false,
        totalLines: 0,
      });
    } else {
      this.statusBar.update({
        filename: null,
        cursorLine: 0,
        cursorColumn: 0,
        language: null,
        encoding: "UTF-8",
        indentStyle: "4 spaces",
        isModified: false,
        totalLines: 0,
      });
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

  /** Quit the application (with unsaved changes check) */
  quit(): void {
    const unsavedTabs = this.tabManager.getAllTabs().filter(t => t.isModified);
    if (unsavedTabs.length > 0) {
      this._previousFocus = this._focus;
      this.confirmDialog.show({
        title: "Unsaved Changes",
        message: `${unsavedTabs.length} file(s) have unsaved changes. Exit?`,
        confirmLabel: "Exit",
        cancelLabel: "Cancel",
        onConfirm: () => this.forceQuit(),
        onCancel: () => {
          this.setFocus(this._previousFocus === "confirm" ? "editor" : this._previousFocus);
        },
      });
      return;
    }
    this.forceQuit();
  }

  /** Force quit without checking for unsaved changes */
  forceQuit(): void {
    this._isRunning = false;
    this.aboutDialog.destroy();
    this.helpDialog.destroy();
    this.menuBar.destroy();
    this.commandPalette.destroy();
    this.confirmDialog.destroy();
    this.searchDialog.destroy();
    this.statusBar.destroy();
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

  /** Access the search dialog (for testing) */
  getSearchDialog(): SearchDialog {
    return this.searchDialog;
  }

  /** Access the confirm dialog (for testing) */
  getConfirmDialog(): ConfirmDialog {
    return this.confirmDialog;
  }

  /** Access the status bar (for testing) */
  getStatusBar(): StatusBar {
    return this.statusBar;
  }

  /** Access the command palette (for testing) */
  getCommandPalette(): CommandPalette {
    return this.commandPalette;
  }

  /** Access the menu bar (for testing) */
  getMenuBar(): MenuBar {
    return this.menuBar;
  }

  /** Access the help dialog (for testing) */
  getHelpDialog(): HelpDialog {
    return this.helpDialog;
  }

  /** Access the about dialog (for testing) */
  getAboutDialog(): AboutDialog {
    return this.aboutDialog;
  }

  /** Access the renderer (for testing) */
  getRenderer(): CliRenderer {
    return this.renderer;
  }
}

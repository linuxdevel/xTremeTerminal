// src/components/editor.ts — Text editor component using TextareaRenderable

import type { CliRenderer, KeyEvent, Highlight } from "@opentui/core";
import {
  BoxRenderable,
  TextRenderable,
  TextareaRenderable,
  LineNumberRenderable,
  getTreeSitterClient,
} from "@opentui/core";

import { fileService } from "../services/file-service.ts";
import { clipboard } from "../services/clipboard.ts";
import { detectLanguage } from "../utils/language-detect.ts";
import {
  BG_PRIMARY,
  BG_SECONDARY,
  FG_PRIMARY,
  FG_SECONDARY,
  FG_MUTED,
  ACCENT,
  BG_SELECTION,
  LINE_NUMBER_MIN_WIDTH,
  LINE_NUMBER_PADDING_RIGHT,
  SYNTAX_STYLE,
} from "../theme.ts";

// ── Language to Tree-sitter filetype mapping ────────────────────────
// Our language-detect.ts returns language IDs, but Tree-sitter's highlightOnce()
// expects "filetype" strings. Only a subset of languages have built-in parsers.

const LANGUAGE_TO_FILETYPE: Record<string, string> = {
  "typescript": "typescript",
  "tsx": "typescriptreact",
  "javascript": "javascript",
  "jsx": "javascriptreact",
  "markdown": "markdown",
  "zig": "zig",
  "json": "json",
  "html": "html",
  "css": "css",
  "python": "python",
  "ruby": "ruby",
  "go": "go",
  "rust": "rust",
  "c": "c",
  "cpp": "cpp",
  "java": "java",
  "bash": "shell",
  "c_sharp": "csharp",
  "kotlin": "kotlin",
  "swift": "swift",
  "php": "php",
  "sql": "sql",
  "lua": "lua",
  "elixir": "elixir",
  "erlang": "erlang",
  "yaml": "yaml",
  "toml": "toml",
  "scala": "scala",
};

/** Debounce delay for re-highlighting on content change (ms) */
const HIGHLIGHT_DEBOUNCE_MS = 150;

// ── Types ──────────────────────────────────────────────────────────

export interface EditorState {
  filePath: string | null;
  isModified: boolean;
  language: string | null;
  cursorLine: number;
  cursorColumn: number;
}

// ── Editor Component ───────────────────────────────────────────────

export class Editor {
  private renderer: CliRenderer;
  private container: BoxRenderable;
  private textarea: TextareaRenderable;
  private lineNumbers: LineNumberRenderable;
  private welcomeText: TextRenderable | null = null;

  private _filePath: string | null = null;
  private _isModified = false;
  private _language: string | null = null;
  private _cursorLine = 0;
  private _cursorColumn = 0;
  private _showingWelcome = true;
  private _suppressModifiedEvent = false;

  // Syntax highlighting state
  private _highlightTimer: ReturnType<typeof setTimeout> | null = null;
  private _highlightingEnabled = false;

  // Search highlighting state
  private _searchHighlightRef = 99; // hlRef for search match highlights
  private _currentSearchHighlightRef = 100; // hlRef for current match highlight
  private _syntaxHighlightRef = 101; // hlRef for syntax highlights

  // ── Event Callbacks ─────────────────────────────────────────────

  onModifiedChange: ((modified: boolean) => void) | null = null;
  onCursorChange: ((line: number, col: number) => void) | null = null;
  onSave: ((path: string) => void) | null = null;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;

    // Container for the editor (line numbers + textarea)
    this.container = new BoxRenderable(renderer, {
      id: "editor-container",
      width: "100%",
      height: "100%",
      flexGrow: 1,
      flexDirection: "row",
      backgroundColor: BG_PRIMARY,
    });

    // Create the textarea (editable text area)
    // Override OpenTUI's Emacs-style defaults with standard PC keybindings
    this.textarea = new TextareaRenderable(renderer, {
      id: "editor-textarea",
      width: "100%",
      height: "100%",
      flexGrow: 1,
      backgroundColor: BG_PRIMARY,
      focusedBackgroundColor: BG_PRIMARY,
      textColor: FG_PRIMARY,
      focusedTextColor: FG_PRIMARY,
      cursorColor: ACCENT,
      selectionBg: BG_SELECTION,
      wrapMode: "none",
      showCursor: true,
      syntaxStyle: SYNTAX_STYLE,
      keyBindings: [
        // Fix Home/End: go to line start/end (not file start/end)
        { name: "home", action: "line-home" },
        { name: "end", action: "line-end" },
        // Fix Shift+Home/End: select to line start/end
        { name: "home", shift: true, action: "select-line-home" },
        { name: "end", shift: true, action: "select-line-end" },
        // Add Ctrl+Home/End: go to file start/end
        { name: "home", ctrl: true, action: "buffer-home" },
        { name: "end", ctrl: true, action: "buffer-end" },
        // Add Ctrl+Shift+Home/End: select to file start/end
        { name: "home", ctrl: true, shift: true, action: "select-buffer-home" },
        { name: "end", ctrl: true, shift: true, action: "select-buffer-end" },
        // Add Ctrl+Shift+Left/Right: word selection
        { name: "left", ctrl: true, shift: true, action: "select-word-backward" },
        { name: "right", ctrl: true, shift: true, action: "select-word-forward" },
        // Fix Ctrl+A: select all (not Emacs line-home)
        { name: "a", ctrl: true, action: "select-all" },
        // Neutralize Emacs Ctrl+E (conflicts with KB_FOCUS_TREE)
        { name: "e", ctrl: true, action: "line-end" },
        // Neutralize Emacs Ctrl+F (conflicts with KB_FIND)
        { name: "f", ctrl: true, action: "move-right" },
        // Neutralize Emacs Ctrl+B (conflicts with KB_TOGGLE_SIDEBAR)
        { name: "b", ctrl: true, action: "move-left" },
        // Neutralize Emacs Ctrl+W (conflicts with KB_CLOSE_TAB)
        { name: "w", ctrl: true, action: "delete-word-backward" },
      ],
    });

    // Create line number gutter
    this.lineNumbers = new LineNumberRenderable(renderer, {
      id: "editor-line-numbers",
      target: this.textarea,
      fg: FG_MUTED,
      bg: BG_SECONDARY,
      minWidth: LINE_NUMBER_MIN_WIDTH,
      paddingRight: LINE_NUMBER_PADDING_RIGHT,
    });

    // Wire up events
    this.textarea.onContentChange = () => {
      if (!this._showingWelcome && !this._suppressModifiedEvent) {
        this.setModified(true);
        this.scheduleHighlight();
      }
    };

    this.textarea.onCursorChange = (event) => {
      this._cursorLine = event.line;
      this._cursorColumn = event.visualColumn;
      this.onCursorChange?.(this._cursorLine, this._cursorColumn);
    };

    // Assemble: line numbers then textarea
    this.container.add(this.lineNumbers);
    // textarea is added via LineNumberRenderable's target mechanism

    // Show welcome screen initially
    this._suppressModifiedEvent = true;
    this.showWelcome();
    this._suppressModifiedEvent = false;
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Get the container renderable to add to the layout */
  get renderable(): BoxRenderable {
    return this.container;
  }

  /** Get current file path */
  get currentFilePath(): string | null {
    return this._filePath;
  }

  /** Get modification state */
  get modified(): boolean {
    return this._isModified;
  }

  /** Get current content */
  get content(): string {
    return this.textarea.plainText;
  }

  /** Get cursor line (0-based) */
  get cursorLine(): number {
    return this._cursorLine;
  }

  /** Get cursor column (0-based) */
  get cursorColumn(): number {
    return this._cursorColumn;
  }

  /** Get detected language */
  get language(): string | null {
    return this._language;
  }

  /** Get the full editor state */
  get state(): EditorState {
    return {
      filePath: this._filePath,
      isModified: this._isModified,
      language: this._language,
      cursorLine: this._cursorLine,
      cursorColumn: this._cursorColumn,
    };
  }

  /** Load a file into the editor */
  async loadFile(filePath: string): Promise<boolean> {
    // Check if it's a text file
    const isText = await fileService.isTextFile(filePath);
    if (!isText) {
      return false;
    }

    // Check file size
    const sizeCheck = await fileService.checkFileSize(filePath);
    if (sizeCheck === "too-large") {
      return false;
    }

    // Read file content
    const content = await fileService.readFileContent(filePath);
    if (content === null) {
      return false;
    }

    // Suppress modified events during file loading
    this._suppressModifiedEvent = true;

    // Hide welcome screen if showing
    this.hideWelcome();

    // Set up the editor
    this._filePath = filePath;
    this._language = detectLanguage(filePath);
    this.textarea.setText(content);

    // Reset modified state after microtask (content change events are deferred)
    this._isModified = false;
    await Promise.resolve();
    this._isModified = false;
    this._suppressModifiedEvent = false;

    // Apply syntax highlighting for the loaded file
    await this.applyHighlights();

    return true;
  }

  /** Save the current file */
  async saveFile(): Promise<boolean> {
    if (!this._filePath) {
      return false;
    }

    try {
      const content = this.textarea.plainText;
      await fileService.writeFileContent(this._filePath, content);
      this.setModified(false);
      this.onSave?.(this._filePath);
      return true;
    } catch {
      return false;
    }
  }

  /** Create a new empty buffer */
  async newFile(): Promise<void> {
    this._suppressModifiedEvent = true;
    this.hideWelcome();
    this._filePath = null;
    this._language = null;
    this._highlightingEnabled = false;
    this.textarea.clearAllHighlights();
    this.textarea.setText("");
    this._isModified = false;
    await Promise.resolve();
    this._isModified = false;
    this._suppressModifiedEvent = false;
  }

  /** Handle a keyboard event. Returns true if consumed. */
  handleKeyPress(event: KeyEvent): boolean {
    // Tab inserts 4 spaces (OpenTUI ignores charCode < 32 by default)
    if (event.name === "tab" && !event.ctrl && !event.meta && !event.shift) {
      this.textarea.insertText("    ");
      this.syncCursorPosition();
      return true;
    }

    // PageUp: move cursor up by viewport height
    if (event.name === "pageup" && !event.ctrl && !event.meta) {
      const viewport = this.textarea.editorView.getViewport();
      const pageSize = Math.max(1, viewport.height - 1);
      for (let i = 0; i < pageSize; i++) {
        this.textarea.moveCursorUp({ select: event.shift });
      }
      this.syncCursorPosition();
      return true;
    }

    // PageDown: move cursor down by viewport height
    if (event.name === "pagedown" && !event.ctrl && !event.meta) {
      const viewport = this.textarea.editorView.getViewport();
      const pageSize = Math.max(1, viewport.height - 1);
      for (let i = 0; i < pageSize; i++) {
        this.textarea.moveCursorDown({ select: event.shift });
      }
      this.syncCursorPosition();
      return true;
    }

    // Intercept undo/redo (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
    if (event.ctrl && !event.meta && event.name === "z" && !event.shift) {
      this.textarea.undo();
      return true;
    }
    if (event.ctrl && !event.meta && event.name === "y" && !event.shift) {
      this.textarea.redo();
      return true;
    }
    if (event.ctrl && !event.meta && event.name === "z" && event.shift) {
      this.textarea.redo();
      return true;
    }

    // Intercept select all (Ctrl+A)
    if (event.ctrl && !event.meta && event.name === "a" && !event.shift) {
      this.textarea.selectAll();
      return true;
    }

    // Intercept copy (Ctrl+C) — only copies when there is a selection
    if (event.ctrl && !event.meta && event.name === "c" && !event.shift) {
      if (this.textarea.hasSelection()) {
        const text = this.textarea.getSelectedText();
        clipboard.copy(text);
        return true;
      }
      // No selection — consume silently (do not propagate)
      return true;
    }

    // Intercept cut (Ctrl+X)
    if (event.ctrl && !event.meta && event.name === "x" && !event.shift) {
      if (this.textarea.hasSelection()) {
        const text = this.textarea.getSelectedText();
        clipboard.cut(text);
        this.textarea.editorView.deleteSelectedText();
        return true;
      }
      return false;
    }

    // Intercept paste (Ctrl+V)
    if (event.ctrl && !event.meta && event.name === "v" && !event.shift) {
      if (clipboard.hasContent()) {
        this.textarea.insertText(clipboard.paste());
        return true;
      }
      return false;
    }

    // The TextareaRenderable handles its own key events
    const handled = this.textarea.handleKeyPress(event);
    if (handled) {
      // Sync cursor position immediately — OpenTUI's onCursorChange callback
      // does not fire for up/down movement (editorView.moveUpVisual/moveDownVisual
      // does not emit "cursor-changed" unlike editBuffer.moveCursorLeft/Right).
      this.syncCursorPosition();
    }
    return handled;
  }

  /** Focus the editor (show cursor, accept input) */
  focus(): void {
    this.textarea.focus();
  }

  /** Blur the editor (hide cursor) */
  blur(): void {
    this.textarea.blur();
  }

  /** Clean up */
  destroy(): void {
    if (this._highlightTimer) {
      clearTimeout(this._highlightTimer);
      this._highlightTimer = null;
    }
    this.container.destroyRecursively();
  }

  /** Check if a file is currently loaded */
  get hasFile(): boolean {
    return this._filePath !== null;
  }

  /** Check if welcome screen is showing */
  get isShowingWelcome(): boolean {
    return this._showingWelcome;
  }

  /** Check if syntax highlighting is active */
  get highlightingEnabled(): boolean {
    return this._highlightingEnabled;
  }

  /** Check if undo is available */
  get canUndo(): boolean {
    return this.textarea.editBuffer.canUndo();
  }

  /** Check if redo is available */
  get canRedo(): boolean {
    return this.textarea.editBuffer.canRedo();
  }

  /** Check if text is currently selected */
  get hasSelection(): boolean {
    return this.textarea.hasSelection();
  }

  /** Get the currently selected text */
  getSelectedText(): string {
    return this.textarea.getSelectedText();
  }

  /** Find all occurrences of a search term in the content */
  findAll(term: string): Array<{ start: number; end: number }> {
    if (!term) return [];

    const content = this.textarea.plainText;
    const matches: Array<{ start: number; end: number }> = [];
    const lowerTerm = term.toLowerCase();
    const lowerContent = content.toLowerCase();
    let pos = 0;

    while (pos < lowerContent.length) {
      const idx = lowerContent.indexOf(lowerTerm, pos);
      if (idx === -1) break;
      matches.push({ start: idx, end: idx + term.length });
      pos = idx + 1;
    }

    return matches;
  }

  /** Apply search match highlights to the editor */
  highlightSearchMatches(matches: Array<{ start: number; end: number }>, activeIndex: number): void {
    // Remove previous search highlights
    this.textarea.removeHighlightsByRef(this._searchHighlightRef);
    this.textarea.removeHighlightsByRef(this._currentSearchHighlightRef);

    const matchStyleId = SYNTAX_STYLE.resolveStyleId("search.match");
    const activeStyleId = SYNTAX_STYLE.resolveStyleId("search.match.active");

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]!;
      const isActive = i === activeIndex;
      const styleId = isActive ? activeStyleId : matchStyleId;
      const hlRef = isActive ? this._currentSearchHighlightRef : this._searchHighlightRef;

      if (styleId !== null) {
        this.textarea.addHighlightByCharRange({
          start: match.start,
          end: match.end,
          styleId,
          priority: 10, // Higher priority than syntax highlights
          hlRef,
        } as Highlight);
      }
    }
  }

  /** Clear all search highlights */
  clearSearchHighlights(): void {
    this.textarea.removeHighlightsByRef(this._searchHighlightRef);
    this.textarea.removeHighlightsByRef(this._currentSearchHighlightRef);
  }

  /** Navigate to a specific character offset (scrolls the view) */
  goToOffset(offset: number): void {
    this.textarea.cursorOffset = offset;
  }

  /** Replace text at a specific range */
  replaceRange(start: number, end: number, replacement: string): void {
    const content = this.textarea.plainText;
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = before + replacement + after;
    this.textarea.replaceText(newContent);

    // Position cursor after the replacement
    this.textarea.cursorOffset = start + replacement.length;
  }

  /** Replace all occurrences of a term with a replacement */
  replaceAll(term: string, replacement: string): number {
    if (!term) return 0;

    const content = this.textarea.plainText;
    const lowerTerm = term.toLowerCase();
    const lowerContent = content.toLowerCase();
    let result = "";
    let pos = 0;
    let count = 0;

    while (pos < lowerContent.length) {
      const idx = lowerContent.indexOf(lowerTerm, pos);
      if (idx === -1) {
        result += content.substring(pos);
        break;
      }
      result += content.substring(pos, idx) + replacement;
      pos = idx + term.length;
      count++;
    }

    if (count > 0) {
      this.textarea.replaceText(result);
    }

    return count;
  }

  /** Swap the editor content for tab switching (no disk I/O). */
  async swapContent(
    filePath: string | null,
    content: string,
    language: string | null,
    cursorLine: number,
    cursorColumn: number,
  ): Promise<void> {
    this._suppressModifiedEvent = true;
    this.hideWelcome();

    this._filePath = filePath;
    this._language = language;
    this._highlightingEnabled = false;
    this.textarea.clearAllHighlights();
    this.textarea.setText(content);

    // Reset modified state after microtask (content change events are deferred)
    this._isModified = false;
    await Promise.resolve();
    this._isModified = false;
    this._suppressModifiedEvent = false;

    // Restore cursor position
    if (cursorLine > 0) {
      this.textarea.gotoLine(cursorLine);
    }

    // Apply syntax highlighting
    await this.applyHighlights();
  }

  // ── Internal ────────────────────────────────────────────────────

  /** Synchronously read cursor position from the textarea's editorView.
   *  Must use editorView.getCursor() instead of editBuffer.getCursorPosition()
   *  because up/down movement goes through editorView.moveUpVisual/moveDownVisual
   *  which updates the EditorView's native cursor but does NOT sync back to the
   *  EditBuffer's native cursor. The two are separate native FFI objects. */
  private syncCursorPosition(): void {
    const cursor = this.textarea.editorView.getCursor();
    this._cursorLine = cursor.row;
    this._cursorColumn = cursor.col;
    this.onCursorChange?.(this._cursorLine, this._cursorColumn);
  }

  private setModified(modified: boolean): void {
    if (this._isModified !== modified) {
      this._isModified = modified;
      this.onModifiedChange?.(modified);
    }
  }

  /** Get the Tree-sitter filetype for the current language */
  private getFiletype(): string | null {
    if (!this._language) return null;
    return LANGUAGE_TO_FILETYPE[this._language] ?? null;
  }

  /** Schedule a debounced re-highlight after content changes */
  private scheduleHighlight(): void {
    if (!this._highlightingEnabled) return;

    if (this._highlightTimer) {
      clearTimeout(this._highlightTimer);
    }

    this._highlightTimer = setTimeout(() => {
      this._highlightTimer = null;
      this.applyHighlights().catch(() => {
        // Silently ignore highlight errors during editing
      });
    }, HIGHLIGHT_DEBOUNCE_MS);
  }

  /** Apply syntax highlights to the textarea using Tree-sitter */
  private async applyHighlights(): Promise<void> {
    const filetype = this.getFiletype();
    if (!filetype) {
      this._highlightingEnabled = false;
      this.textarea.removeHighlightsByRef(this._syntaxHighlightRef);
      return;
    }

    const content = this.textarea.plainText;
    if (!content) {
      this.textarea.removeHighlightsByRef(this._syntaxHighlightRef);
      return;
    }

    try {
      const client = getTreeSitterClient();
      const result = await client.highlightOnce(content, filetype);

      if (!result.highlights || result.highlights.length === 0) {
        this._highlightingEnabled = false;
        return;
      }

      // Clear only syntax highlights (preserve search highlights)
      this.textarea.removeHighlightsByRef(this._syntaxHighlightRef);

      // Apply each highlight from Tree-sitter
      for (const hl of result.highlights) {
        const [start, end, group] = hl;
        const styleId = SYNTAX_STYLE.resolveStyleId(group);
        if (styleId !== null) {
          this.textarea.addHighlightByCharRange({
            start,
            end,
            styleId,
            hlRef: this._syntaxHighlightRef,
          } as Highlight);
        }
      }

      this._highlightingEnabled = true;
    } catch {
      // Tree-sitter not available or parsing failed — disable highlighting
      this._highlightingEnabled = false;
    }
  }

  private showWelcome(): void {
    this._showingWelcome = true;
    this.textarea.visible = false;
    this.lineNumbers.visible = false;

    this.welcomeText = new TextRenderable(this.renderer, {
      id: "editor-welcome",
      content: " xTerm - Terminal Text Editor\n\n Open a file from the sidebar to start editing\n\n Ctrl+E  Focus file tree\n Ctrl+G  Focus editor\n Ctrl+B  Toggle sidebar\n Ctrl+S  Save file\n Ctrl+Q  Quit",
      fg: FG_SECONDARY,
      width: "100%",
      flexGrow: 1,
    });
    this.container.add(this.welcomeText);
  }

  private hideWelcome(): void {
    if (!this._showingWelcome) return;
    this._showingWelcome = false;

    if (this.welcomeText) {
      this.container.remove(this.welcomeText.id);
      this.welcomeText.destroy();
      this.welcomeText = null;
    }

    this.textarea.visible = true;
    this.lineNumbers.visible = true;
  }
}

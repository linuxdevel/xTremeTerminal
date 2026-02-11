// src/components/editor.ts — Text editor component using TextareaRenderable

import type { CliRenderer, KeyEvent } from "@opentui/core";
import {
  BoxRenderable,
  TextRenderable,
  TextareaRenderable,
  LineNumberRenderable,
} from "@opentui/core";

import { fileService } from "../services/file-service.ts";
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
} from "../theme.ts";

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
    this.textarea.setText("");
    this._isModified = false;
    await Promise.resolve();
    this._isModified = false;
    this._suppressModifiedEvent = false;
  }

  /** Handle a keyboard event. Returns true if consumed. */
  handleKeyPress(event: KeyEvent): boolean {
    // The TextareaRenderable handles its own key events
    return this.textarea.handleKeyPress(event);
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

  // ── Internal ────────────────────────────────────────────────────

  private setModified(modified: boolean): void {
    if (this._isModified !== modified) {
      this._isModified = modified;
      this.onModifiedChange?.(modified);
    }
  }

  private showWelcome(): void {
    this._showingWelcome = true;
    this.textarea.visible = false;
    this.lineNumbers.visible = false;

    this.welcomeText = new TextRenderable(this.renderer, {
      id: "editor-welcome",
      content: " xTerm - Terminal Text Editor\n\n Open a file from the sidebar to start editing\n\n Ctrl+E  Focus file tree\n Ctrl+1  Focus editor\n Ctrl+B  Toggle sidebar\n Ctrl+S  Save file\n Ctrl+Q  Quit",
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

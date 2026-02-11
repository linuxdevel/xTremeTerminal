// src/app.ts — Main application orchestrator

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { createCliRenderer } from "@opentui/core";

import { Layout } from "./components/layout.ts";
import { FileTree } from "./components/file-tree.ts";
import { Editor } from "./components/editor.ts";
import {
  matchesBinding,
  KB_TOGGLE_SIDEBAR,
  KB_QUIT,
  KB_FOCUS_TREE,
  KB_FOCUS_EDITOR,
  KB_SAVE,
} from "./keybindings.ts";
import { BG_PRIMARY } from "./theme.ts";
import { fileService } from "./services/file-service.ts";

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

    // Create and mount file tree
    this.fileTree = new FileTree(this.renderer, rootDir);
    this.layout.replaceSidebarContent(this.fileTree.renderable);

    // Create and mount editor
    this.editor = new Editor(this.renderer);
    this.layout.replaceEditorContent(this.editor.renderable);

    // Wire up file tree events
    this.fileTree.onFileSelect = (filePath: string) => {
      this.openFile(filePath);
    };

    // Wire up editor events
    this.editor.onModifiedChange = (modified: boolean) => {
      this.updateStatusBar();
    };

    this.editor.onCursorChange = (line: number, col: number) => {
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

  /** Open a file in the editor */
  private async openFile(filePath: string): Promise<void> {
    // Check if it's a text file first
    const isText = await fileService.isTextFile(filePath);
    if (!isText) {
      this.layout.setStatusText(` Cannot open binary file`);
      return;
    }

    const success = await this.editor.loadFile(filePath);
    if (success) {
      this.setFocus("editor");
      this.updateStatusBar();
    } else {
      this.layout.setStatusText(` Failed to open file`);
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

    // Delegate to focused component
    if (this._focus === "tree") {
      if (this.fileTree.handleKeyPress(event)) {
        event.preventDefault();
      }
    } else if (this._focus === "editor") {
      if (this.editor.handleKeyPress(event)) {
        event.preventDefault();
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
    if (!success) {
      this.layout.setStatusText(` Failed to save file`);
    }
  }

  /** Update the status bar with current editor state */
  private updateStatusBar(): void {
    const state = this.editor.state;

    if (state.filePath) {
      const fileName = state.filePath.split("/").pop() ?? state.filePath;
      const modifiedMark = state.isModified ? " [modified]" : "";
      const langStr = state.language ? ` | ${state.language}` : "";
      const cursorStr = ` Ln ${state.cursorLine + 1}, Col ${state.cursorColumn + 1}`;
      this.layout.setStatusText(` ${fileName}${modifiedMark}${langStr} ${cursorStr}`);
    } else {
      this.layout.setStatusText(` xTerm — Ctrl+Q to quit`);
    }
  }

  private handleResize(_width: number, _height: number): void {
    // Yoga layout handles the resize automatically since we use
    // percentage-based and flexGrow sizing. This handler is here
    // for future use (e.g., updating status bar with dimensions).
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

  /** Access the renderer (for testing) */
  getRenderer(): CliRenderer {
    return this.renderer;
  }
}

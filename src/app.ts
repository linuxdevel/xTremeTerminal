// src/app.ts — Main application orchestrator

import type { CliRenderer, KeyEvent } from "@opentui/core";
import { createCliRenderer } from "@opentui/core";

import { Layout } from "./components/layout.ts";
import { FileTree } from "./components/file-tree.ts";
import {
  matchesBinding,
  KB_TOGGLE_SIDEBAR,
  KB_QUIT,
  KB_FOCUS_TREE,
  KB_FOCUS_EDITOR,
} from "./keybindings.ts";
import { BG_PRIMARY } from "./theme.ts";

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

    // Wire up file tree events
    this.fileTree.onFileSelect = (filePath: string) => {
      // Placeholder for Phase 3: open file in editor
      this.layout.setStatusText(` Opening: ${filePath}`);
    };

    // Load the file tree
    await this.fileTree.load();

    // Wire up keyboard handler
    this.renderer.keyInput.on("keypress", this.handleKeyPress.bind(this));

    // Wire up resize handler
    this.renderer.on("resize", this.handleResize.bind(this));

    this._isRunning = true;
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
    }
    // Editor focus delegation will be added in Phase 3
  }

  private handleResize(_width: number, _height: number): void {
    // Yoga layout handles the resize automatically since we use
    // percentage-based and flexGrow sizing. This handler is here
    // for future use (e.g., updating status bar with dimensions).
  }

  /** Set the current focus target */
  setFocus(target: FocusTarget): void {
    this._focus = target;
  }

  /** Get the current focus target */
  get focus(): FocusTarget {
    return this._focus;
  }

  /** Quit the application cleanly */
  quit(): void {
    this._isRunning = false;
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

  /** Access the renderer (for testing) */
  getRenderer(): CliRenderer {
    return this.renderer;
  }
}

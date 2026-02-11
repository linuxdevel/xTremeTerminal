// src/components/layout.ts — Main VS Code-style layout component

import type { CliRenderer } from "@opentui/core";
import { BoxRenderable, TextRenderable } from "@opentui/core";

import {
  BG_PRIMARY,
  BG_SECONDARY,
  FG_PRIMARY,
  FG_SECONDARY,
  FG_MUTED,
  ACCENT,
  SIDEBAR_WIDTH,
  TAB_BAR_HEIGHT,
  STATUS_BAR_HEIGHT,
} from "../theme.ts";

// ── Layout Structure ───────────────────────────────────────────────
//
// ┌─────────────────────────────────────────────┐
// │  Tab Bar (height: 1)                         │
// ├──────────┬──────────────────────────────────┤
// │ Sidebar  │  Editor Area                      │
// │ (width:  │  (flexGrow: 1)                   │
// │  fixed)  │                                   │
// ├──────────┴──────────────────────────────────┤
// │  Status Bar (height: 1)                      │
// └─────────────────────────────────────────────┘

export interface LayoutContainers {
  root: BoxRenderable;
  tabBar: BoxRenderable;
  middleRow: BoxRenderable;
  sidebar: BoxRenderable;
  editorArea: BoxRenderable;
  statusBar: BoxRenderable;
  // Placeholder text elements (replaced later by real components)
  sidebarPlaceholder: TextRenderable;
  editorPlaceholder: TextRenderable;
  tabBarPlaceholder: TextRenderable;
  statusBarPlaceholder: TextRenderable;
}

export class Layout {
  private renderer: CliRenderer;
  private containers: LayoutContainers;
  private _sidebarVisible = true;

  constructor(renderer: CliRenderer) {
    this.renderer = renderer;
    this.containers = this.createLayout();
  }

  private createLayout(): LayoutContainers {
    const ctx = this.renderer;

    // Root container — fills terminal
    const root = new BoxRenderable(ctx, {
      id: "root",
      width: "100%",
      height: "100%",
      flexDirection: "column",
      backgroundColor: BG_PRIMARY,
    });

    // ── Tab Bar ────────────────────────────────────────────────────
    const tabBar = new BoxRenderable(ctx, {
      id: "tab-bar",
      height: TAB_BAR_HEIGHT,
      width: "100%",
      flexDirection: "row",
      backgroundColor: BG_SECONDARY,
    });

    const tabBarPlaceholder = new TextRenderable(ctx, {
      id: "tab-bar-placeholder",
      content: " No files open",
      fg: FG_SECONDARY,
      width: "100%",
    });
    tabBar.add(tabBarPlaceholder);

    // ── Middle Row (sidebar + editor) ──────────────────────────────
    const middleRow = new BoxRenderable(ctx, {
      id: "middle-row",
      flexDirection: "row",
      flexGrow: 1,
      width: "100%",
    });

    // Sidebar
    const sidebar = new BoxRenderable(ctx, {
      id: "sidebar",
      width: SIDEBAR_WIDTH,
      flexDirection: "column",
      backgroundColor: BG_SECONDARY,
    });

    const sidebarPlaceholder = new TextRenderable(ctx, {
      id: "sidebar-placeholder",
      content: " EXPLORER",
      fg: FG_MUTED,
      width: "100%",
    });
    sidebar.add(sidebarPlaceholder);

    // Editor area
    const editorArea = new BoxRenderable(ctx, {
      id: "editor-area",
      flexGrow: 1,
      flexDirection: "column",
      backgroundColor: BG_PRIMARY,
    });

    const editorPlaceholder = new TextRenderable(ctx, {
      id: "editor-placeholder",
      content: "",
      fg: FG_SECONDARY,
      width: "100%",
      flexGrow: 1,
    });
    editorArea.add(editorPlaceholder);

    middleRow.add(sidebar);
    middleRow.add(editorArea);

    // ── Status Bar ─────────────────────────────────────────────────
    const statusBar = new BoxRenderable(ctx, {
      id: "status-bar",
      height: STATUS_BAR_HEIGHT,
      width: "100%",
      flexDirection: "row",
      backgroundColor: BG_SECONDARY,
    });

    const statusBarPlaceholder = new TextRenderable(ctx, {
      id: "status-bar-placeholder",
      content: " xTerm — Ctrl+Q to quit",
      fg: FG_PRIMARY,
      width: "100%",
    });
    statusBar.add(statusBarPlaceholder);

    // Assemble layout
    root.add(tabBar);
    root.add(middleRow);
    root.add(statusBar);

    return {
      root,
      tabBar,
      middleRow,
      sidebar,
      editorArea,
      statusBar,
      sidebarPlaceholder,
      editorPlaceholder,
      tabBarPlaceholder,
      statusBarPlaceholder,
    };
  }

  // ── Public API ───────────────────────────────────────────────────

  get root(): BoxRenderable {
    return this.containers.root;
  }

  get tabBar(): BoxRenderable {
    return this.containers.tabBar;
  }

  get sidebar(): BoxRenderable {
    return this.containers.sidebar;
  }

  get editorArea(): BoxRenderable {
    return this.containers.editorArea;
  }

  get statusBar(): BoxRenderable {
    return this.containers.statusBar;
  }

  get sidebarVisible(): boolean {
    return this._sidebarVisible;
  }

  toggleSidebar(): void {
    this._sidebarVisible = !this._sidebarVisible;
    this.containers.sidebar.visible = this._sidebarVisible;
  }

  setSidebarVisible(visible: boolean): void {
    this._sidebarVisible = visible;
    this.containers.sidebar.visible = visible;
  }

  /** Replace sidebar placeholder with actual file tree component */
  replaceSidebarContent(renderable: BoxRenderable): void {
    // Remove placeholder
    this.containers.sidebar.remove(this.containers.sidebarPlaceholder.id);
    this.containers.sidebarPlaceholder.destroy();
    // Add the real component
    this.containers.sidebar.add(renderable);
  }

  /** Replace editor area placeholder with actual editor component */
  replaceEditorContent(renderable: BoxRenderable): void {
    // Remove placeholder
    this.containers.editorArea.remove(this.containers.editorPlaceholder.id);
    this.containers.editorPlaceholder.destroy();
    // Add the real component
    this.containers.editorArea.add(renderable);
  }

  /** Update status bar text */
  setStatusText(text: string): void {
    this.containers.statusBarPlaceholder.content = text;
  }

  /** Attach the layout to the renderer root */
  mount(): void {
    this.renderer.root.add(this.containers.root);
  }

  /** Clean up all renderables */
  destroy(): void {
    this.containers.root.destroyRecursively();
  }
}

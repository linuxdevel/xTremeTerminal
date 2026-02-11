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
  MENU_BAR_HEIGHT,
  TAB_BAR_HEIGHT,
  STATUS_BAR_HEIGHT,
} from "../theme.ts";

// ── Layout Structure ───────────────────────────────────────────────
//
// ┌─────────────────────────────────────────────┐
// │  Menu Bar (height: 1)                        │
// ├─────────────────────────────────────────────┤
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
  menuBar: BoxRenderable;
  tabBar: BoxRenderable;
  middleRow: BoxRenderable;
  sidebar: BoxRenderable;
  editorArea: BoxRenderable;
  statusBar: BoxRenderable;
  // Placeholder text elements (replaced later by real components)
  menuBarPlaceholder: TextRenderable;
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

    // ── Menu Bar ────────────────────────────────────────────────────
    const menuBar = new BoxRenderable(ctx, {
      id: "menu-bar",
      height: MENU_BAR_HEIGHT,
      width: "100%",
      flexDirection: "row",
      backgroundColor: BG_SECONDARY,
    });

    const menuBarPlaceholder = new TextRenderable(ctx, {
      id: "menu-bar-placeholder",
      content: " File  Help",
      fg: FG_SECONDARY,
      width: "100%",
    });
    menuBar.add(menuBarPlaceholder);

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
    root.add(menuBar);
    root.add(tabBar);
    root.add(middleRow);
    root.add(statusBar);

    return {
      root,
      menuBar,
      tabBar,
      middleRow,
      sidebar,
      editorArea,
      statusBar,
      menuBarPlaceholder,
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

  get menuBarContainer(): BoxRenderable {
    return this.containers.menuBar;
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

  /** Replace menu bar placeholder with actual menu bar component */
  replaceMenuBarContent(renderable: BoxRenderable): void {
    // Remove placeholder
    this.containers.menuBar.remove(this.containers.menuBarPlaceholder.id);
    this.containers.menuBarPlaceholder.destroy();
    // Add the real component
    this.containers.menuBar.add(renderable);
  }

  /** Replace tab bar placeholder with actual tab bar component */
  replaceTabBarContent(renderable: BoxRenderable): void {
    // Remove placeholder
    this.containers.tabBar.remove(this.containers.tabBarPlaceholder.id);
    this.containers.tabBarPlaceholder.destroy();
    // Add the real component
    this.containers.tabBar.add(renderable);
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

  /** Replace status bar placeholder with actual status bar component */
  replaceStatusBarContent(renderable: BoxRenderable): void {
    // Remove placeholder
    this.containers.statusBar.remove(this.containers.statusBarPlaceholder.id);
    this.containers.statusBarPlaceholder.destroy();
    // Add the real component
    this.containers.statusBar.add(renderable);
  }

  /** Update status bar text (placeholder mode only) */
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

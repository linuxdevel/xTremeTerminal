# Phase 12 — Archive Browser

## Overview

Add the ability to browse and extract files from archive files (`.tar.gz`, `.tar`, `.tgz`, `.tar.bz2`, `.tar.xz`, `.zip`) directly within xTremeTerminal. When a user selects an archive file in the file tree and presses Enter, a new tab opens showing the archive's contents in a tree view. From there, the user can view individual files or extract them to a chosen location.

## Feature Summary

- Open archive files from the file tree (Enter on an archive file)
- Display archive contents in a tree-structured browser within a tab
- View any file inside the archive in read-only mode
- Extract individual files or directories to a user-chosen location
- Navigate the extraction target using a filesystem browser dialog

## Technical Approach

### Archive Format Support

Bun provides a built-in `Bun.Archive` class that handles `.tar.gz` natively. For `.zip` files, Bun doesn't provide a built-in API, so we'll use a lightweight approach (either `Bun.spawn` with `unzip -l` for listing or a JS-based zip library). Initial implementation should focus on tar-based archives since `Bun.Archive` handles them natively.

**Supported formats (Phase 1):**
| Extension | Handled By |
|-----------|-----------|
| `.tar.gz`, `.tgz` | `Bun.Archive` (native) |
| `.tar` | `Bun.Archive` (native, no compression) |

**Possible future formats:**
| Extension | Approach |
|-----------|---------|
| `.zip` | `Bun.spawn(["unzip", "-l", ...])` or JS library |
| `.tar.bz2` | `Bun.spawn(["tar", "tjf", ...])` |
| `.tar.xz` | `Bun.spawn(["tar", "tJf", ...])` |

### New Files

| File | Purpose |
|------|---------|
| `src/services/archive-service.ts` | Archive I/O: list contents, read single file, extract file/directory |
| `src/components/archive-browser.ts` | TUI component: tree view of archive contents, key handling |
| `src/components/path-picker.ts` | Filesystem browser dialog for choosing extraction target |

### Modified Files

| File | Changes |
|------|---------|
| `src/app.ts` | Detect archive files on Enter, open archive tab, wire up extract actions |
| `src/services/tab-manager.ts` | Support a new tab type (archive browser vs. text editor) |
| `src/utils/language-detect.ts` | Add archive extension detection helper |
| `src/components/file-tree.ts` | Minor: identify archive files for icon/indicator |
| `src/utils/file-icons.ts` | Add archive file icons |

### Architecture

#### ArchiveService (`src/services/archive-service.ts`)

Pure service, no TUI dependency. Responsible for:

```typescript
interface ArchiveEntry {
  path: string;          // Full path within archive (e.g., "src/index.ts")
  type: "file" | "directory";
  size: number;          // Uncompressed size in bytes
  modified?: Date;       // Last modified timestamp
}

class ArchiveService {
  // List all entries in an archive
  async listEntries(archivePath: string): Promise<ArchiveEntry[]>;

  // Read a single file's content from the archive (for viewing)
  async readFile(archivePath: string, entryPath: string): Promise<string | null>;

  // Extract a single file to a target directory
  async extractFile(archivePath: string, entryPath: string, targetDir: string): Promise<boolean>;

  // Extract a directory (and all children) to a target directory
  async extractDirectory(archivePath: string, dirPath: string, targetDir: string): Promise<number>;

  // Check if a file path is an archive
  isArchive(filePath: string): boolean;
}
```

Implementation uses `Bun.Archive`:
- `listEntries`: Create `new Bun.Archive(data)`, call `.files()` to get the `Map<string, File>`, convert to `ArchiveEntry[]`
- `readFile`: Call `.files(entryPath)`, read the `File` as text
- `extractFile`: Call `.extract(targetDir, { glob: entryPath })`
- `extractDirectory`: Call `.extract(targetDir, { glob: dirPath + "/**" })`

#### ArchiveBrowser (`src/components/archive-browser.ts`)

TUI component that renders inside a tab. Similar structure to `FileTree` but read-only and sourced from archive entries instead of filesystem.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Archive: my-project.tar.gz                      │  <- Header
├─────────────────────────────────────────────────┤
│  > src/                                          │  <- Tree view
│    index.ts                    1.2 KB            │     (navigable)
│    app.ts                      5.4 KB            │
│  > tests/                                        │
│    README.md                   0.8 KB            │
│                                                  │
├─────────────────────────────────────────────────┤
│ Enter: View | E: Extract | Ctrl+E: Extract All  │  <- Key hints
└─────────────────────────────────────────────────┘
```

**Key bindings:**
| Key | Action |
|-----|--------|
| Up/Down | Navigate entries |
| Enter | View selected file (opens read-only in editor area or a new read-only tab) |
| Left/Right | Collapse/expand directories |
| `e` | Extract selected file/directory (opens path picker) |
| `Ctrl+E` | Extract entire archive (opens path picker) |
| `Escape` | Close archive tab |

#### PathPicker (`src/components/path-picker.ts`)

A modal dialog for browsing the filesystem and selecting a directory for extraction. Opens starting from the directory where the archive file is located.

**Layout:**
```
┌─ Extract to ────────────────────────┐
│ /home/user/projects/                 │
│  > src/                              │
│  > docs/                             │
│    README.md                         │
│                                      │
│ [Extract Here]  [Cancel]             │
└──────────────────────────────────────┘
```

**Behavior:**
- Navigate directories with Up/Down/Enter
- Enter on a directory navigates into it
- `..` entry at top to go to parent directory
- Enter on "Extract Here" or press `Ctrl+Enter` to confirm
- Escape to cancel
- Current path shown at top of dialog

#### Tab Manager Changes

The `TabState` interface needs a `type` field to distinguish between editor tabs and archive tabs:

```typescript
export interface TabState {
  // ... existing fields ...
  type: "editor" | "archive";  // New field, defaults to "editor"
}
```

When switching to an archive tab, the app swaps the editor area with the archive browser component instead of loading file content into the textarea.

### Workflow

1. User navigates file tree, highlights `my-project.tar.gz`
2. User presses Enter
3. `App` detects the file is an archive (via `ArchiveService.isArchive()`)
4. `App` creates a new tab with `type: "archive"`, title = archive filename
5. `App` creates an `ArchiveBrowser` component, loads entries via `ArchiveService.listEntries()`
6. Archive contents displayed in tree view within the tab
7. User navigates to a file, presses Enter to view -> content loaded via `ArchiveService.readFile()`, displayed in a read-only editor view (or separate read-only tab)
8. User presses `e` to extract -> `PathPicker` dialog opens, starting at the archive's parent directory
9. User navigates to desired location, confirms -> `ArchiveService.extractFile()` runs
10. Status bar shows success/failure message

### Testing

| Test File | Type | What to Test |
|-----------|------|-------------|
| `tests/unit/archive-service.test.ts` | Unit | List entries, read files, extract, isArchive detection |
| `tests/component/archive-browser.test.ts` | Component | Navigation, key handling, view/extract actions |
| `tests/component/path-picker.test.ts` | Component | Directory navigation, confirm/cancel, initial path |

Unit tests for ArchiveService should create temporary `.tar.gz` files with known contents using `Bun.Archive` and verify listing/reading/extraction.

### Open Questions

1. **Read-only viewing:** Should viewing a file from an archive open it in the existing editor as read-only (with a `[Read-Only]` indicator), or in a separate lightweight viewer?
2. **Large archives:** Should we limit the number of entries displayed or add lazy loading for archives with thousands of files?
3. **Nested archives:** Should we support browsing archives within archives (e.g., a `.tar.gz` inside a `.tar.gz`)?
4. **Binary files in archives:** How to handle binary files — show a hex dump, or just show file info and only allow extraction?

---

# Phase 13 — SSH Connection Manager

## Overview

Add an SSH connection manager that lets users define, organize, and connect to remote hosts directly from xTremeTerminal. Hosts are stored in a persistent configuration file and can be organized into groups. When a connection is initiated, an interactive SSH session opens in a new tab using a PTY.

## Feature Summary

- New "Tools" menu in the menu bar with "SSH to Host" option
- SSH host browser tab with grouped host list
- Persistent host configuration stored in `~/.config/xtremeterminal/ssh-hosts.json`
- Settings UI for managing hosts and groups (add, edit, delete, move between groups)
- Interactive SSH sessions running in tabs via PTY
- "Settings" submenu in the File menu for managing SSH hosts/groups

## Technical Approach

### Configuration File

Location: `~/.config/xtremeterminal/ssh-hosts.json`

```json
{
  "groups": [
    {
      "id": "group-1",
      "name": "Production Servers",
      "hosts": [
        {
          "id": "host-1",
          "name": "Web Server 1",
          "hostname": "192.168.1.10",
          "port": 22,
          "username": "admin"
        },
        {
          "id": "host-2",
          "name": "Database Server",
          "hostname": "192.168.1.20",
          "port": 22,
          "username": "dbadmin"
        }
      ]
    },
    {
      "id": "group-2",
      "name": "Development",
      "hosts": [
        {
          "id": "host-3",
          "name": "Dev Box",
          "hostname": "10.0.0.5",
          "port": 2222,
          "username": "dev"
        }
      ]
    }
  ],
  "ungrouped": [
    {
      "id": "host-4",
      "name": "Jump Host",
      "hostname": "jump.example.com",
      "port": 22,
      "username": "user"
    }
  ]
}
```

### New Files

| File | Purpose |
|------|---------|
| `src/services/ssh-config.ts` | Load/save/manage SSH host configuration |
| `src/components/ssh-browser.ts` | TUI component: host list with groups, selection UI |
| `src/components/ssh-terminal.ts` | TUI component: embedded terminal for SSH session |
| `src/components/ssh-host-editor.ts` | Dialog for adding/editing a host entry |
| `src/components/ssh-group-editor.ts` | Dialog for managing groups (add, rename, delete) |

### Modified Files

| File | Changes |
|------|---------|
| `src/app.ts` | Add "Tools" menu, wire up SSH browser/terminal, handle SSH tab type |
| `src/components/menu-bar.ts` | No structural changes needed (already supports arbitrary menus) |
| `src/services/tab-manager.ts` | Support `type: "ssh-browser"` and `type: "ssh-session"` tab types |

### Architecture

#### SSHConfig (`src/services/ssh-config.ts`)

Pure service for managing the configuration file:

```typescript
interface SSHHost {
  id: string;
  name: string;       // Display name (user-defined or actual hostname)
  hostname: string;   // IP address or DNS hostname
  port: number;       // Default: 22
  username: string;   // SSH username
}

interface SSHGroup {
  id: string;
  name: string;       // Group display name
  hosts: SSHHost[];
}

interface SSHConfig {
  groups: SSHGroup[];
  ungrouped: SSHHost[];
}

class SSHConfigService {
  // Load config from disk (creates default if missing)
  async load(): Promise<SSHConfig>;

  // Save config to disk
  async save(config: SSHConfig): Promise<void>;

  // Host CRUD
  addHost(config: SSHConfig, host: Omit<SSHHost, "id">, groupId?: string): SSHConfig;
  editHost(config: SSHConfig, hostId: string, updates: Partial<SSHHost>): SSHConfig;
  removeHost(config: SSHConfig, hostId: string): SSHConfig;
  moveHost(config: SSHConfig, hostId: string, targetGroupId: string | null): SSHConfig;

  // Group CRUD
  addGroup(config: SSHConfig, name: string): SSHConfig;
  renameGroup(config: SSHConfig, groupId: string, newName: string): SSHConfig;
  removeGroup(config: SSHConfig, groupId: string, moveHostsToUngrouped?: boolean): SSHConfig;

  // Query
  getAllHosts(config: SSHConfig): SSHHost[];
  findHost(config: SSHConfig, hostId: string): SSHHost | null;
}
```

Config file path: `~/.config/xtremeterminal/ssh-hosts.json`. The directory is created if it doesn't exist.

#### SSHBrowser (`src/components/ssh-browser.ts`)

TUI component rendered in a tab. Shows all hosts organized by group.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ SSH Hosts                                        │  <- Header
├─────────────────────────────────────────────────┤
│                                                  │
│  ── Ungrouped ──────────────────────────────     │
│    > Jump Host          jump.example.com:22      │
│                                                  │
│  ── Production Servers ─────────────────────     │
│    > Web Server 1       192.168.1.10:22          │
│    > Database Server    192.168.1.20:22          │
│                                                  │
│  ── Development ────────────────────────────     │
│    > Dev Box            10.0.0.5:2222            │
│                                                  │
├─────────────────────────────────────────────────┤
│ Enter: Connect | A: Add Host | G: Add Group     │
│ E: Edit | D: Delete | Escape: Close             │  <- Key hints
└─────────────────────────────────────────────────┘
```

**Key bindings:**
| Key | Action |
|-----|--------|
| Up/Down | Navigate host list |
| Enter | Connect to selected host (opens SSH session tab) |
| `a` | Add new host (opens host editor dialog) |
| `g` | Add new group (opens group editor dialog) |
| `e` | Edit selected host or group |
| `d` | Delete selected host or group (with confirmation) |
| `m` | Move selected host to a different group |
| Escape | Close SSH browser tab |

#### SSHTerminal (`src/components/ssh-terminal.ts`)

Wraps a PTY-based SSH session in a tab. Uses `Bun.spawn()` with `Bun.Terminal` (PTY support) to create an interactive SSH session.

```typescript
class SSHTerminal {
  private terminal: Bun.Terminal;
  private process: Subprocess;

  // Start SSH connection
  async connect(host: SSHHost): Promise<void> {
    // Spawn: ssh -p <port> <username>@<hostname>
    // Use Bun.Terminal for PTY
    this.terminal = new Bun.Terminal({
      cols: terminalWidth,
      rows: terminalHeight,
      data: (term, data) => {
        // Render received data to the TUI
        this.renderOutput(data);
      },
    });

    this.process = Bun.spawn(
      ["ssh", "-p", String(host.port), `${host.username}@${host.hostname}`],
      { terminal: this.terminal }
    );
  }

  // Forward keyboard input to the SSH process
  handleKeyPress(event: KeyEvent): boolean {
    this.terminal.write(event.sequence);
    return true;
  }

  // Handle terminal resize
  resize(cols: number, rows: number): void {
    this.terminal.resize(cols, rows);
  }

  // Disconnect
  disconnect(): void {
    this.process.kill();
  }
}
```

**Important considerations:**
- The SSH session needs a proper PTY to work (password prompts, interactive shells, ncurses apps)
- `Bun.Terminal` provides this PTY capability
- All keyboard input while an SSH tab is focused must be forwarded to the PTY, not handled by xTremeTerminal's keybinding system
- Terminal output from the SSH session needs to be rendered into an OpenTUI renderable — this may require a terminal emulator component or using OpenTUI's built-in terminal rendering if available
- Handle SSH process exit gracefully (show "Connection closed" message, allow closing the tab)
- Handle resize events — when the terminal window is resized, the PTY dimensions must be updated

#### SSHHostEditor (`src/components/ssh-host-editor.ts`)

Modal dialog for adding or editing a host:

```
┌─ Add SSH Host ──────────────────────┐
│                                      │
│  Name:     [Web Server 1          ]  │
│  Hostname: [192.168.1.10          ]  │
│  Port:     [22                    ]  │
│  Username: [admin                 ]  │
│  Group:    [Production Servers   v]  │
│                                      │
│       [Save]    [Cancel]             │
└──────────────────────────────────────┘
```

Uses text input fields (OpenTUI TextRenderable with editable mode or custom input component). Tab key moves between fields.

#### SSHGroupEditor (`src/components/ssh-group-editor.ts`)

Simpler dialog for adding/renaming a group:

```
┌─ Add Group ─────────────────────────┐
│                                      │
│  Group Name: [Production Servers  ]  │
│                                      │
│       [Save]    [Cancel]             │
└──────────────────────────────────────┘
```

#### Tab Manager Changes

Extend the tab type to support SSH:

```typescript
export interface TabState {
  // ... existing fields ...
  type: "editor" | "archive" | "ssh-browser" | "ssh-session";
}
```

When `type` is `"ssh-session"`, the tab title shows the host name (e.g., "SSH: Web Server 1"). The tab should indicate if the session is active or disconnected.

#### Menu Changes

Add a new "Tools" menu between "File" and "Help":

```typescript
{
  id: "tools", label: "Tools", items: [
    { id: "tools.ssh", label: "SSH to Host", action: () => this.openSSHBrowser() },
  ],
}
```

Add a "Settings" item to the "File" menu:

```typescript
{ id: "file.settings", label: "SSH Host Settings", action: () => this.openSSHSettings() },
```

### Workflow

#### Connecting to a Host

1. User opens "Tools" > "SSH to Host" (or via command palette)
2. SSH browser tab opens, showing all configured hosts grouped
3. User navigates to a host, presses Enter
4. New tab opens with title "SSH: <host name>"
5. SSH connection initiated via `Bun.spawn` + PTY
6. User interacts with the remote shell
7. When SSH exits (logout, connection drop), tab shows "Connection closed" message
8. User can close the tab normally

#### Managing Hosts

1. From SSH browser: press `a` to add, `e` to edit, `d` to delete
2. Host editor dialog appears with input fields
3. User fills in details, presses Enter or clicks Save
4. Configuration saved to `~/.config/xtremeterminal/ssh-hosts.json`
5. SSH browser view refreshes

### Testing

| Test File | Type | What to Test |
|-----------|------|-------------|
| `tests/unit/ssh-config.test.ts` | Unit | Load/save config, CRUD operations, validation |
| `tests/component/ssh-browser.test.ts` | Component | Navigation, key handling, host selection |
| `tests/component/ssh-host-editor.test.ts` | Component | Input fields, validation, save/cancel |
| `tests/component/ssh-group-editor.test.ts` | Component | Group name input, save/cancel |

SSH terminal tests are difficult to unit test (requires PTY + SSH server). These should be tested manually or with integration tests that mock the SSH process.

### Open Questions

1. **Terminal emulation:** Does OpenTUI have a built-in terminal emulator renderable, or do we need to implement VT100/xterm escape sequence parsing ourselves to render SSH output? This is the most complex part of this feature. If OpenTUI doesn't provide this, we may need to use a library like `xterm-headless` or implement basic VT100 parsing.
2. **SSH key authentication:** Should we support specifying an SSH key file per host, or rely on the user's default SSH agent/key?
3. **Password input:** SSH password prompts go through the PTY. Should we do anything special to handle them, or let the PTY handle it naturally?
4. **Connection persistence:** If the user switches tabs away from an SSH session, should the connection stay alive? (Yes, it should — the PTY keeps running.)
5. **Multiple sessions:** Should we allow multiple SSH sessions to the same host? (Yes, each opens a new tab.)
6. **Known hosts:** SSH will prompt for unknown host keys. Should we let this happen naturally through the PTY, or pre-check and show our own dialog?

### Complexity Assessment

This feature is significantly more complex than the archive browser due to:
- PTY/terminal emulation integration with OpenTUI
- Interactive input forwarding
- Multi-dialog host management UI
- Persistent configuration management

**Recommendation:** Implement in sub-phases:
1. **13a:** SSHConfig service + config file + SSH browser tab (host list display only)
2. **13b:** Host/group editor dialogs (full CRUD)
3. **13c:** SSH terminal integration (PTY, connect, interactive session)
4. **13d:** Polish (resize handling, connection status, reconnect)

---

# Implementation Order

| Order | Phase | Feature | Estimated Effort |
|-------|-------|---------|-----------------|
| 1 | 12 | Archive Browser | Medium |
| 2 | 13a | SSH Config + Browser UI | Medium |
| 3 | 13b | SSH Host/Group Editors | Medium |
| 4 | 13c | SSH Terminal (PTY) | High |
| 5 | 13d | SSH Polish | Low-Medium |

Phase 12 (Archive Browser) should be done first because:
- It's self-contained and doesn't depend on external tools
- Uses Bun's built-in `Bun.Archive` API
- Establishes the pattern for non-editor tab types (needed by SSH too)
- The `PathPicker` component can be reused in the SSH host editor

Phase 13 (SSH) builds on the tab type infrastructure from Phase 12 and is more complex, so it benefits from having the multi-tab-type pattern already established.

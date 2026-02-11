# Getting Started

This guide walks you through installing and running xTerm for the first time.

## Prerequisites

Before installing xTerm, make sure you have the following:

### 1. Bun (required)

xTerm runs on [Bun](https://bun.sh), a fast JavaScript/TypeScript runtime. Node.js will not work because xTerm's underlying UI library (OpenTUI) uses Bun-specific FFI bindings.

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version   # Should be >= 1.0
```

### 2. Zig (required for building)

[Zig](https://ziglang.org) is needed to compile OpenTUI's native terminal rendering library. You need it at install time; it is not required at runtime once dependencies are installed.

```bash
# Option A: Download and install manually
curl -fsSL https://ziglang.org/download/0.14.1/zig-linux-x86_64-0.14.1.tar.xz | tar -xJ
sudo mv zig-linux-x86_64-0.14.1 /opt/zig
sudo ln -s /opt/zig/zig /usr/local/bin/zig

# Option B: Install via package manager (Ubuntu/Debian)
sudo snap install zig --classic

# Verify installation
zig version   # Should be >= 0.13
```

### 3. Terminal

xTerm works best with a modern terminal emulator that supports:
- **True color** (24-bit color) - for the full Tokyo Night theme
- **256 colors** minimum - basic theme support
- **Alternate screen buffer** - xTerm takes over the full terminal
- **Mouse input** (optional) - for clicking tabs and tree items

Recommended terminals: Kitty, Alacritty, WezTerm, iTerm2, Windows Terminal, GNOME Terminal.

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/your-username/xTremeTerminal.git
cd xTremeTerminal

# Install dependencies
bun install

# Run xTerm
bun run src/index.ts
```

### Global Install

```bash
# Install as a global CLI tool
cd xTremeTerminal
bun install -g .

# Now you can run from anywhere
xterm
```

## First Run

### Opening in the Current Directory

```bash
bun run src/index.ts
```

This opens xTerm with the file tree showing the current working directory.

### Opening a Specific Directory

```bash
bun run src/index.ts /path/to/project
```

### Opening a Specific File

```bash
bun run src/index.ts /path/to/file.ts
```

## Your First Session

When xTerm launches, you'll see:

```
┌─────────────────────────────────────────────────────────────┐
│  [Welcome]                                                   │
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│  File Tree   │  Editor Area                                  │
│              │                                               │
│  > src/      │  Welcome to xTerm!                            │
│  > tests/    │                                               │
│    README.md │  Use arrow keys to navigate the file tree.    │
│    ...       │  Press Enter to open a file.                  │
│              │                                               │
├──────────────┴──────────────────────────────────────────────┤
│  Welcome | Ln 1, Col 1 | Ready                               │
└─────────────────────────────────────────────────────────────┘
```

### Basic Workflow

1. **Navigate the file tree** using the **Up** and **Down** arrow keys
2. **Expand a directory** by pressing **Enter** or **Right arrow**
3. **Open a file** by selecting it and pressing **Enter**
4. **Edit the file** -- just start typing
5. **Save your changes** with **Ctrl+S**
6. **Open another file** -- it opens in a new tab
7. **Switch between tabs** with **Ctrl+Tab**
8. **Exit** with **Ctrl+C**

### Key Things to Know

- The **file tree** is on the left; the **editor** is on the right
- **Tabs** appear at the top when you have multiple files open
- The **status bar** at the bottom shows the current file, cursor position, and language
- A **dot** before a tab name means the file has unsaved changes
- Press **Ctrl+B** to toggle the sidebar if you need more editor space
- Press **Ctrl+Shift+P** to open the command palette for all available actions

## Next Steps

- Read the [User Guide](user-guide.md) for detailed usage instructions
- Check the [Keyboard Shortcuts](keyboard-shortcuts.md) reference
- Learn about [Configuration](configuration.md) options
- Explore the [Architecture](architecture.md) for technical details

## Troubleshooting

### "command not found: bun"
Make sure Bun is installed and in your PATH. Run `source ~/.bashrc` after installing.

### "error: zig not found"
OpenTUI requires Zig to build its native components. Install Zig and make sure it's in your PATH.

### Colors look wrong
Your terminal may not support true color. Try setting `COLORTERM=truecolor` in your environment, or switch to a terminal that supports 24-bit color.

### Terminal looks garbled after crash
If xTerm exits abnormally without cleaning up the terminal, run:
```bash
reset
```
This restores your terminal to its normal state.

### "Terminal too small"
xTerm requires a minimum of 40 columns and 10 rows. Resize your terminal window.

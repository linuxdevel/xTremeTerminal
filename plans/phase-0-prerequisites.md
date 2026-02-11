# Phase 0: Prerequisites

## Goal
Install all required tooling (Bun, Zig) and verify the environment is ready for development.

## Prerequisites
- Ubuntu 25.10 (confirmed)
- curl (confirmed)
- git (confirmed)

## Steps

### 0.1 Install Bun
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc   # or restart shell
bun --version      # verify
```

### 0.2 Install Zig
Zig is required by OpenTUI's native renderer (Zig compiles the low-level terminal rendering code).

```bash
# Option A: Using the official install script
curl -fsSL https://ziglang.org/download/0.14.1/zig-linux-x86_64-0.14.1.tar.xz | tar -xJ
sudo mv zig-linux-x86_64-0.14.1 /opt/zig
sudo ln -s /opt/zig/zig /usr/local/bin/zig
zig version  # verify
```

```bash
# Option B: Using snap
sudo snap install zig --classic
```

### 0.3 Verify Environment
```bash
bun --version   # Should be >= 1.0
zig version     # Should be >= 0.13
git --version   # Should be available
```

### 0.4 Initialize Git Repository
```bash
cd /home/abols/xTremeTerminal
git init
```

## Acceptance Criteria
- [ ] `bun --version` outputs a version >= 1.0
- [ ] `zig version` outputs a version >= 0.13
- [ ] Git repository is initialized
- [ ] Ready to proceed to Phase 1

## Notes
- Bun is the **required** runtime -- Node.js will not work because OpenTUI depends on Bun-specific FFI
- Zig is needed at **build time** only -- users don't need Zig at runtime once `@opentui/core` is installed from npm (it ships prebuilt binaries for common platforms), but for development and the initial `bun install` of OpenTUI, Zig must be present
- If Zig installation fails, check the OpenTUI README for the specific Zig version required (`.zig-version` file in the OpenTUI repo)

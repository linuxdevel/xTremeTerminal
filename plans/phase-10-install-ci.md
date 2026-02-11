# Phase 10: Install Script & GitHub Workflows

## Goal
Create a `curl | bash` install script for end users and GitHub Actions workflows for CI (test on push/PR) and Release (build cross-platform binaries on tag push).

## Overview

This phase has three deliverables:

1. **`install.sh`** — A curl-piped install script users can run to download a pre-built binary
2. **`.github/workflows/ci.yml`** — Runs tests on every push and pull request
3. **`.github/workflows/release.yml`** — Builds cross-platform binaries and creates a GitHub Release on tag push

---

## Part 1: Install Script (`install.sh`)

### Binary Name

Use `xterminal` as the binary name to avoid conflict with the X11 `xterm` terminal emulator. The install script and release artifacts will use this name.

### How It Works

```
curl -fsSL https://raw.githubusercontent.com/linuxdevel/xTremeTerminal/main/install.sh | bash
```

### Script Behavior

1. **Detect platform and architecture:**
   - `uname -s` → `Linux` | `Darwin`
   - `uname -m` → `x86_64` | `aarch64` | `arm64`
   - Map to release artifact names:
     - `linux-x64` → `xterminal-linux-x64`
     - `linux-arm64` → `xterminal-linux-arm64`
     - `darwin-x64` → `xterminal-darwin-x64`
     - `darwin-arm64` → `xterminal-darwin-arm64`

2. **Determine install location:**
   - Default: `$HOME/.local/bin/xterminal`
   - Respect `$INSTALL_DIR` env var if set
   - Create the directory if it doesn't exist

3. **Fetch the latest release:**
   - Use GitHub API: `https://api.github.com/repos/linuxdevel/xTremeTerminal/releases/latest`
   - Parse the `browser_download_url` for the matching platform artifact
   - Fall back to a hardcoded URL pattern if API is unavailable:
     `https://github.com/linuxdevel/xTremeTerminal/releases/latest/download/xterminal-{os}-{arch}`

4. **Download and install:**
   - Download binary with `curl -fsSL`
   - Place at install location
   - `chmod +x` the binary

5. **Post-install:**
   - Check if install dir is in `$PATH`
   - If not, print instructions to add it:
     ```
     Add this to your shell profile:
       export PATH="$HOME/.local/bin:$PATH"
     ```
   - Print success message with version info

### Error Handling

- Fail with clear error if platform/arch is unsupported
- Fail if `curl` is not available (suggest `wget` alternative)
- Fail if download fails (non-zero exit, HTTP error)
- Fail if write to install dir fails (permissions)

### Script Structure

```bash
#!/bin/bash
set -euo pipefail

REPO="linuxdevel/xTremeTerminal"
BINARY_NAME="xterminal"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

main() {
  detect_platform
  detect_architecture
  get_latest_version
  download_binary
  install_binary
  print_success
}

detect_platform() { ... }
detect_architecture() { ... }
get_latest_version() { ... }
download_binary() { ... }
install_binary() { ... }
print_success() { ... }

main "$@"
```

### Testing the Script

- Test on Linux x86_64 (our dev environment)
- Verify `shellcheck install.sh` passes (if shellcheck is available)
- Verify the script is idempotent (can be run multiple times)
- Verify it handles missing `$HOME/.local/bin` gracefully

---

## Part 2: CI Workflow (`.github/workflows/ci.yml`)

### Triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

### Jobs

#### `test`
- **Runner:** `ubuntu-latest`
- **Steps:**
  1. `actions/checkout@v4`
  2. Install Zig 0.13.0 (use `mlugg/setup-zig@v1` action)
  3. Install Bun (use `oven-sh/setup-bun@v2` action, version `1.3.9`)
  4. `bun install`
  5. `bun test`

#### `typecheck` (optional but recommended)
- Same setup as `test`
- Run `bunx tsc --noEmit` to verify TypeScript types

### Caching

- Cache `node_modules` with key based on `bun.lock` hash
- Cache Zig installation

### Example

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: mlugg/setup-zig@v1
        with:
          version: 0.13.0

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.3.9"

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test

      - name: Type check
        run: bunx tsc --noEmit
```

---

## Part 3: Release Workflow (`.github/workflows/release.yml`)

### Trigger

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Build Matrix

Build compiled binaries for all supported platforms using `bun build --compile`:

| Target | `--target` flag | Artifact name |
|--------|----------------|---------------|
| Linux x64 | `bun-linux-x64-baseline` | `xterminal-linux-x64` |
| Linux ARM64 | `bun-linux-arm64` | `xterminal-linux-arm64` |
| macOS x64 | `bun-darwin-x64-baseline` | `xterminal-darwin-x64` |
| macOS ARM64 | `bun-darwin-arm64` | `xterminal-darwin-arm64` |

**Note:** We use `baseline` variants for x64 to avoid AVX2 requirements (same reason we use baseline Bun in dev).

**Important:** OpenTUI has native Zig components. `bun build --compile` bundles JS/TS into a standalone binary, but we need to verify that OpenTUI's native FFI bindings are included. If not, we may need to:
- Build on the actual target OS (Linux builds on Linux runner, macOS builds on macOS runner)
- Use a matrix strategy with `runs-on` per platform
- Bundle the `.so`/`.dylib` alongside the binary or use a different distribution approach

### Build Strategy

Since OpenTUI uses Zig FFI that must be compiled for the target platform, we need native runners:

```yaml
strategy:
  matrix:
    include:
      - os: ubuntu-latest
        target: bun-linux-x64-baseline
        artifact: xterminal-linux-x64
      - os: ubuntu-latest
        target: bun-linux-arm64
        artifact: xterminal-linux-arm64
      - os: macos-13
        target: bun-darwin-x64-baseline
        artifact: xterminal-darwin-x64
      - os: macos-14
        target: bun-darwin-arm64
        artifact: xterminal-darwin-arm64
```

### Jobs

#### `build`
- **Matrix:** 4 platform/arch combinations
- **Steps:**
  1. `actions/checkout@v4`
  2. Install Zig 0.13.0
  3. Install Bun 1.3.9
  4. `bun install`
  5. `bun build --compile --target=${{ matrix.target }} --outfile=${{ matrix.artifact }} src/index.ts`
  6. Upload artifact

#### `release`
- **Needs:** `build`
- **Steps:**
  1. Download all build artifacts
  2. Create GitHub Release using `softprops/action-gh-release@v2`
  3. Attach all binaries to the release

### Example

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: bun-linux-x64-baseline
            artifact: xterminal-linux-x64
          - os: ubuntu-latest
            target: bun-linux-arm64
            artifact: xterminal-linux-arm64
          - os: macos-13
            target: bun-darwin-x64-baseline
            artifact: xterminal-darwin-x64
          - os: macos-14
            target: bun-darwin-arm64
            artifact: xterminal-darwin-arm64

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - uses: mlugg/setup-zig@v1
        with:
          version: 0.13.0

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.3.9"

      - name: Install dependencies
        run: bun install

      - name: Build binary
        run: bun build --compile --target=${{ matrix.target }} --outfile=${{ matrix.artifact }} src/index.ts

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.artifact }}
          path: ${{ matrix.artifact }}

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts
          merge-multiple: true

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          files: artifacts/*
```

---

## Files Created

| File | Description |
|------|-------------|
| `install.sh` | curl\|bash install script |
| `.github/workflows/ci.yml` | CI workflow (test + typecheck) |
| `.github/workflows/release.yml` | Release workflow (build + publish) |

## Files Modified

| File | Changes |
|------|---------|
| `package.json` | Add `build` script, update `bin` field |
| `README.md` | Add install instructions with curl command |
| `PROGRESS.md` | Mark Phase 10 complete |

## Implementation Order

1. Write `install.sh`
2. Write `.github/workflows/ci.yml`
3. Write `.github/workflows/release.yml`
4. Update `package.json` with `build` script and `bin` field
5. Update `README.md` installation section
6. Test CI workflow by pushing to main
7. Test release workflow by tagging `v0.1.0`

## Acceptance Criteria

- [ ] `install.sh` downloads and installs the correct binary for the current platform
- [ ] `install.sh` handles errors gracefully (unsupported platform, network failure)
- [ ] CI runs on every push to main and every PR
- [ ] CI fails if tests fail or types don't check
- [ ] Release workflow triggers on `v*` tag push
- [ ] Release builds binaries for Linux x64, Linux ARM64, macOS x64, macOS ARM64
- [ ] Release creates a GitHub Release with all binaries attached
- [ ] `curl -fsSL .../install.sh | bash` works end-to-end after a release

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenTUI FFI not bundled by `bun build --compile` | Binaries won't run | Test locally first; may need to ship `.so`/`.dylib` alongside binary or use different approach |
| ARM64 cross-compilation issues | Missing platform builds | Build on native ARM64 runners (GitHub provides `macos-14` ARM64) |
| Zig build failures on CI | CI/release blocked | Pin Zig version, cache Zig installation |
| Binary name conflict with xterm | User confusion | Use `xterminal` as binary name |
| GitHub API rate limiting for install script | Install fails | Fallback to direct URL pattern |

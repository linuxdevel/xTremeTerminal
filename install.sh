#!/bin/bash
# install.sh — Install xterminal (xTerm terminal editor)
# Usage: curl -fsSL https://raw.githubusercontent.com/linuxdevel/xTremeTerminal/main/install.sh | bash
set -euo pipefail

REPO="linuxdevel/xTremeTerminal"
BINARY_NAME="xterminal"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

# ── Colors ──────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No color

info() { printf "${BLUE}info${NC}  %s\n" "$1"; }
warn() { printf "${YELLOW}warn${NC}  %s\n" "$1"; }
error() { printf "${RED}error${NC} %s\n" "$1" >&2; }
success() { printf "${GREEN}ok${NC}    %s\n" "$1"; }

# ── Platform Detection ──────────────────────────────────────────────

detect_platform() {
  local os
  os="$(uname -s)"
  case "$os" in
    Linux)  PLATFORM="linux" ;;
    Darwin) PLATFORM="darwin" ;;
    *)
      error "Unsupported operating system: $os"
      error "xTerm currently supports Linux and macOS."
      exit 1
      ;;
  esac
}

detect_architecture() {
  local arch
  arch="$(uname -m)"
  case "$arch" in
    x86_64|amd64)  ARCH="x64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *)
      error "Unsupported architecture: $arch"
      error "xTerm currently supports x86_64 and arm64."
      exit 1
      ;;
  esac
}

# ── Version Detection ──────────────────────────────────────────────

get_latest_version() {
  info "Fetching latest release..."

  if ! command -v curl &>/dev/null; then
    error "'curl' is required but not installed."
    error "Install it with your package manager (e.g., apt install curl)."
    exit 1
  fi

  # Try GitHub API first
  local api_response
  if api_response=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null); then
    VERSION=$(echo "$api_response" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"//;s/".*//')
    if [ -n "$VERSION" ]; then
      info "Latest version: $VERSION"
      return
    fi
  fi

  # Fallback: use "latest" redirect
  warn "Could not determine version from API, using latest redirect."
  VERSION="latest"
}

# ── Download ────────────────────────────────────────────────────────

download_binary() {
  local artifact="${BINARY_NAME}-${PLATFORM}-${ARCH}"
  local url

  if [ "$VERSION" = "latest" ]; then
    url="https://github.com/${REPO}/releases/latest/download/${artifact}"
  else
    url="https://github.com/${REPO}/releases/download/${VERSION}/${artifact}"
  fi

  info "Downloading ${artifact}..."
  info "URL: ${url}"

  TMPDIR=$(mktemp -d)
  trap 'rm -rf "$TMPDIR"' EXIT

  local http_code
  http_code=$(curl -fsSL -w "%{http_code}" -o "${TMPDIR}/${BINARY_NAME}" "$url" 2>/dev/null) || true

  if [ ! -f "${TMPDIR}/${BINARY_NAME}" ] || [ ! -s "${TMPDIR}/${BINARY_NAME}" ]; then
    error "Download failed."
    error "URL: ${url}"
    error "Make sure a release exists with the artifact: ${artifact}"
    exit 1
  fi

  success "Download complete."
}

# ── Install ─────────────────────────────────────────────────────────

install_binary() {
  info "Installing to ${INSTALL_DIR}/${BINARY_NAME}..."

  # Create install directory if it doesn't exist
  if [ ! -d "$INSTALL_DIR" ]; then
    mkdir -p "$INSTALL_DIR" || {
      error "Failed to create directory: ${INSTALL_DIR}"
      error "Try setting INSTALL_DIR to a writable location:"
      error "  INSTALL_DIR=/path/to/dir curl -fsSL ... | bash"
      exit 1
    }
    info "Created directory: ${INSTALL_DIR}"
  fi

  # Copy binary to install location
  cp "${TMPDIR}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}" || {
    error "Failed to write to ${INSTALL_DIR}/${BINARY_NAME}"
    error "Check permissions or try a different INSTALL_DIR."
    exit 1
  }

  # Make executable
  chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

  success "Installed ${BINARY_NAME} to ${INSTALL_DIR}/${BINARY_NAME}"
}

# ── Post-Install ────────────────────────────────────────────────────

print_success() {
  echo ""
  printf "${GREEN}${BOLD}xTerm installed successfully!${NC}\n"
  echo ""

  # Check if install dir is in PATH
  case ":$PATH:" in
    *":${INSTALL_DIR}:"*)
      info "Run '${BINARY_NAME}' to start the editor."
      ;;
    *)
      warn "${INSTALL_DIR} is not in your PATH."
      echo ""
      echo "  Add this to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
      echo ""
      printf "    ${BOLD}export PATH=\"%s:\$PATH\"${NC}\n" "$INSTALL_DIR"
      echo ""
      echo "  Then restart your shell or run:"
      echo ""
      printf "    ${BOLD}source ~/.bashrc${NC}\n"
      echo ""
      ;;
  esac

  if [ "$VERSION" != "latest" ]; then
    info "Version: ${VERSION}"
  fi
  info "Binary:  ${INSTALL_DIR}/${BINARY_NAME}"
  echo ""
  echo "  Usage:"
  echo "    ${BINARY_NAME}                  # Open in current directory"
  echo "    ${BINARY_NAME} /path/to/dir     # Open a specific directory"
  echo "    ${BINARY_NAME} /path/to/file    # Open a specific file"
  echo ""
}

# ── Main ────────────────────────────────────────────────────────────

main() {
  printf "${BOLD}xTerm Installer${NC}\n"
  echo ""

  detect_platform
  detect_architecture
  info "Platform: ${PLATFORM}-${ARCH}"

  get_latest_version
  download_binary
  install_binary
  print_success
}

main "$@"

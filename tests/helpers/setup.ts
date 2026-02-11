// tests/helpers/setup.ts — Shared test setup utilities

import { createTestRenderer } from "@opentui/core/testing";
import type { TestRendererOptions } from "@opentui/core/testing";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// ── Test Renderer Helper ───────────────────────────────────────────

export const DEFAULT_TEST_WIDTH = 120;
export const DEFAULT_TEST_HEIGHT = 40;

export async function createTestEnv(options: TestRendererOptions = {}) {
  const result = await createTestRenderer({
    width: DEFAULT_TEST_WIDTH,
    height: DEFAULT_TEST_HEIGHT,
    useAlternateScreen: false,
    exitOnCtrlC: false,
    ...options,
  });

  return result;
}

// ── Temp Directory Helpers ─────────────────────────────────────────

export function createTempDir(prefix = "xterm-test-"): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function cleanupTempDir(dirPath: string): void {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors in tests
  }
}

export function createTempFile(
  dir: string,
  name: string,
  content: string,
): string {
  const filePath = path.join(dir, name);
  const fileDir = path.dirname(filePath);
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

// ── Async Helpers ──────────────────────────────────────────────────

/** Wait for a specified number of milliseconds */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

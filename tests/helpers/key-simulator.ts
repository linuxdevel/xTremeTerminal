// tests/helpers/key-simulator.ts — Keyboard input simulation helpers

import type { MockInput } from "@opentui/core/testing";

// ── Key Sequence Helpers ───────────────────────────────────────────

/** Press Ctrl+<key> */
export function pressCtrl(mockInput: MockInput, key: string): void {
  mockInput.pressKey(key, { ctrl: true });
}

/** Press Ctrl+Shift+<key> */
export function pressCtrlShift(mockInput: MockInput, key: string): void {
  mockInput.pressKey(key, { ctrl: true, shift: true });
}

/** Press a sequence of individual keys with optional delay */
export async function typeKeys(
  mockInput: MockInput,
  keys: string[],
  delayMs = 0,
): Promise<void> {
  await mockInput.pressKeys(keys, delayMs);
}

/** Navigate using arrow keys */
export function pressArrowUp(mockInput: MockInput, count = 1): void {
  for (let i = 0; i < count; i++) {
    mockInput.pressArrow("up");
  }
}

export function pressArrowDown(mockInput: MockInput, count = 1): void {
  for (let i = 0; i < count; i++) {
    mockInput.pressArrow("down");
  }
}

export function pressArrowLeft(mockInput: MockInput, count = 1): void {
  for (let i = 0; i < count; i++) {
    mockInput.pressArrow("left");
  }
}

export function pressArrowRight(mockInput: MockInput, count = 1): void {
  for (let i = 0; i < count; i++) {
    mockInput.pressArrow("right");
  }
}

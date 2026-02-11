// src/services/clipboard.ts — Internal clipboard buffer (no TUI dependency)

// ── Clipboard Service ──────────────────────────────────────────────

export class Clipboard {
  private buffer = "";

  /** Store text in the clipboard buffer. */
  copy(text: string): void {
    this.buffer = text;
  }

  /** Store text and return it (for cut operations that also need the text). */
  cut(text: string): string {
    this.buffer = text;
    return text;
  }

  /** Retrieve the stored text. */
  paste(): string {
    return this.buffer;
  }

  /** Check if the clipboard has content. */
  hasContent(): boolean {
    return this.buffer.length > 0;
  }

  /** Clear the clipboard buffer. */
  clear(): void {
    this.buffer = "";
  }
}

/** Shared clipboard instance for the application. */
export const clipboard = new Clipboard();

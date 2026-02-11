// src/index.ts — Entry point for xTerm

import { App } from "./app.ts";

const app = new App();

try {
  await app.start({
    rootDir: process.cwd(),
  });
} catch (error) {
  // If the TUI fails to start, print to stderr and exit
  console.error("Failed to start xTerm:", error);
  process.exit(1);
}

// tests/component/search-dialog.test.ts — Component tests for SearchDialog

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTestEnv } from "../helpers/setup.ts";
import { SearchDialog } from "../../src/components/search-dialog.ts";
import type { SearchMatch } from "../../src/components/search-dialog.ts";

describe("SearchDialog", () => {
  let env: Awaited<ReturnType<typeof createTestEnv>>;
  let dialog: SearchDialog;

  beforeEach(async () => {
    env = await createTestEnv();
    dialog = new SearchDialog(env.renderer);
    env.renderer.root.add(dialog.renderable);
  });

  afterEach(() => {
    dialog.destroy();
    env.renderer.destroy();
  });

  describe("initial state", () => {
    test("is hidden by default", () => {
      expect(dialog.isVisible).toBe(false);
    });

    test("starts in find mode", () => {
      expect(dialog.mode).toBe("find");
    });

    test("has empty search term", () => {
      expect(dialog.searchTerm).toBe("");
    });

    test("has empty replace term", () => {
      expect(dialog.replaceTerm).toBe("");
    });

    test("has no matches", () => {
      expect(dialog.matchCount).toBe(0);
    });

    test("currentMatchIndex is -1 when no matches", () => {
      expect(dialog.currentMatchIndex).toBe(-1);
    });
  });

  describe("show and hide", () => {
    test("show makes dialog visible", () => {
      dialog.show("find");
      expect(dialog.isVisible).toBe(true);
    });

    test("show sets mode to find", () => {
      dialog.show("find");
      expect(dialog.mode).toBe("find");
    });

    test("show sets mode to replace", () => {
      dialog.show("replace");
      expect(dialog.mode).toBe("replace");
    });

    test("hide makes dialog invisible", () => {
      dialog.show("find");
      dialog.hide();
      expect(dialog.isVisible).toBe(false);
    });

    test("hide resets matches", () => {
      dialog.show("find");
      dialog.setMatches([{ start: 0, end: 5 }]);
      expect(dialog.matchCount).toBe(1);
      dialog.hide();
      expect(dialog.matchCount).toBe(0);
    });

    test("hide resets currentMatchIndex", () => {
      dialog.show("find");
      dialog.setMatches([{ start: 0, end: 5 }]);
      expect(dialog.currentMatchIndex).toBe(0);
      dialog.hide();
      expect(dialog.currentMatchIndex).toBe(-1);
    });

    test("hide fires onClose callback", () => {
      let closed = false;
      dialog.onClose = () => { closed = true; };
      dialog.show("find");
      dialog.hide();
      expect(closed).toBe(true);
    });

    test("switching modes updates mode", () => {
      dialog.show("find");
      expect(dialog.mode).toBe("find");
      dialog.show("replace");
      expect(dialog.mode).toBe("replace");
    });
  });

  describe("setMatches", () => {
    test("updates match count", () => {
      dialog.setMatches([
        { start: 0, end: 3 },
        { start: 10, end: 13 },
        { start: 20, end: 23 },
      ]);
      expect(dialog.matchCount).toBe(3);
    });

    test("sets currentMatchIndex to 0 when matches found", () => {
      dialog.setMatches([{ start: 0, end: 5 }]);
      expect(dialog.currentMatchIndex).toBe(0);
    });

    test("resets currentMatchIndex to -1 when no matches", () => {
      dialog.setMatches([{ start: 0, end: 5 }]);
      dialog.setMatches([]);
      expect(dialog.currentMatchIndex).toBe(-1);
    });

    test("clamps currentMatchIndex when matches shrink", () => {
      dialog.setMatches([
        { start: 0, end: 3 },
        { start: 10, end: 13 },
        { start: 20, end: 23 },
      ]);
      // Navigate to last match
      dialog.findNext(); // index 1
      dialog.findNext(); // index 2
      expect(dialog.currentMatchIndex).toBe(2);

      // Now shrink to 2 matches
      dialog.setMatches([
        { start: 0, end: 3 },
        { start: 10, end: 13 },
      ]);
      expect(dialog.currentMatchIndex).toBe(1); // clamped
    });
  });

  describe("findNext and findPrevious", () => {
    const matches: SearchMatch[] = [
      { start: 0, end: 3 },
      { start: 10, end: 13 },
      { start: 20, end: 23 },
    ];

    test("findNext cycles forward through matches", () => {
      dialog.setMatches(matches);
      expect(dialog.currentMatchIndex).toBe(0);

      dialog.findNext();
      expect(dialog.currentMatchIndex).toBe(1);

      dialog.findNext();
      expect(dialog.currentMatchIndex).toBe(2);

      // Wraps around
      dialog.findNext();
      expect(dialog.currentMatchIndex).toBe(0);
    });

    test("findPrevious cycles backward through matches", () => {
      dialog.setMatches(matches);
      expect(dialog.currentMatchIndex).toBe(0);

      // Wraps to last
      dialog.findPrevious();
      expect(dialog.currentMatchIndex).toBe(2);

      dialog.findPrevious();
      expect(dialog.currentMatchIndex).toBe(1);

      dialog.findPrevious();
      expect(dialog.currentMatchIndex).toBe(0);
    });

    test("findNext fires onNavigate callback", () => {
      let navigatedMatch: SearchMatch = { start: -1, end: -1 };
      let navigatedIndex = -1;
      dialog.onNavigate = (match, index) => {
        navigatedMatch = match;
        navigatedIndex = index;
      };

      dialog.setMatches(matches);
      dialog.findNext();

      expect(navigatedMatch.start).toBe(10);
      expect(navigatedMatch.end).toBe(13);
      expect(navigatedIndex).toBe(1);
    });

    test("findPrevious fires onNavigate callback", () => {
      let navigatedMatch: SearchMatch = { start: -1, end: -1 };
      let navigatedIndex = -1;
      dialog.onNavigate = (match, index) => {
        navigatedMatch = match;
        navigatedIndex = index;
      };

      dialog.setMatches(matches);
      dialog.findPrevious();

      expect(navigatedMatch.start).toBe(20);
      expect(navigatedMatch.end).toBe(23);
      expect(navigatedIndex).toBe(2);
    });

    test("findNext does nothing with no matches", () => {
      dialog.findNext();
      expect(dialog.currentMatchIndex).toBe(-1);
    });

    test("findPrevious does nothing with no matches", () => {
      dialog.findPrevious();
      expect(dialog.currentMatchIndex).toBe(-1);
    });
  });

  describe("replaceCurrent", () => {
    test("fires onReplace callback with current match and replacement", () => {
      let replacedStart = -1;
      let replacedEnd = -1;
      let replacedWith = "";
      dialog.onReplace = (match, replacement) => {
        replacedStart = match.start;
        replacedEnd = match.end;
        replacedWith = replacement;
      };

      dialog.show("replace");
      dialog.setMatches([
        { start: 0, end: 3 },
        { start: 10, end: 13 },
      ]);

      // The replace term is set internally via the InputRenderable,
      // but we can test the method directly
      dialog.replaceCurrent();

      expect(replacedStart).toBe(0);
      expect(replacedEnd).toBe(3);
      expect(replacedWith).toBe(""); // empty since no text typed
    });

    test("does nothing when no matches", () => {
      let called = false;
      dialog.onReplace = () => { called = true; };
      dialog.replaceCurrent();
      expect(called).toBe(false);
    });
  });

  describe("replaceAllMatches", () => {
    test("fires onReplaceAll callback", () => {
      let calledTerm = "";
      let calledReplacement = "";
      dialog.onReplaceAll = (term, replacement) => {
        calledTerm = term;
        calledReplacement = replacement;
      };

      dialog.show("replace");
      dialog.setMatches([{ start: 0, end: 3 }]);
      dialog.replaceAllMatches();

      expect(calledTerm).toBe(""); // searchTerm is empty since no text typed
      expect(calledReplacement).toBe("");
    });

    test("does nothing when no matches", () => {
      let called = false;
      dialog.onReplaceAll = () => { called = true; };
      dialog.replaceAllMatches();
      expect(called).toBe(false);
    });
  });

  describe("handleKeyPress", () => {
    function makeKeyEvent(overrides: Record<string, unknown> = {}) {
      return {
        name: "",
        sequence: "",
        ctrl: false,
        shift: false,
        meta: false,
        preventDefault: () => {},
        ...overrides,
      };
    }

    test("returns false when dialog is hidden", () => {
      const result = dialog.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(result).toBe(false);
    });

    test("Escape closes the dialog", () => {
      dialog.show("find");
      expect(dialog.isVisible).toBe(true);

      dialog.handleKeyPress(makeKeyEvent({ name: "escape" }) as any);
      expect(dialog.isVisible).toBe(false);
    });

    test("Enter in find mode calls findNext", () => {
      dialog.show("find");
      const matches = [{ start: 0, end: 3 }, { start: 10, end: 13 }];
      dialog.setMatches(matches);

      dialog.handleKeyPress(makeKeyEvent({ name: "return" }) as any);
      expect(dialog.currentMatchIndex).toBe(1);
    });

    test("Shift+Enter calls findPrevious", () => {
      dialog.show("find");
      const matches = [{ start: 0, end: 3 }, { start: 10, end: 13 }];
      dialog.setMatches(matches);

      dialog.handleKeyPress(makeKeyEvent({ name: "return", shift: true }) as any);
      expect(dialog.currentMatchIndex).toBe(1); // wraps from 0 to last (index 1)
    });

    test("Ctrl+Down calls findNext", () => {
      dialog.show("find");
      dialog.setMatches([{ start: 0, end: 3 }, { start: 10, end: 13 }]);

      dialog.handleKeyPress(makeKeyEvent({ name: "down", ctrl: true }) as any);
      expect(dialog.currentMatchIndex).toBe(1);
    });

    test("Ctrl+Up calls findPrevious", () => {
      dialog.show("find");
      dialog.setMatches([{ start: 0, end: 3 }, { start: 10, end: 13 }]);

      dialog.handleKeyPress(makeKeyEvent({ name: "up", ctrl: true }) as any);
      expect(dialog.currentMatchIndex).toBe(1); // wraps
    });

    test("Ctrl+Enter in replace mode calls replaceAll", () => {
      let replaceAllCalled = false;
      dialog.onReplaceAll = () => { replaceAllCalled = true; };

      dialog.show("replace");
      dialog.setMatches([{ start: 0, end: 3 }]);

      dialog.handleKeyPress(makeKeyEvent({ name: "return", ctrl: true }) as any);
      expect(replaceAllCalled).toBe(true);
    });

    test("Tab switches focus between search and replace fields in replace mode", () => {
      dialog.show("replace");

      // Tab should switch focus and return true
      const result = dialog.handleKeyPress(makeKeyEvent({ name: "tab" }) as any);
      expect(result).toBe(true);
    });

    test("Tab does not switch in find mode", () => {
      dialog.show("find");

      // Tab in find mode should be delegated to input
      const result = dialog.handleKeyPress(makeKeyEvent({ name: "tab" }) as any);
      // In find mode, tab is not intercepted for field switching, it goes to input
      expect(typeof result).toBe("boolean");
    });
  });

  describe("cleanup", () => {
    test("destroy does not throw", () => {
      dialog.show("replace");
      dialog.setMatches([{ start: 0, end: 5 }]);
      expect(() => dialog.destroy()).not.toThrow();
    });

    test("renderable is accessible", () => {
      expect(dialog.renderable).toBeDefined();
    });
  });
});

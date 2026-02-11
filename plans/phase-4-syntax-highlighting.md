# Phase 4: Syntax Highlighting

## Goal
Add Tree-sitter powered syntax highlighting to the editor using OpenTUI's `CodeRenderable` and `SyntaxStyle`, with a complete Tokyo Night color scheme for all supported languages.

## Dependencies
- Phase 3 completed (editor core, language detection)

## Steps

### 4.1 Expand Theme with Syntax Styles (`src/theme.ts`)
Create a comprehensive `SyntaxStyle` using `SyntaxStyle.fromStyles()`:

```typescript
import { SyntaxStyle, RGBA } from "@opentui/core"

export const SYNTAX_STYLE = SyntaxStyle.fromStyles({
  // Keywords
  keyword:              { fg: RGBA.fromHex("#bb9af7"), bold: true },
  "keyword.import":     { fg: RGBA.fromHex("#7aa2f7"), bold: true },
  "keyword.operator":   { fg: RGBA.fromHex("#bb9af7") },
  "keyword.return":     { fg: RGBA.fromHex("#bb9af7"), bold: true },

  // Strings
  string:               { fg: RGBA.fromHex("#9ece6a") },
  "string.special":     { fg: RGBA.fromHex("#9ece6a"), italic: true },

  // Comments
  comment:              { fg: RGBA.fromHex("#565f89"), italic: true },

  // Numbers & constants
  number:               { fg: RGBA.fromHex("#ff9e64") },
  boolean:              { fg: RGBA.fromHex("#ff9e64") },
  constant:             { fg: RGBA.fromHex("#ff9e64") },

  // Functions
  function:             { fg: RGBA.fromHex("#7aa2f7") },
  "function.call":      { fg: RGBA.fromHex("#7aa2f7") },
  "function.method":    { fg: RGBA.fromHex("#7aa2f7") },

  // Types
  type:                 { fg: RGBA.fromHex("#2ac3de") },
  constructor:          { fg: RGBA.fromHex("#2ac3de") },

  // Variables
  variable:             { fg: RGBA.fromHex("#c0caf5") },
  "variable.member":    { fg: RGBA.fromHex("#7dcfff") },
  property:             { fg: RGBA.fromHex("#7dcfff") },

  // Operators & punctuation
  operator:             { fg: RGBA.fromHex("#89ddff") },
  punctuation:          { fg: RGBA.fromHex("#c0caf5") },
  "punctuation.bracket":{ fg: RGBA.fromHex("#c0caf5") },

  // Tags (HTML/JSX)
  tag:                  { fg: RGBA.fromHex("#f7768e") },
  "tag.attribute":      { fg: RGBA.fromHex("#bb9af7") },

  // Markup (Markdown)
  "markup.heading":     { fg: RGBA.fromHex("#7aa2f7"), bold: true },
  "markup.bold":        { fg: RGBA.fromHex("#c0caf5"), bold: true },
  "markup.italic":      { fg: RGBA.fromHex("#c0caf5"), italic: true },
  "markup.link":        { fg: RGBA.fromHex("#7aa2f7"), underline: true },
  "markup.raw":         { fg: RGBA.fromHex("#9ece6a") },
  "markup.list":        { fg: RGBA.fromHex("#f7768e") },

  // Default fallback
  default:              { fg: RGBA.fromHex("#a9b1d6") },
})
```

### 4.2 Implement Syntax Highlighting in Editor
Two approaches, choose based on what works best:

**Approach A: CodeRenderable for display, TextareaRenderable for editing**
- When the editor has focus (editing mode): show TextareaRenderable
- When the editor loses focus (viewing mode): swap to CodeRenderable for highlighted display
- This gives full editing capability with highlighted display

**Approach B: CodeRenderable with custom editing layer**
- Use CodeRenderable for display with syntax highlighting
- Layer a transparent editing handler on top
- More complex but provides syntax highlighting while editing

**Recommended: Approach A** - simpler to implement and more robust.

### 4.3 CodeRenderable Setup
```typescript
const code = new CodeRenderable(renderer, {
  id: "editor-code-view",
  content: fileContent,
  filetype: detectedLanguage,  // from language-detect.ts
  syntaxStyle: SYNTAX_STYLE,
  width: "100%",
  wrapMode: "none",
  selectable: true,
  selectionBg: BG_SELECTION,
})
```

### 4.4 Language Detection Integration
- When a file is loaded, call `detectLanguage(filePath)` to get the language
- Pass the language to CodeRenderable's `filetype` property
- Update the status bar with the detected language name
- If no language detected, display without highlighting

### 4.5 Write Tests

**Unit tests:**
- `tests/unit/theme.test.ts` (extended):
  - SYNTAX_STYLE is a valid SyntaxStyle instance
  - All expected token types have styles defined
  - Color values are valid RGBA instances

## Files Created/Modified
- `src/theme.ts` (modified - add SYNTAX_STYLE)
- `src/components/editor.ts` (modified - add CodeRenderable for display)
- `tests/unit/theme.test.ts` (modified - add syntax style tests)

## Acceptance Criteria
- [ ] Opening a TypeScript file shows syntax highlighting
- [ ] Opening a JavaScript file shows syntax highlighting
- [ ] Opening a Markdown file shows syntax highlighting
- [ ] Colors match the Tokyo Night palette
- [ ] Keywords, strings, comments, functions are all distinctly colored
- [ ] Unknown file types display without highlighting (plain text)
- [ ] Status bar shows detected language
- [ ] All tests pass

## OpenTUI Components Used
- `CodeRenderable` - Syntax highlighted code display
- `SyntaxStyle` - Token style definitions
- `RGBA` - Color values

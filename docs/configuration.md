# Configuration

xTerm uses a Tokyo Night inspired dark theme by default. This document describes the theme configuration and customization options.

## Theme

### Color Palette

xTerm uses the following color palette, inspired by the [Tokyo Night](https://github.com/enkia/tokyo-night-vscode-theme) VS Code theme:

#### Background Colors

| Constant | Hex | Usage |
|----------|-----|-------|
| `BG_PRIMARY` | `#1a1b26` | Editor background |
| `BG_SECONDARY` | `#16161e` | Sidebar, tab bar, status bar |
| `BG_HIGHLIGHT` | `#24283b` | Current line, hover state, selected tree item |
| `BG_SELECTION` | `#283457` | Text selection in editor |

#### Foreground Colors

| Constant | Hex | Usage |
|----------|-----|-------|
| `FG_PRIMARY` | `#a9b1d6` | Default text, file names |
| `FG_SECONDARY` | `#565f89` | Comments, disabled items, inactive tabs |
| `FG_MUTED` | `#3b4261` | Line numbers, borders, separators |

#### Accent Colors

| Constant | Hex | Usage |
|----------|-----|-------|
| `ACCENT` | `#7aa2f7` | Active tab, focused elements, cursor, links |
| `ERROR` | `#f7768e` | Error messages, delete indicators |
| `WARNING` | `#e0af68` | Warning messages, modified indicators |
| `SUCCESS` | `#9ece6a` | Success messages, strings in syntax |
| `INFO` | `#7dcfff` | Info messages, types in syntax |

### Syntax Highlighting Colors

The syntax highlighting theme follows Tokyo Night conventions:

| Token Type | Color | Example |
|-----------|-------|---------|
| Keywords | `#bb9af7` (purple) | `const`, `function`, `return`, `if` |
| Strings | `#9ece6a` (green) | `"hello world"` |
| Comments | `#565f89` (gray, italic) | `// this is a comment` |
| Numbers | `#ff9e64` (orange) | `42`, `3.14`, `true` |
| Functions | `#7aa2f7` (blue) | `console.log()`, `fetch()` |
| Types | `#2ac3de` (cyan) | `string`, `number`, `interface` |
| Variables | `#c0caf5` (light blue) | `myVariable`, `data` |
| Properties | `#7dcfff` (sky blue) | `.length`, `.name` |
| Operators | `#89ddff` (light cyan) | `=`, `+`, `=>`, `&&` |
| Tags (HTML) | `#f7768e` (red) | `<div>`, `<span>` |
| Attributes | `#bb9af7` (purple) | `class=`, `id=` |

### UI Element Styling

| Element | Background | Foreground | Notes |
|---------|-----------|------------|-------|
| Editor | `BG_PRIMARY` | `FG_PRIMARY` | Main editing area |
| Sidebar | `BG_SECONDARY` | `FG_PRIMARY` | File tree container |
| Tab bar | `BG_SECONDARY` | `FG_SECONDARY` | Inactive tab area |
| Active tab | `BG_PRIMARY` | `ACCENT` | Currently selected tab |
| Inactive tab | `BG_SECONDARY` | `FG_SECONDARY` | Other tabs |
| Modified tab | `BG_SECONDARY` | `WARNING` | Dot indicator |
| Status bar | `BG_SECONDARY` | `FG_PRIMARY` | Bottom status |
| Line numbers | `BG_SECONDARY` | `FG_MUTED` | Gutter |
| Current line | `BG_HIGHLIGHT` | - | Highlighted line |
| Selection | `BG_SELECTION` | - | Selected text |
| Search match | `#e0af68` bg | - | Highlighted matches |
| Active match | `#ff9e64` bg | - | Current match |
| Scrollbar track | `BG_SECONDARY` | - | Scrollbar background |
| Scrollbar thumb | `FG_MUTED` | - | Scrollbar indicator |
| Dialog overlay | `BG_HIGHLIGHT` | `FG_PRIMARY` | Confirm/search dialogs |
| Command palette | `BG_HIGHLIGHT` | `FG_PRIMARY` | Command list |

## Editor Settings

### Indentation

Default: 4 spaces. The editor uses soft tabs (spaces) by default.

### Word Wrap

Default: Off (no wrap). Code is displayed without line wrapping. Use horizontal scrolling for long lines.

### Encoding

Default: UTF-8. xTerm reads and writes files in UTF-8 encoding.

## File Handling

### File Size Limits

| Size | Behavior |
|------|----------|
| < 1 MB | Opens normally |
| 1 MB - 10 MB | Warning shown before opening |
| > 10 MB | Refused (too large for terminal editing) |

### Binary Files

Binary files (detected by null bytes in the first 8KB) are not opened for editing. xTerm displays a message: "Binary file - cannot edit".

Known binary extensions that skip content detection:
`.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.ico`, `.svg`, `.mp3`, `.mp4`, `.avi`,
`.zip`, `.tar`, `.gz`, `.7z`, `.rar`, `.exe`, `.dll`, `.so`, `.dylib`, `.o`,
`.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`

### Auto-Detection

| Feature | Method |
|---------|--------|
| Language | File extension mapping (see `src/utils/language-detect.ts`) |
| Encoding | Always UTF-8 |
| Line endings | Detected from file content |

## Terminal Requirements

| Feature | Minimum | Recommended |
|---------|---------|-------------|
| Terminal size | 40 x 10 | 120 x 40 or larger |
| Color support | 256 colors | True color (24-bit) |
| Alternate screen | Required | Required |
| Mouse support | Optional | Recommended |
| Unicode | Basic | Full (for file icons) |

## Environment Variables

xTerm inherits OpenTUI's environment variable support:

| Variable | Description |
|----------|-------------|
| `OTUI_NO_NATIVE_RENDER` | Disable native rendering (for testing) |
| `OTUI_USE_ALTERNATE_SCREEN` | Override alternate screen setting |
| `OTUI_SHOW_STATS` | Show debug overlay |

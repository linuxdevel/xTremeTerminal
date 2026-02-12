# Theme & UI Constants

The application uses a **Tokyo Night** inspired dark color palette.
All values are defined in `src/theme.ts`.

## Color Palette

| Token           | Hex       | Usage                                  |
|-----------------|-----------|----------------------------------------|
| `BG_PRIMARY`    | `#1a1b26` | Editor background                      |
| `BG_SECONDARY`  | `#16161e` | Sidebar, tab bar, status bar bg        |
| `BG_HIGHLIGHT`  | `#24283b` | Current line, hover highlight          |
| `BG_SELECTION`  | `#283457` | Text selection                         |
| `FG_PRIMARY`    | `#a9b1d6` | Default text                           |
| `FG_SECONDARY`  | `#565f89` | Comments, disabled text                |
| `FG_MUTED`      | `#3b4261` | Line numbers, borders                  |
| `ACCENT`        | `#7aa2f7` | Active tab, focused elements           |
| `ERROR`         | `#f7768e` | Error indicators                       |
| `WARNING`       | `#e0af68` | Warning indicators                     |
| `SUCCESS`       | `#9ece6a` | Success indicators                     |
| `INFO`          | `#7dcfff` | Info indicators                        |

## Syntax Styles

`SYNTAX_STYLE` in `src/theme.ts` maps Tree-sitter token types to colors.
Includes: keyword, string, comment, function, type, boolean, constructor,
variable.member, string.escape, function.call, markup.* tokens, and more.

When adding a new token type, add it to the `SYNTAX_STYLE` object and
include a test in `tests/unit/theme.test.ts`.

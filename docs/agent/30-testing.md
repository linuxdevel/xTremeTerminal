# Testing

## Framework

- **Bun's built-in test runner** (`bun test`)
- Jest-compatible API: `describe`, `test`, `expect`, `beforeEach`, `afterEach`, `mock`
- Import from `bun:test`

## Running Tests

```bash
bun test                      # All tests (run to check current count)
bun test tests/unit           # Unit tests only
bun test tests/component      # Component tests only
bun test tests/integration    # Integration tests only
bun test --coverage           # With coverage
bun test --watch              # Watch mode
```

## Test Categories

| Category      | Directory              | Renderer? | Speed  | Notes                                         |
|---------------|------------------------|-----------|--------|-----------------------------------------------|
| Unit          | `tests/unit/`          | No        | Fast   | Services + utilities in isolation              |
| Component     | `tests/component/`     | Headless  | Medium | Individual TUI components                      |
| Integration   | `tests/integration/`   | Headless  | Slow   | Full user workflows with simulated keyboard    |

## Headless Renderer Setup

Component and integration tests use a headless renderer:

```typescript
// Environment variable (set in tests/helpers/setup.ts)
process.env.OTUI_NO_NATIVE_RENDER = "true"

// Renderer creation
const renderer = await createCliRenderer({
  exitOnCtrlC: false,
  useAlternateScreen: false,
})
```

## Test Conventions

- Each source file gets a matching `<module>.test.ts`
- Use `describe()` blocks to group related tests
- Test names describe expected behavior: `"should save file when Ctrl+S is pressed"`
- `beforeEach` for fresh state; `afterEach` for cleanup (temp files, renderer.destroy)
- Integration tests **must** use temporary directories (never modify real filesystem outside `/tmp`)
- Mock filesystem in unit tests; use real filesystem in integration tests

## Test Helpers

| File                          | Purpose                                             |
|-------------------------------|-----------------------------------------------------|
| `tests/helpers/setup.ts`     | Headless renderer factory, temp directory utilities  |
| `tests/helpers/key-simulator.ts` | Simulates keyboard input via renderer keyInput   |

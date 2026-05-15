# Development

## Setup

```bash
git clone <repo>
cd project-validator
pnpm install
pnpm build
```

## Project Structure

```
project-validator/
├── packages/
│   ├── core/          # Validation engine
│   ├── cli/           # CLI binary
│   └── adapters/      # Framework adapters
├── docs/              # Documentation
├── test/              # Test fixtures
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @project-validator/core build
```

## Test

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @project-validator/core test

# Run tests in watch mode
pnpm --filter @project-validator/core test -- --watch
```

## Adding a Validator

1. Create a new file in `packages/core/src/validators/<phase>/`
2. Implement the `ValidatorModule` interface
3. Export it from the phase's `index.ts`
4. Add it to `getDefaultValidators()` in `packages/core/src/validators/index.ts`

## Adding a Reporter

1. Create a new file in `packages/core/src/reporters/`
2. Implement the `ReporterModule` interface
3. Export it from `packages/core/src/reporters/index.ts`
4. Register it in the orchestrator (`packages/core/src/index.ts`)

## Adding a Framework Detector

1. Add a new `FrameworkDetector` in `packages/core/src/resolver/framework-detector.ts`
2. Set the appropriate priority (higher = checked first)
3. Implement the `detect()` method

## Debugging

```bash
# Run with Node.js inspector
node --inspect-brk node_modules/.bin/project-validate scan

# Run specific phase with verbose output
project-validate static --verbose

# Test against a specific project
project-validate scan --cwd /path/to/project
```

## Caching

The validator uses `.cache/project-validator/` for:
- Dependency graph caches
- AST analysis maps
- File hashes

Clear with:

```bash
rm -rf .cache/project-validator
```

## CI Integration

### GitHub Actions

```yaml
- name: Run validation
  run: npx project-validate scan --json
```

The GitHub Actions reporter automatically generates annotations for issues.

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No critical or high issues |
| 1 | Critical or high issues found |

## Publishing

```bash
# Build all packages
pnpm build

# Publish
pnpm publish -r --access public
```

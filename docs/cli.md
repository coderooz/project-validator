# CLI Reference

## Usage

```bash
project-validate [command] [options]
```

## Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `-c, --cwd <path>` | Working directory | `process.cwd()` |
| `-V, --version` | Show version | |
| `-h, --help` | Show help | |

## Commands

### `scan`

Run all validation phases.

```bash
project-validate scan [options]
```

Options:
- `--json` — Generate JSON report
- `--markdown` — Generate Markdown report

### `static`

Run static analysis phase only.

```bash
project-validate static
```

Checks:
- tsconfig validation
- ESLint validation
- Circular dependency detection
- Unused export detection
- Architecture violations

### `compile`

Run compile validation phase only.

```bash
project-validate compile
```

Checks:
- TypeScript compilation (`tsc --noEmit`)
- Framework build validation

### `runtime`

Run runtime validation phase only.

```bash
project-validate runtime
```

Checks:
- Dev server boot validation
- Route accessibility testing
- API endpoint smoke testing

### `health`

Evaluate project health score.

```bash
project-validate health
```

Output:
```
Health Score: 82/100
  Type Safety: 90/100
  Architecture: 74/100
  Runtime Stability: 81/100
  Dependency Health: 65/100
  Build Reliability: 88/100
```

### `doctor`

Run diagnostics with root cause analysis.

```bash
project-validate doctor
```

Output provides root cause detection for common failure patterns including:
- Missing ENV variables and their cascading failures
- TypeScript compilation errors
- Circular dependencies
- Webpack critical dependencies
- ESLint violations

### `report`

Generate validation report in specified formats.

```bash
project-validate report [options]
```

Options:
- `-f, --format <format>` — Report format: `json`, `markdown`, or `both` (default: `both`)

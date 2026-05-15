# @project-validator

A **universal project validation engine** for modern software projects. Scans, analyzes, and validates codebases across multiple frameworks and languages with static analysis, compile validation, runtime checks, and health scoring.

## Features

- **Framework Detection** — Auto-detects Next.js, React, Node.js, Express, NestJS and more
- **Static Analysis** — tsconfig, ESLint, circular dependencies, unused exports, architecture violations
- **Environment Validation** — Required/optional env var checking
- **Compile Validation** — TypeScript compilation, framework build checks
- **Runtime Validation** — Dev server boot, route probing, API smoke tests
- **Dependency Graph** — Full import tracing, circular dependency mapping
- **Health Scoring** — Weighted scoring across Type Safety, Architecture, Runtime, Dependencies, Build
- **Doctor Mode** — Root cause analysis with cascading failure detection
- **Multi-format Reporting** — Console, JSON, Markdown, GitHub Actions annotations
- **Plugin System** — Extensible with custom validators, reporters, and hooks

## Installation

```bash
npm install -D @project-validator/cli
# or
pnpm add -D @project-validator/cli
# or
yarn add -D @project-validator/cli
```

## Quick Start

```bash
# Run full validation
project-validate scan

# Run specific phases
project-validate static
project-validate compile
project-validate runtime

# Check health score
project-validate health

# Get diagnostics
project-validate doctor

# Generate report
project-validate report --format markdown
```

## Commands

| Command | Description |
|---------|-------------|
| `scan` | Run all validation phases |
| `static` | Static analysis only (tsconfig, ESLint, circular deps, unused exports, architecture) |
| `compile` | Compile validation only (TypeScript, build) |
| `runtime` | Runtime validation only (server boot, routes, APIs) |
| `health` | Evaluate project health score |
| `doctor` | Run diagnostics with root cause analysis |
| `report` | Generate report in specified format |

## Configuration

Create `project-validator.config.json` in your project root:

```json
{
  "include": ["src/**/*.{ts,tsx}"],
  "exclude": ["**/node_modules/**", "**/dist/**"],
  "phases": {
    "static": { "enabled": true },
    "compile": { "enabled": true },
    "runtime": { "enabled": false }
  },
  "timeout": 120000,
  "reporters": ["console", "json"]
}
```

## API Usage

```typescript
import { validate } from '@project-validator/core';

const report = await validate({
  cwd: '/path/to/project',
  phases: ['static', 'compile'],
});

console.log(`Health: ${report.healthScore.overall}/100`);
console.log(`Issues: ${report.summary.issues}`);
```

## Architecture

```
Project Scanner → Framework Resolver → Language Resolver
    ↓
Dependency Graph Builder
    ↓
Validation Pipeline
  ├── Static Phase
  ├── Environment Phase
  ├── Architecture Phase
  ├── Compile Phase
  ├── Runtime Phase
  └── Security Phase
    ↓
Result Aggregator → Health Scorer → Reporter Engine
```

## Packages

| Package | Description |
|---------|-------------|
| `@project-validator/core` | Validation engine (scanner, graph, pipeline, validators, scoring, reporting) |
| `@project-validator/cli` | CLI binary with Commander commands |
| `@project-validator/adapters` | Framework adapters (Next.js, React) |

## License

MIT

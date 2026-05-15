# Architecture

## Layered Design

The validator uses a layered pipeline architecture designed for extensibility and maintainability.

### Layer 1: Scanner & Resolver

```
scanFiles(rootPath) → FileInfo[]
resolveProject(rootPath, files) → ProjectInfo
detectFramework(rootPath) → FrameworkType
resolveLanguageAdapter(files) → LanguageAdapter
```

The scanner discovers all relevant files in the project. The resolver determines the framework type, language, and entry points.

### Layer 2: Dependency Graph

```
buildDependencyGraph(files, entryPoints, rootPath) → DependencyGraph
```

Constructs a directed graph of module dependencies by parsing import statements. Supports:
- Static imports (`import { x } from './module'`)
- Dynamic imports (`import('./module')`)
- CommonJS requires (`require('./module')`)
- TypeScript path aliases (`@/`, `~/`)
- Relative imports (`./`, `../`)

### Layer 3: Validation Pipeline

```
ValidationPipeline
  ├── register(validator)     → register validators
  ├── run(project, graph)     → run all phases
  └── runPhase(phase)         → run single phase
```

Phases execute in order: `static → environment → architecture → compile → runtime → security`

Each phase runs registered validators and collects results. The pipeline is resilient to validator crashes.

### Layer 4: Scoring & Diagnostics

```
calculateHealthScore(results) → HealthScore
diagnose(issues) → Diagnosis[]
```

Health scoring uses weighted categories:
- Type Safety: 25% (TYPESCRIPT issues)
- Architecture: 20% (ARCHITECTURE, CIRCULAR_DEPENDENCY)
- Runtime Stability: 20% (RUNTIME_IMPORT, SERVER_ACTION, HYDRATION)
- Dependency Health: 15% (DEPENDENCY, UNUSED_EXPORT)
- Build Reliability: 20% (BUILD_SYSTEM, NEXT_CONFIG, WEBPACK, ESLINT)

Doctor mode correlates failures to detect root causes and cascading failures.

### Layer 5: Reporting

```
ReporterModule.write(report) → void
```

Support for multiple output formats:
- Console (ANSI-colored terminal output)
- JSON (structured data for CI)
- Markdown (readable report files)
- GitHub Actions (annotations for PRs)

## Type System

Core types are in `src/types.ts` and include:
- `ValidationIssue` — Individual problem with category, severity, location
- `ValidationResult` — Result of a single validator execution
- `ValidationReport` — Complete report with all results, health, summary
- `DependencyGraph` — Module graph with nodes and circular deps
- `ValidatorModule` — Interface for pluggable validators
- `ReporterModule` — Interface for output formats

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha.1] - 2026-05-15

### Added

- **Core Engine**: Complete validation pipeline with 6 phases (static, environment, architecture, compile, runtime, security)
- **Framework Detection**: Auto-detects Next.js, React, Node.js, Express, NestJS, and generic projects
- **Static Validators**: tsconfig validation, ESLint, circular dependencies, unused exports, architecture rules
- **Environment Validator**: Required and optional env var checking with framework-specific defaults
- **Compile Validators**: TypeScript compilation (`tsc --noEmit`), framework build validation
- **Runtime Validators**: Dev server boot, route probing, API endpoint smoke testing
- **Dependency Graph**: Full import tracing with circular dependency mapping
- **Health Scoring**: Multi-category weighted scoring (Type Safety, Architecture, Runtime, Dependencies, Build)
- **Doctor Mode**: Root cause analysis with cascading failure detection
- **Reporters**: Console (ANSI), JSON, Markdown, GitHub Actions annotations
- **Plugin System**: Extensible with hooks, custom validators, custom reporters
- **Framework Adapters**: Next.js adapter (App Router, middleware, server actions), React adapter (hooks rules)
- **CLI**: 7 commands (scan, static, compile, runtime, health, doctor, report)
- **Configuration**: JSON config file support with phase toggles and path filtering

### Build

- pnpm workspace monorepo with 3 packages (core, cli, adapters)
- tsup bundling (ESM + DTS generation)
- TypeScript strict mode
- 23 unit tests covering all major components

# Plugin System

The validator supports an extensible plugin system with hooks, custom validators, and custom reporters.

## Plugin Interface

```typescript
interface ValidatorPlugin {
  name: string;
  version: string;
  hooks?: {
    beforeScan?: (config: ProjectValidatorConfig) => Promise<void>;
    afterScan?: (project: ProjectInfo) => Promise<void>;
    beforeValidate?: (project: ProjectInfo) => Promise<void>;
    afterValidate?: (report: ValidationReport) => Promise<void>;
    beforeReport?: (report: ValidationReport) => Promise<void>;
  };
  validators?: ValidatorModule[];
  reporters?: ReporterModule[];
}
```

## Creating a Validator

```typescript
import { ValidatorModule, ValidationContext, ValidationResult } from '@project-validator/core';

const myValidator: ValidatorModule = {
  name: 'my-custom-validator',
  phase: 'static',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues = [];

    // Your validation logic here
    for (const file of context.project.files) {
      // Check something...
    }

    return {
      phase: 'static',
      name: 'my-custom-validator',
      passed: issues.length === 0,
      issues,
      duration: 0,
    };
  },
};
```

## Creating a Reporter

```typescript
import { ReporterModule, ValidationReport } from '@project-validator/core';

const myReporter: ReporterModule = {
  name: 'my-reporter',
  async write(report: ValidationReport): Promise<void> {
    // Your reporting logic here
    console.log(`Project: ${report.project.name}`);
    console.log(`Score: ${report.healthScore.overall}/100`);
  },
};
```

## Using Plugins

```typescript
import { PluginRegistry } from '@project-validator/core';

const registry = createPluginRegistry();

registry.register({
  name: 'my-plugin',
  version: '1.0.0',
  validators: [myValidator],
  reporters: [myReporter],
});
```

## Framework Adapters

Framework adapters provide framework-specific validation logic.

### Next.js Adapter

```typescript
import { createNextAdapter } from '@project-validator/adapters';

const adapter = createNextAdapter({
  checkAppRouter: true,
  checkPagesRouter: true,
  checkMiddleware: true,
  checkServerActions: true,
});
```

### React Adapter

```typescript
import { createReactAdapter } from '@project-validator/adapters';

const adapter = createReactAdapter({
  checkHooksRules: true,
  checkJsxKey: true,
});
```

## Language Adapters

The architecture supports future language adapters for:
- Python (`.py`)
- Go (`.go`)
- Rust (`.rs`)
- Java (`.java`)

Each language adapter provides:
- File extension mapping
- Entry point detection
- Language-specific validation rules

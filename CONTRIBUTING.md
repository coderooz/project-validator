# Contributing to project-validator

First off, thank you for considering contributing! We welcome contributions from everyone.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/coderooz/project-validator/issues)
2. If not, create a new issue using the **Bug Report** template
3. Include as much detail as possible, especially:
   - Version of project-validator
   - OS and Node.js version
   - Steps to reproduce
   - Expected vs actual behavior

### Suggesting Features

1. Open a **Feature Request** issue using the template
2. Clearly describe the problem and your proposed solution
3. Explain why this would benefit the project

### Setting Up Development

```bash
# Clone the repository
git clone https://github.com/coderooz/project-validator.git
cd project-validator

# Install pnpm (if not installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Development Workflow

1. Create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```

2. Make your changes following our conventions:
   - Write tests for new functionality
   - Keep the code modular and well-typed (strict TypeScript)
   - Follow existing patterns in the codebase
   - Update documentation if needed

3. Run checks locally:
   ```bash
   pnpm build    # Must pass
   pnpm test     # Must pass
   ```

4. Commit using [conventional commits](https://www.conventionalcommits.org/):
   ```
   feat(scope): description
   fix(scope): description
   docs: description
   test: description
   ```

5. Push and create a Pull Request

### Pull Request Guidelines

- Fill out the PR template completely
- Keep PRs focused on a single change
- Link to any related issues
- Ensure CI passes
- Request review from maintainers

## Project Structure

```
project-validator/
├── packages/
│   ├── core/          # Validation engine (scanner, graph, pipeline, validators)
│   ├── cli/           # CLI binary (Commander commands)
│   └── adapters/      # Framework adapters (Next.js, React)
├── docs/              # Documentation
└── test/              # Test fixtures
```

## Adding a Validator

1. Create file in `packages/core/src/validators/<phase>/`
2. Implement `ValidatorModule` interface
3. Export from phase's `index.ts`
4. Add to `getDefaultValidators()` in `validators/index.ts`
5. Write tests in `packages/core/test/`

## Adding a Reporter

1. Create file in `packages/core/src/reporters/`
2. Implement `ReporterModule` interface
3. Export from `reporters/index.ts`
4. Register in orchestrator (`core/src/index.ts`)

## Questions?

- Open a [Discussion](https://github.com/coderooz/project-validator/discussions)
- Email: contact@coderooz.in

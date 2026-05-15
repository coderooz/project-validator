import { describe, it, expect } from 'vitest';
import { tsconfigValidator } from '../src/validators/static/tsconfig-validator.js';
import { envValidator } from '../src/validators/static/env-validator.js';
import { architectureValidator } from '../src/validators/static/architecture-validator.js';
import { circularDependencyValidator } from '../src/validators/static/circular-dependency-validator.js';
import { scanFiles } from '../src/scanner/file-scanner.js';
import { resolveProject } from '../src/scanner/framework-resolver.js';
import { buildDependencyGraph } from '../src/graph/dependency-graph.js';
import { createContext } from '../src/pipeline/context.js';
import { resolve } from 'node:path';
import type { ProjectValidatorConfig } from '../src/types.js';

const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures', 'sample-project');

const defaultConfig: ProjectValidatorConfig = {
  include: ['src/**/*.ts'],
  exclude: ['node_modules'],
  phases: { static: { enabled: true } },
  timeout: 30000,
  reporters: ['console'],
};

async function createTestContext() {
  const files = await scanFiles(FIXTURES_DIR);
  const project = await resolveProject(FIXTURES_DIR, files);
  const graph = await buildDependencyGraph(files, project.framework.entryPoints, FIXTURES_DIR);
  return createContext(project, graph, defaultConfig);
}

describe('tsconfigValidator', () => {
  it('should validate tsconfig.json', async () => {
    const context = await createTestContext();
    const result = await tsconfigValidator.validate(context);
    expect(result.name).toBe('tsconfig-validator');
    expect(result.phase).toBe('static');
    expect(Array.isArray(result.issues)).toBe(true);
  });
});

describe('envValidator', () => {
  it('should check environment variables', async () => {
    const context = await createTestContext();
    const result = await envValidator.validate(context);
    expect(result.name).toBe('env-validator');
    expect(result.phase).toBe('environment');
  });
});

describe('architectureValidator', () => {
  it('should scan for architecture violations', async () => {
    const context = await createTestContext();
    const result = await architectureValidator.validate(context);
    expect(result.name).toBe('architecture');
    expect(result.phase).toBe('static');

    const consoleLogIssues = result.issues.filter(i => i.message.includes('console.log'));
    expect(consoleLogIssues.length).toBeGreaterThan(0);
  });
});

describe('circularDependencyValidator', () => {
  it('should detect circular dependencies', async () => {
    const context = await createTestContext();
    const result = await circularDependencyValidator.validate(context);
    expect(result.name).toBe('circular-dependency');
    expect(result.phase).toBe('static');
  });
});

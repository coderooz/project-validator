import { describe, it, expect } from 'vitest';
import { extractImports, resolveImportPath, isExternalImport } from '../src/graph/import-resolver.js';
import { buildDependencyGraph } from '../src/graph/dependency-graph.js';
import { scanFiles } from '../src/scanner/file-scanner.js';
import { resolveProject } from '../src/scanner/framework-resolver.js';
import { resolve } from 'node:path';

const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures', 'sample-project');

describe('Import Resolver', () => {
  it('should extract imports from code', () => {
    const code = `
      import { greet } from './index';
      import fs from 'node:fs';
      import type { SomeType } from './types';
      const x = require('./utils');
    `;
    const imports = extractImports(code);
    expect(imports).toContain('./index');
    expect(imports).toContain('node:fs');
    expect(imports).toContain('./types');
    expect(imports).toContain('./utils');
  });

  it('should detect external imports', () => {
    expect(isExternalImport('react')).toBe(true);
    expect(isExternalImport('next/router')).toBe(true);
    expect(isExternalImport('./local')).toBe(false);
    expect(isExternalImport('@/alias')).toBe(false);
    expect(isExternalImport('~/alias')).toBe(false);
  });
});

describe('Dependency Graph', () => {
  it('should build a dependency graph', async () => {
    const files = await scanFiles(FIXTURES_DIR);
    const project = await resolveProject(FIXTURES_DIR, files);
    const graph = await buildDependencyGraph(files, project.framework.entryPoints, FIXTURES_DIR);

    expect(graph.nodes.size).toBeGreaterThan(0);
    expect(Array.isArray(graph.circularDependencies)).toBe(true);
    expect(graph.entryPoints).toBeDefined();
  });
});

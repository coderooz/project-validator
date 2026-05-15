import { describe, it, expect } from 'vitest';
import { resolveLanguage, scanFiles } from '../src/scanner/file-scanner.js';
import { resolveProject } from '../src/scanner/framework-resolver.js';
import { join, resolve } from 'node:path';

const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures', 'sample-project');

describe('File Scanner', () => {
  it('should resolve language from extensions', () => {
    expect(resolveLanguage('.ts')).toBe('typescript');
    expect(resolveLanguage('.tsx')).toBe('typescript');
    expect(resolveLanguage('.js')).toBe('javascript');
    expect(resolveLanguage('.py')).toBe('python');
    expect(resolveLanguage('.go')).toBe('go');
    expect(resolveLanguage('.rs')).toBe('rust');
  });

  it('should fallback to typescript for unknown extensions', () => {
    expect(resolveLanguage('.xyz')).toBe('typescript');
  });

  it('should scan files from a directory', async () => {
    const files = await scanFiles(FIXTURES_DIR);
    expect(files.length).toBeGreaterThan(0);

    const tsFiles = files.filter(f => f.extension === '.ts');
    expect(tsFiles.length).toBeGreaterThan(0);

    const allRelPaths = files.map(f => f.relativePath);
    expect(allRelPaths).toContain('src/index.ts');
    expect(allRelPaths).toContain('src/utils.ts');
  });
});

describe('Framework Resolver', () => {
  it('should detect Next.js framework', async () => {
    const files = await scanFiles(FIXTURES_DIR);
    const project = await resolveProject(FIXTURES_DIR, files);
    expect(project.framework.type).toBe('nextjs');
    expect(project.name).toBe('sample-project');
  });

  it('should return entry points array', async () => {
    const files = await scanFiles(FIXTURES_DIR);
    const project = await resolveProject(FIXTURES_DIR, files);
    expect(Array.isArray(project.framework.entryPoints)).toBe(true);
  });
});

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import type { FileInfo } from '../types.js';

export interface ResolvedImport {
  sourcePath: string;
  resolvedPath: string | null;
  symbol: string;
  isDefault: boolean;
  isTypeOnly: boolean;
}

const IMPORT_PATTERNS = [
  /import\s+(?:\{[^}]*\}|[\w*\s,]*)\s+from\s+['"]([^'"]+)['"]/g,
  /import\s+['"]([^'"]+)['"]/g,
  /import\s+type\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]/g,
  /from\s+['"]([^'"]+)['"]/g,
];

const DYNAMIC_IMPORT_PATTERN = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const REQUIRE_PATTERN = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

export function extractImports(content: string): string[] {
  const imports = new Set<string>();
  let match: RegExpExecArray | null;

  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) imports.add(match[1]);
    }
  }

  DYNAMIC_IMPORT_PATTERN.lastIndex = 0;
  while ((match = DYNAMIC_IMPORT_PATTERN.exec(content)) !== null) {
    if (match[1]) imports.add(match[1]);
  }

  REQUIRE_PATTERN.lastIndex = 0;
  while ((match = REQUIRE_PATTERN.exec(content)) !== null) {
    if (match[1]) imports.add(match[1]);
  }

  return [...imports];
}

export function resolveImportPath(
  importPath: string,
  sourceFile: string,
  allFiles: FileInfo[],
  rootPath: string,
): string | null {
  if (importPath.startsWith('.')) {
    return resolveRelativeImport(importPath, sourceFile, allFiles, rootPath);
  }

  if (importPath.startsWith('@/') || importPath.startsWith('~/')) {
    return resolveAliasedImport(importPath, sourceFile, allFiles, rootPath);
  }

  return null;
}

function resolveRelativeImport(
  importPath: string,
  sourceFile: string,
  allFiles: FileInfo[],
  rootPath: string,
): string | null {
  const sourceDir = dirname(sourceFile);
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

  const basePath = resolve(sourceDir, importPath);

  for (const ext of extensions) {
    const candidate = basePath + (ext.startsWith('/') ? '' : ext);
    const resolved = ext.startsWith('/') ? basePath + ext : basePath + ext;
    if (existsSync(resolved)) {
      const normalized = resolved.split('\\').join('/');
      const relative = normalized.replace(rootPath.split('\\').join('/'), '').replace(/^\//, '');
      return relative;
    }
  }

  if (existsSync(basePath)) {
    const stat = tryStat(basePath);
    if (stat && stat.isDirectory()) {
      for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
        const indexPath = resolve(basePath, `index${ext}`);
        if (existsSync(indexPath)) {
          const normalized = indexPath.split('\\').join('/');
          const relative = normalized.replace(rootPath.split('\\').join('/'), '').replace(/^\//, '');
          return relative;
        }
      }
    } else {
      const normalized = basePath.split('\\').join('/');
      const relative = normalized.replace(rootPath.split('\\').join('/'), '').replace(/^\//, '');
      return relative;
    }
  }

  return null;
}

function resolveAliasedImport(
  importPath: string,
  _sourceFile: string,
  allFiles: FileInfo[],
  rootPath: string,
): string | null {
  const resolved = importPath.replace(/^@\//, 'src/').replace(/^~\//, 'src/');
  const fullPath = resolve(rootPath, resolved);

  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
  for (const ext of extensions) {
    const candidate = fullPath + ext;
    if (existsSync(candidate)) {
      const normalized = candidate.split('\\').join('/');
      const relative = normalized.replace(rootPath.split('\\').join('/'), '').replace(/^\//, '');
      return relative;
    }
  }

  if (existsSync(fullPath)) {
    return resolved;
  }

  return null;
}

function tryStat(p: string) {
  try {
    const { statSync } = require('node:fs');
    return statSync(p);
  } catch {
    return null;
  }
}

export function isExternalImport(importPath: string): boolean {
  return !importPath.startsWith('.') && !importPath.startsWith('@/') && !importPath.startsWith('~/');
}

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { FrameworkInfo, FrameworkType, ProjectInfo, FileInfo } from '../types.js';

interface PackageJson {
  name?: string;
  version?: string;
  main?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

function readPackageJson(rootPath: string): PackageJson | null {
  const pkgPath = join(rootPath, 'package.json');
  if (!existsSync(pkgPath)) return null;
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
  } catch {
    return null;
  }
}

function detectFramework(pkg: PackageJson): FrameworkType {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;

  if (deps['next']) return 'nextjs';
  if (deps['@nestjs/core']) return 'nestjs';
  if (deps['express']) return 'express';
  if (deps['react'] || deps['react-dom']) return 'react';
  if (deps['expo']) return 'react';

  return 'node';
}

function detectAppRouter(rootPath: string): boolean {
  return existsSync(join(rootPath, 'src', 'app')) || existsSync(join(rootPath, 'app'));
}

function detectPagesRouter(rootPath: string): boolean {
  return existsSync(join(rootPath, 'src', 'pages')) || existsSync(join(rootPath, 'pages'));
}

function findEntryPoints(rootPath: string, framework: FrameworkType): string[] {
  const entries: string[] = [];

  switch (framework) {
    case 'nextjs': {
      if (detectAppRouter(rootPath)) {
        const appDir = existsSync(join(rootPath, 'src', 'app'))
          ? join(rootPath, 'src', 'app')
          : join(rootPath, 'app');
        entries.push(join(appDir, 'layout.tsx'));
        entries.push(join(appDir, 'page.tsx'));
      }
      if (detectPagesRouter(rootPath)) {
        const pagesDir = existsSync(join(rootPath, 'src', 'pages'))
          ? join(rootPath, 'src', 'pages')
          : join(rootPath, 'pages');
        entries.push(join(pagesDir, '_app.tsx'));
        entries.push(join(pagesDir, 'index.tsx'));
      }
      break;
    }
    case 'react': {
      const possibleEntries = ['src/index.tsx', 'src/index.ts', 'src/main.tsx', 'src/main.ts', 'index.tsx', 'index.ts'];
      for (const entry of possibleEntries) {
        const fullPath = join(rootPath, entry);
        if (existsSync(fullPath)) entries.push(fullPath);
      }
      break;
    }
    case 'node': {
      const pkg = readPackageJson(rootPath);
      if (pkg?.main) {
        entries.push(resolve(rootPath, pkg.main));
      } else {
        const possibleEntries = ['src/index.ts', 'src/index.js', 'index.ts', 'index.js'];
        for (const entry of possibleEntries) {
          const fullPath = join(rootPath, entry);
          if (existsSync(fullPath)) entries.push(fullPath);
        }
      }
      break;
    }
    case 'express':
    case 'nestjs': {
      const possibleEntries = ['src/main.ts', 'src/index.ts', 'src/app.ts', 'src/server.ts'];
      for (const entry of possibleEntries) {
        const fullPath = join(rootPath, entry);
        if (existsSync(fullPath)) entries.push(fullPath);
      }
      break;
    }
    default: {
      const possibleEntries = ['src/index.ts', 'src/index.js', 'index.ts', 'index.js'];
      for (const entry of possibleEntries) {
        const fullPath = join(rootPath, entry);
        if (existsSync(fullPath)) entries.push(fullPath);
      }
    }
  }

  return entries.filter((e) => existsSync(e));
}

export async function resolveProject(rootPath: string, files: FileInfo[]): Promise<ProjectInfo> {
  const pkg = readPackageJson(rootPath);
  const framework = pkg ? detectFramework(pkg) : 'generic';
  const entryPoints = findEntryPoints(rootPath, framework);

  const frameworkInfo: FrameworkInfo = {
    type: framework,
    version: pkg ? (pkg.dependencies?.['next'] ?? pkg.devDependencies?.['next']) : undefined,
    configPath: findConfigPath(rootPath, framework),
    entryPoints,
  };

  return {
    name: pkg?.name ?? 'unknown-project',
    version: pkg?.version,
    framework: frameworkInfo,
    language: 'typescript',
    rootPath,
    files,
  };
}

function findConfigPath(rootPath: string, framework: FrameworkType): string | undefined {
  switch (framework) {
    case 'nextjs': {
      const candidates = ['next.config.ts', 'next.config.mjs', 'next.config.js'];
      for (const c of candidates) {
        const p = join(rootPath, c);
        if (existsSync(p)) return p;
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

export { readPackageJson, detectFramework };

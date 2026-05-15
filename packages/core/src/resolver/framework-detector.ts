import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FrameworkType } from '../types.js';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface FrameworkDetector {
  name: FrameworkType;
  detect(rootPath: string): boolean;
  priority: number;
}

const DETECTORS: FrameworkDetector[] = [
  {
    name: 'nextjs',
    priority: 100,
    detect: (rootPath: string) => {
      const pkg = readPackageJsonIfExists(rootPath);
      if (!pkg) return false;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return !!deps['next'];
    },
  },
  {
    name: 'nestjs',
    priority: 90,
    detect: (rootPath: string) => {
      const pkg = readPackageJsonIfExists(rootPath);
      if (!pkg) return false;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return !!deps['@nestjs/core'];
    },
  },
  {
    name: 'express',
    priority: 80,
    detect: (rootPath: string) => {
      const pkg = readPackageJsonIfExists(rootPath);
      if (!pkg) return false;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return !!deps['express'];
    },
  },
  {
    name: 'react',
    priority: 70,
    detect: (rootPath: string) => {
      const pkg = readPackageJsonIfExists(rootPath);
      if (!pkg) return false;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return !!(deps['react'] || deps['react-dom']);
    },
  },
  {
    name: 'node',
    priority: 10,
    detect: (_rootPath: string) => {
      const pkg = readPackageJsonIfExists(_rootPath);
      return !!pkg;
    },
  },
  {
    name: 'generic',
    priority: 0,
    detect: () => true,
  },
];

function readPackageJsonIfExists(rootPath: string): PackageJson | null {
  try {
    const pkgPath = join(rootPath, 'package.json');
    if (!existsSync(pkgPath)) return null;
    return JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
  } catch {
    return null;
  }
}

export function detectFramework(rootPath: string): FrameworkType {
  const sorted = [...DETECTORS].sort((a, b) => b.priority - a.priority);
  for (const detector of sorted) {
    if (detector.detect(rootPath)) return detector.name;
  }
  return 'generic';
}

export function getAllDetectors(): FrameworkDetector[] {
  return DETECTORS;
}

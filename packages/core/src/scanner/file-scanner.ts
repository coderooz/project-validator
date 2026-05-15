import { readFileSync, statSync } from 'node:fs';
import { extname, relative, resolve, sep } from 'node:path';
import fg from 'fast-glob';
import type { FileInfo, LanguageType, ScannerConfig } from '../types.js';

const EXTENSION_TO_LANGUAGE: Record<string, LanguageType> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
};

const DEFAULT_INCLUDE = ['**/*.{ts,tsx,js,jsx,mjs,cjs,py,go,rs,java,json,yaml,yml,env}'];
const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/.cache/**',
  '**/__pycache__/**',
];

export function resolveLanguage(extension: string): LanguageType {
  return EXTENSION_TO_LANGUAGE[extension.toLowerCase()] ?? 'typescript';
}

export async function scanFiles(
  rootPath: string,
  config?: Partial<ScannerConfig>,
): Promise<FileInfo[]> {
  const include = config?.include ?? DEFAULT_INCLUDE;
  const exclude = config?.exclude ?? DEFAULT_EXCLUDE;
  const maxFileSize = config?.maxFileSize ?? 1024 * 1024;

  const paths = await fg(include, {
    cwd: rootPath,
    ignore: exclude,
    onlyFiles: true,
    absolute: false,
    dot: true,
  });

  const files: FileInfo[] = [];

  for (const filePath of paths) {
    const absolutePath = resolve(rootPath, filePath);
    try {
      const stats = statSync(absolutePath);
      if (stats.size > maxFileSize) continue;
      if (stats.size === 0) continue;

      const extension = extname(filePath).toLowerCase();
      const language = resolveLanguage(extension);

      files.push({
        path: absolutePath,
        relativePath: filePath.split(sep).join('/'),
        extension,
        size: stats.size,
        language,
      });
    } catch {
      continue;
    }
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function readFileContent(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export function getRelativePath(rootPath: string, absolutePath: string): string {
  return relative(rootPath, absolutePath).split(sep).join('/');
}

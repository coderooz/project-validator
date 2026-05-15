import type { LanguageType, FileInfo } from '../types.js';

export interface LanguageAdapter {
  name: LanguageType;
  extensions: string[];
  detectEntryPoints(files: FileInfo[]): string[];
}

const LANGUAGE_ADAPTERS: LanguageAdapter[] = [
  {
    name: 'typescript',
    extensions: ['.ts', '.tsx', '.mts', '.cts'],
    detectEntryPoints: (files: FileInfo[]) =>
      files
        .filter((f) => f.relativePath.endsWith('index.ts') || f.relativePath.endsWith('main.ts') || f.relativePath.endsWith('app.ts'))
        .map((f) => f.path),
  },
  {
    name: 'javascript',
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    detectEntryPoints: (files: FileInfo[]) =>
      files
        .filter((f) => f.relativePath.endsWith('index.js') || f.relativePath.endsWith('main.js'))
        .map((f) => f.path),
  },
  {
    name: 'python',
    extensions: ['.py'],
    detectEntryPoints: (files: FileInfo[]) =>
      files
        .filter((f) => f.relativePath.endsWith('main.py') || f.relativePath.endsWith('app.py'))
        .map((f) => f.path),
  },
  {
    name: 'go',
    extensions: ['.go'],
    detectEntryPoints: (files: FileInfo[]) =>
      files
        .filter((f) => f.relativePath.endsWith('main.go'))
        .map((f) => f.path),
  },
];

export function getLanguageAdapters(): LanguageAdapter[] {
  return LANGUAGE_ADAPTERS;
}

export function resolveLanguageAdapter(files: FileInfo[]): LanguageAdapter | undefined {
  const languageCounts = new Map<LanguageType, number>();
  for (const file of files) {
    languageCounts.set(file.language, (languageCounts.get(file.language) ?? 0) + 1);
  }

  let primary: LanguageType = 'typescript';
  let maxCount = 0;
  for (const [lang, count] of languageCounts) {
    if (count > maxCount) {
      maxCount = count;
      primary = lang;
    }
  }

  return LANGUAGE_ADAPTERS.find((a) => a.name === primary);
}

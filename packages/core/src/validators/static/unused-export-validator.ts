import { readFileSync } from 'node:fs';
import type { ValidatorModule, ValidationContext, ValidationResult } from '../../types.js';

function extractExports(content: string): string[] {
  const exports: string[] = [];
  const patterns = [
    /export\s+(const|let|var|function|class|interface|type|enum)\s+(\w+)/g,
    /export\s+default\s+(function|class)\s+(\w+)/g,
  ];

  let match: RegExpExecArray | null;
  for (const pattern of patterns) {
    while ((match = pattern.exec(content)) !== null) {
      const name = match[2];
      if (name) exports.push(name);
    }
  }

  return exports;
}

function extractUsedSymbols(content: string): Set<string> {
  const used = new Set<string>();
  const refPattern = /\b(\w+)\b/g;
  let match: RegExpExecArray | null;

  while ((match = refPattern.exec(content)) !== null) {
    if (match[1]) used.add(match[1]);
  }

  return used;
}

export const unusedExportValidator: ValidatorModule = {
  name: 'unused-export',
  phase: 'static',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const { files } = context.project;

    for (const file of files) {
      if (!file.relativePath.endsWith('.ts') && !file.relativePath.endsWith('.tsx')) continue;

      try {
        const content = readFileSync(file.path, 'utf-8');
        const exports = extractExports(content);

        if (exports.length === 0) continue;

        const allContent = files
          .filter((f) => f.path !== file.path)
          .map((f) => readFileSync(f.path, 'utf-8'))
          .join('\n');

        const usedSymbols = extractUsedSymbols(allContent);

        for (const exp of exports) {
          if (!usedSymbols.has(exp)) {
            issues.push({
              id: `unused-export-${file.relativePath}-${exp}`,
              category: 'UNUSED_EXPORT',
              severity: 'medium',
              phase: 'static',
              file: file.relativePath,
              message: `Export "${exp}" is not imported by any other file.`,
              recommendation: `Remove unused export "${exp}" or verify it is not needed.`,
              metadata: { exportName: exp },
            });
          }
        }
      } catch {
        continue;
      }
    }

    return {
      phase: 'static',
      name: 'unused-export',
      passed: issues.length === 0,
      issues,
      duration: 0,
    };
  },
};

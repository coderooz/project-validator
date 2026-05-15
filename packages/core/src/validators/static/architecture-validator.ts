import { readFileSync } from 'node:fs';
import type { ValidatorModule, ValidationContext, ValidationResult } from '../../types.js';

interface ArchitectureRule {
  pattern: RegExp;
  category: 'ARCHITECTURE';
  severity: 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
  excludePaths?: string[];
}

const ARCHITECTURE_RULES: ArchitectureRule[] = [
  {
    pattern: /console\.(log|debug)\(/,
    category: 'ARCHITECTURE',
    severity: 'medium',
    message: 'console.log/debug used in source code.',
    recommendation: 'Use a proper logging service instead of console.log.',
    excludePaths: ['node_modules', 'scripts', '__tests__', 'tests'],
  },
  {
    pattern: /:\s+any\b/,
    category: 'ARCHITECTURE',
    severity: 'medium',
    message: 'Usage of `any` type detected.',
    recommendation: 'Replace `any` with explicit types or `unknown` for better type safety.',
    excludePaths: ['node_modules'],
  },
  {
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)\b/i,
    category: 'ARCHITECTURE',
    severity: 'low',
    message: 'Code contains TODO/FIXME/HACK comment.',
    recommendation: 'Address the comment before production deployment.',
    excludePaths: ['node_modules'],
  },
  {
    pattern: /debugger;/,
    category: 'ARCHITECTURE',
    severity: 'high',
    message: 'Debugger statement found in source code.',
    recommendation: 'Remove debugger statements before committing.',
    excludePaths: ['node_modules'],
  },
];

export const architectureValidator: ValidatorModule = {
  name: 'architecture',
  phase: 'static',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];

    for (const file of context.project.files) {
      if (!file.relativePath.endsWith('.ts') && !file.relativePath.endsWith('.tsx') && !file.relativePath.endsWith('.js') && !file.relativePath.endsWith('.jsx')) continue;

      try {
        const content = readFileSync(file.path, 'utf-8');

        for (const rule of ARCHITECTURE_RULES) {
          const isExcluded = rule.excludePaths?.some((exc) => file.relativePath.includes(exc));
          if (isExcluded) continue;

          const match = content.match(rule.pattern);
          if (match) {
            const lineNumber = content.substring(0, match.index).split('\n').length;

            issues.push({
              id: `arch-${file.relativePath}-${lineNumber}-${rule.severity}`,
              category: rule.category,
              severity: rule.severity,
              phase: 'static',
              file: file.relativePath,
              line: lineNumber,
              message: rule.message,
              recommendation: rule.recommendation,
            });
          }
        }
      } catch {
        continue;
      }
    }

    return {
      phase: 'static',
      name: 'architecture',
      passed: issues.length === 0,
      issues,
      duration: 0,
    };
  },
};

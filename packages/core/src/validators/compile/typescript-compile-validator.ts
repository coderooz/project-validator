import { execa } from 'execa';
import type { ValidatorModule, ValidationContext, ValidationResult } from '../../types.js';

interface TscError {
  file?: string;
  line?: number;
  column?: number;
  message: string;
  category: string;
}

function parseTscOutput(output: string): TscError[] {
  const errors: TscError[] = [];
  const lines = output.split('\n');

  let currentFile: string | undefined;
  let currentLine: number | undefined;
  let currentColumn: number | undefined;

  for (const line of lines) {
    const fileMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/);

    if (fileMatch) {
      errors.push({
        file: fileMatch[1]?.trim(),
        line: parseInt(fileMatch[2] ?? '0', 10),
        column: parseInt(fileMatch[3] ?? '0', 10),
        category: fileMatch[4] ?? 'error',
        message: fileMatch[6] ?? line,
      });
      continue;
    }

    const foundErrorMatch = line.match(/Found\s+(\d+)\s+error/);
    if (foundErrorMatch) continue;

    const genericError = line.match(/^(.+)\((\d+),(\d+)\):\s+(.+)$/);
    if (genericError) {
      errors.push({
        file: genericError[1]?.trim(),
        line: parseInt(genericError[2] ?? '0', 10),
        column: parseInt(genericError[3] ?? '0', 10),
        category: 'error',
        message: genericError[4] ?? line,
      });
    }
  }

  return errors;
}

export const typescriptCompileValidator: ValidatorModule = {
  name: 'typescript-compile',
  phase: 'compile',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const rootPath = context.project.rootPath;

    const hasTsconfig = await (async () => {
      const { existsSync } = await import('node:fs');
      const { join } = await import('node:path');
      return existsSync(join(rootPath, 'tsconfig.json'));
    })();

    if (!hasTsconfig) {
      issues.push({
        id: 'compile-no-tsconfig',
        category: 'TYPESCRIPT',
        severity: 'high',
        phase: 'compile',
        message: 'Cannot run TypeScript compilation: no tsconfig.json found.',
        recommendation: 'Create a tsconfig.json to enable TypeScript compilation check.',
      });
      return {
        phase: 'compile',
        name: 'typescript-compile',
        passed: false,
        issues,
        duration: 0,
      };
    }

    try {
      const { stdout, stderr } = await execa('npx', ['tsc', '--noEmit'], {
        cwd: rootPath,
        timeout: context.config.timeout,
        reject: false,
      });

      const output = [stdout, stderr].filter(Boolean).join('\n');

      if (output.includes('error')) {
        const parsed = parseTscOutput(output);

        if (parsed.length === 0) {
          issues.push({
            id: 'compile-tsc-errors',
            category: 'TYPESCRIPT',
            severity: 'high',
            phase: 'compile',
            message: 'TypeScript compilation reported errors (unable to parse output).',
            recommendation: 'Run `npx tsc --noEmit` manually to see the errors.',
          });
        } else {
          for (const err of parsed) {
            issues.push({
              id: `compile-${err.file ?? 'unknown'}-${err.line ?? 0}-${err.column ?? 0}`,
              category: 'TYPESCRIPT',
              severity: 'high',
              phase: 'compile',
              file: err.file,
              line: err.line,
              column: err.column,
              message: err.message,
              recommendation: 'Fix the TypeScript error at the reported location.',
            });
          }
        }
      }
    } catch (error) {
      issues.push({
        id: 'compile-execution-error',
        category: 'BUILD_SYSTEM',
        severity: 'high',
        phase: 'compile',
        message: `TypeScript compilation failed: ${error instanceof Error ? error.message : String(error)}`,
        recommendation: 'Ensure TypeScript is installed and configured correctly.',
      });
    }

    return {
      phase: 'compile',
      name: 'typescript-compile',
      passed: issues.length === 0,
      issues,
      duration: 0,
    };
  },
};

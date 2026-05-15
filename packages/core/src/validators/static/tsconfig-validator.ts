import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidatorModule, ValidationContext, ValidationResult } from '../../types.js';

export const tsconfigValidator: ValidatorModule = {
  name: 'tsconfig-validator',
  phase: 'static',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const rootPath = context.project.rootPath;

    const tsconfigPaths = ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'];
    let foundConfig = false;

    for (const configPath of tsconfigPaths) {
      const fullPath = join(rootPath, configPath);
      if (!existsSync(fullPath)) continue;
      foundConfig = true;

      try {
        const content = readFileSync(fullPath, 'utf-8');
        const config = JSON.parse(content);

        if (!config.compilerOptions) {
          issues.push({
            id: 'tsconfig-missing-compiler-options',
            category: 'TYPESCRIPT',
            severity: 'high',
            phase: 'static',
            file: configPath,
            message: 'tsconfig.json is missing compilerOptions.',
            recommendation: 'Add compilerOptions to configure TypeScript behavior.',
          });
        } else {
          if (!config.compilerOptions.strict) {
            issues.push({
              id: 'tsconfig-no-strict',
              category: 'TYPESCRIPT',
              severity: 'medium',
              phase: 'static',
              file: configPath,
              message: 'TypeScript strict mode is not enabled.',
              recommendation: 'Enable "strict": true in compilerOptions for better type safety.',
            });
          }

          if (!config.compilerOptions.target) {
            issues.push({
              id: 'tsconfig-no-target',
              category: 'TYPESCRIPT',
              severity: 'low',
              phase: 'static',
              file: configPath,
              message: 'tsconfig.json does not specify a target.',
              recommendation: 'Set "target" to at least "ES2020" for modern JavaScript features.',
            });
          }

          if (config.compilerOptions.noUncheckedIndexedAccess === false) {
            issues.push({
              id: 'tsconfig-indexed-access',
              category: 'TYPESCRIPT',
              severity: 'low',
              phase: 'static',
              file: configPath,
              message: 'noUncheckedIndexedAccess is disabled.',
              recommendation: 'Enable noUncheckedIndexedAccess for safer indexed access.',
            });
          }
        }
      } catch (parseError) {
        issues.push({
          id: 'tsconfig-parse-error',
          category: 'TYPESCRIPT',
          severity: 'high',
          phase: 'static',
          file: configPath,
          message: `Failed to parse tsconfig: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          recommendation: 'Check tsconfig.json for syntax errors.',
        });
      }
    }

    if (!foundConfig) {
      issues.push({
        id: 'tsconfig-not-found',
        category: 'TYPESCRIPT',
        severity: 'critical',
        phase: 'static',
        message: 'No tsconfig.json found in project root.',
        recommendation: 'Create a tsconfig.json to configure TypeScript compilation.',
      });
    }

    return {
      phase: 'static',
      name: 'tsconfig-validator',
      passed: issues.length === 0,
      issues,
      duration: 0,
    };
  },
};

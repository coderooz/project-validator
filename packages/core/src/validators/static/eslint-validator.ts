import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execa } from 'execa';
import type { ValidatorModule, ValidationContext, ValidationResult } from '../../types.js';

export const eslintValidator: ValidatorModule = {
  name: 'eslint-validator',
  phase: 'static',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const rootPath = context.project.rootPath;

    const eslintConfigs = [
      '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json',
      '.eslintrc.yaml', '.eslintrc.yml',
      'eslint.config.js', 'eslint.config.mjs',
    ];

    const hasConfig = eslintConfigs.some((cfg) => existsSync(join(rootPath, cfg)));
    if (!hasConfig) {
      issues.push({
        id: 'eslint-no-config',
        category: 'ESLINT',
        severity: 'medium',
        phase: 'static',
        message: 'No ESLint configuration found.',
        recommendation: 'Create an ESLint config to enforce code quality standards.',
      });

      return {
        phase: 'static',
        name: 'eslint-validator',
        passed: false,
        issues,
        duration: 0,
      };
    }

    try {
      const { stdout, stderr } = await execa('npx', ['eslint', '--format', 'json', 'src/'], {
        cwd: rootPath,
        timeout: context.config.timeout,
        reject: false,
      });

      const output = stdout || stderr;
      if (!output) {
        return {
          phase: 'static',
          name: 'eslint-validator',
          passed: true,
          issues: [],
          duration: 0,
        };
      }

      try {
        const eslintResults = JSON.parse(output) as Array<{
          filePath: string;
          messages: Array<{
            line: number;
            column: number;
            message: string;
            ruleId: string;
            severity: number;
          }>;
          errorCount: number;
          warningCount: number;
        }>;

        for (const file of eslintResults) {
          for (const msg of file.messages) {
            const severity = msg.severity === 2 ? 'high' : 'medium';
            const category = msg.severity === 2 ? 'ESLINT' : 'ESLINT';

            issues.push({
              id: `eslint-${msg.ruleId ?? 'unknown'}-${file.filePath}-${msg.line}`,
              category,
              severity,
              phase: 'static',
              file: file.filePath,
              line: msg.line,
              column: msg.column,
              message: msg.message,
              recommendation: `Fix ESLint rule: ${msg.ruleId ?? 'unknown'}`,
              code: msg.ruleId ?? undefined,
            });
          }
        }
      } catch {
        issues.push({
          id: 'eslint-output-parse-error',
          category: 'ESLINT',
          severity: 'high',
          phase: 'static',
          message: 'Failed to parse ESLint JSON output. Raw output logged.',
          recommendation: 'Run ESLint manually to check for configuration issues.',
        });
      }
    } catch (error) {
      if ((error as any)?.exitCode === 1) {
        // ESLint found errors
      } else {
        issues.push({
          id: 'eslint-execution-error',
          category: 'ESLINT',
          severity: 'high',
          phase: 'static',
          message: `ESLint execution failed: ${error instanceof Error ? error.message : String(error)}`,
          recommendation: 'Check ESLint installation and configuration.',
        });
      }
    }

    return {
      phase: 'static',
      name: 'eslint-validator',
      passed: issues.length === 0,
      issues,
      duration: 0,
    };
  },
};

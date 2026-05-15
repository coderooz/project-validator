import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidatorModule, ValidationContext, ValidationResult } from '../../types.js';

const COMMON_REQUIRED_VARS: Record<string, string[]> = {
  nextjs: [
    'NEXT_PUBLIC_SITE_URL',
  ],
  react: [],
  node: ['PORT'],
  express: ['PORT'],
  nestjs: ['PORT'],
};

const COMMON_OPTIONAL_VARS: string[] = [
  'NODE_ENV',
  'DATABASE_URL',
  'REDIS_URL',
];

export const envValidator: ValidatorModule = {
  name: 'env-validator',
  phase: 'environment',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const rootPath = context.project.rootPath;
    const framework = context.project.framework.type;

    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    let foundVars = new Set<string>();

    for (const envFile of envFiles) {
      const fullPath = join(rootPath, envFile);
      if (!existsSync(fullPath)) continue;

      issues.push({
        id: `env-file-found-${envFile}`,
        category: 'ENVIRONMENT',
        severity: 'info',
        phase: 'environment',
        file: envFile,
        message: `Environment file found: ${envFile}`,
        recommendation: 'Ensure this file is in .gitignore for local configs.',
      });

      try {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const key = trimmed.split('=')[0]?.trim();
            if (key) foundVars.add(key);
          }
        }
      } catch {
        continue;
      }
    }

    const requiredVars = COMMON_REQUIRED_VARS[framework] ?? [];
    const userRequired = context.config.env ? Object.keys(context.config.env) : [];

    const allRequired = [...new Set([...requiredVars, ...userRequired])];

    for (const varName of allRequired) {
      if (!foundVars.has(varName)) {
        issues.push({
          id: `env-missing-${varName}`,
          category: 'ENVIRONMENT',
          severity: 'critical',
          phase: 'environment',
          message: `Required environment variable "${varName}" is not set.`,
          recommendation: `Add "${varName}" to .env.local or configure in CI/CD.`,
          metadata: { variable: varName },
        });
      }
    }

    for (const varName of COMMON_OPTIONAL_VARS) {
      if (!foundVars.has(varName)) {
        issues.push({
          id: `env-optional-missing-${varName}`,
          category: 'ENVIRONMENT',
          severity: 'low',
          phase: 'environment',
          message: `Optional environment variable "${varName}" is not set.`,
          recommendation: `Set "${varName}" if needed for the application.`,
          metadata: { variable: varName },
        });
      }
    }

    return {
      phase: 'environment',
      name: 'env-validator',
      passed: issues.filter((i) => i.severity === 'critical').length === 0,
      issues,
      duration: 0,
    };
  },
};

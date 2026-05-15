import type { ValidatorModule, ValidationPhase, ProjectInfo } from '@project-validator/core/types';

interface NextAdapterOptions {
  checkAppRouter?: boolean;
  checkPagesRouter?: boolean;
  checkMiddleware?: boolean;
  checkServerActions?: boolean;
}

type AdapterSeverity = 'high' | 'medium' | 'low' | 'info';

export function createNextAdapter(options: NextAdapterOptions = {}): ValidatorModule {
  const opts = {
    checkAppRouter: true,
    checkPagesRouter: true,
    checkMiddleware: true,
    checkServerActions: true,
    ...options,
  };

  return {
    name: 'nextjs-adapter',
    phase: 'architecture' as ValidationPhase,
    async validate(context) {
      const issues: Array<{
        id: string;
        category: 'ARCHITECTURE';
        severity: AdapterSeverity;
        phase: 'architecture';
        file?: string;
        message: string;
        recommendation?: string;
        metadata?: Record<string, unknown>;
      }> = [];

      const rootPath = context.project.rootPath;
      const { existsSync, readdirSync, statSync } = await import('node:fs');
      const { join } = await import('node:path');

      if (opts.checkAppRouter) {
        const appDir = existsSync(join(rootPath, 'src', 'app'))
          ? join(rootPath, 'src', 'app')
          : join(rootPath, 'app');

        if (!existsSync(appDir)) {
          issues.push({
            id: 'next-no-app-dir',
            category: 'ARCHITECTURE',
            severity: 'low',
            phase: 'architecture',
            message: 'Next.js app directory not found.',
            recommendation: 'Consider migrating to the App Router for Next.js 13+.',
          });
        }
      }

      if (opts.checkMiddleware) {
        const middlewareLocations = [
          join(rootPath, 'src', 'middleware.ts'),
          join(rootPath, 'middleware.ts'),
        ];
        const hasMiddleware = middlewareLocations.some(existsSync);
        if (!hasMiddleware) {
          issues.push({
            id: 'next-no-middleware',
            category: 'ARCHITECTURE',
            severity: 'low',
            phase: 'architecture',
            message: 'No middleware.ts found.',
            recommendation: 'Consider adding middleware for auth, redirects, or i18n.',
          });
        }
      }

      if (opts.checkServerActions) {
        const actionFiles = findActionFiles(rootPath);
        if (actionFiles.length > 0) {
          issues.push({
            id: 'next-server-actions',
            category: 'ARCHITECTURE',
            severity: 'info',
            phase: 'architecture',
            message: `Found ${actionFiles.length} server action files.`,
            recommendation: 'Ensure server actions follow the project convention.',
          });
        }
      }

      return {
        phase: 'architecture',
        name: 'nextjs-adapter',
        passed: issues.length === 0,
        issues: issues as any,
        duration: 0,
      };
    },
  };
}

function findActionFiles(rootPath: string): string[] {
  const results: string[] = [];

  function scan(dir: string) {
    let fs, path;
    try {
      fs = require('node:fs');
      path = require('node:path');
    } catch {
      return;
    }
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (!entry.startsWith('.') && entry !== 'node_modules') {
              scan(fullPath);
            }
          } else if (entry.endsWith('.action.ts') || entry.endsWith('.action.tsx')) {
            results.push(fullPath);
          }
        } catch {
          continue;
        }
      }
    } catch {
      // skip inaccessible directories
    }
  }

  const { join } = require('node:path');
  scan(join(rootPath, 'src'));
  return results;
}

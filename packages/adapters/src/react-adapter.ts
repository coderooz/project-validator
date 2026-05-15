import type { ValidatorModule, ValidationPhase } from '@project-validator/core/types';

interface ReactAdapterOptions {
  checkHooksRules?: boolean;
  checkJsxKey?: boolean;
}

export function createReactAdapter(options: ReactAdapterOptions = {}): ValidatorModule {
  const opts = { checkHooksRules: true, checkJsxKey: true, ...options };

  return {
    name: 'react-adapter',
    phase: 'architecture' as ValidationPhase,
    async validate(context) {
      const issues: Array<{
        id: string;
        category: 'ARCHITECTURE';
        severity: 'high' | 'medium' | 'low';
        phase: 'architecture';
        file?: string;
        message: string;
        recommendation?: string;
      }> = [];

      const { readFileSync } = await import('node:fs');

      for (const file of context.project.files) {
        if (!file.relativePath.endsWith('.tsx') && !file.relativePath.endsWith('.jsx')) continue;

        try {
          const content = readFileSync(file.path, 'utf-8');

          if (opts.checkHooksRules && /useEffect|useCallback|useMemo/.test(content)) {
            const hasDepsArray = /\[\s*\]|\[\w[\w\s,]*\]/.test(content);
            if (!hasDepsArray) {
              issues.push({
                id: `react-hooks-deps-${file.relativePath}`,
                category: 'ARCHITECTURE',
                severity: 'medium',
                phase: 'architecture',
                file: file.relativePath,
                message: 'Hook usage without clear dependency array.',
                recommendation: 'Ensure all hooks have proper dependency arrays.',
              });
            }
          }
        } catch {
          continue;
        }
      }

      return {
        phase: 'architecture',
        name: 'react-adapter',
        passed: issues.length === 0,
        issues: issues as any,
        duration: 0,
      };
    },
  };
}

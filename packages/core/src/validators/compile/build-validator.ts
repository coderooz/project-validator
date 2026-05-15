import { execa } from 'execa';
import type { ValidatorModule, ValidationContext, ValidationResult, IssueCategory } from '../../types.js';

function categorizeBuildError(message: string): IssueCategory {
  const msg = message.toLowerCase();
  if (msg.includes('typescript') || msg.includes('ts(') || msg.includes('type error')) return 'TYPESCRIPT';
  if (msg.includes('eslint') || msg.includes('lint')) return 'ESLINT';
  if (msg.includes('webpack') || msg.includes('critical dependency')) return 'WEBPACK';
  if (msg.includes('next.config') || msg.includes('next config')) return 'NEXT_CONFIG';
  if (msg.includes('module not found') || msg.includes('cannot find module')) return 'RUNTIME_IMPORT';
  if (msg.includes('server action') || msg.includes('server_ action')) return 'SERVER_ACTION';
  if (msg.includes('hydration') || msg.includes('hydrate')) return 'HYDRATION';
  if (msg.includes('env') || msg.includes('environment')) return 'ENVIRONMENT';
  if (msg.includes('build') || msg.includes('compilation')) return 'BUILD_SYSTEM';
  return 'UNKNOWN';
}

function determineSeverity(category: IssueCategory): 'critical' | 'high' | 'medium' | 'low' {
  switch (category) {
    case 'TYPESCRIPT':
    case 'NEXT_CONFIG':
    case 'HYDRATION':
      return 'high';
    case 'WEBPACK':
    case 'BUILD_SYSTEM':
      return 'high';
    case 'SERVER_ACTION':
    case 'ENVIRONMENT':
      return 'medium';
    case 'ESLINT':
      return 'low';
    default:
      return 'medium';
  }
}

function parseBuildOutput(output: string): Array<{ file?: string; line?: number; column?: number; message: string; category: IssueCategory }> {
  const errors: Array<{ file?: string; line?: number; column?: number; message: string; category: IssueCategory }> = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes('Failed to compile')) {
      errors.push({
        message: 'Build failed to compile.',
        category: 'BUILD_SYSTEM',
      });
      continue;
    }

    if (line.includes('Error:')) {
      errors.push({
        message: line.trim(),
        category: categorizeBuildError(line),
      });
      continue;
    }

    if (line.includes('Warning:')) {
      errors.push({
        message: line.trim(),
        category: categorizeBuildError(line),
      });
      continue;
    }

    const fileMatch = line.match(/^(.+?):(\d+):(\d+):\s+(error|warning)\s+(.+)$/);
    if (fileMatch) {
      errors.push({
        file: fileMatch[1]?.trim(),
        line: parseInt(fileMatch[2] ?? '0', 10),
        column: parseInt(fileMatch[3] ?? '0', 10),
        message: fileMatch[5]?.trim() ?? line.trim(),
        category: categorizeBuildError(line),
      });
      continue;
    }

    if (line.includes('Type error:')) {
      errors.push({
        message: line.trim(),
        category: 'TYPESCRIPT',
      });
    }
  }

  return errors;
}

export const buildValidator: ValidatorModule = {
  name: 'build-validator',
  phase: 'compile',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const rootPath = context.project.rootPath;
    const framework = context.project.framework.type;

    if (framework !== 'nextjs' && framework !== 'react' && framework !== 'node') {
      issues.push({
        id: 'build-framework-not-supported',
        category: 'BUILD_SYSTEM',
        severity: 'info',
        phase: 'compile',
        message: `Build validation not supported for framework "${framework}".`,
        recommendation: 'Run the project-specific build command manually.',
      });
      return {
        phase: 'compile',
        name: 'build-validator',
        passed: true,
        issues,
        duration: 0,
      };
    }

    const buildCommands: Record<string, string> = {
      nextjs: 'next build',
      react: 'react-scripts build',
      node: 'tsc',
    };

    const buildCommand = buildCommands[framework] ?? 'tsc';
    const parts = buildCommand.split(' ');
    const cmd = parts[0] ?? 'tsc';
    const args = parts.slice(1);

    try {
      const { stdout, stderr } = await execa('npx', [cmd, ...args].filter(Boolean), {
        cwd: rootPath,
        timeout: context.config.timeout,
        reject: false,
      });

      const output = [stdout, stderr].filter(Boolean).join('\n');

      if (output.toLowerCase().includes('error') || output.toLowerCase().includes('failed')) {
        const parsed = parseBuildOutput(output);

        if (parsed.length > 0) {
          for (const err of parsed) {
            const severity = determineSeverity(err.category);
            issues.push({
              id: `build-${err.file ?? 'general'}-${err.line ?? 0}`,
              category: err.category,
              severity,
              phase: 'compile',
              file: err.file,
              line: err.line,
              column: err.column,
              message: err.message,
              recommendation: `Fix the ${err.category} error in the build output.`,
            });
          }
        } else {
          issues.push({
            id: 'build-unknown-errors',
            category: 'BUILD_SYSTEM',
            severity: 'high',
            phase: 'compile',
            message: 'Build reported errors, but output could not be fully parsed.',
            recommendation: 'Run the build command manually to see full output.',
          });
        }
      }

      if (output.includes('warning')) {
        const warningCount = (output.match(/warning/gi) ?? []).length;
        issues.push({
          id: 'build-warnings',
          category: 'BUILD_SYSTEM',
          severity: 'low',
          phase: 'compile',
          message: `Build completed with ${warningCount} warnings.`,
          recommendation: 'Review build warnings and fix them to ensure optimal builds.',
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('Command failed') || msg.includes('ENOENT')) {
        issues.push({
          id: 'build-command-not-found',
          category: 'BUILD_SYSTEM',
          severity: 'high',
          phase: 'compile',
          message: `Build command "${buildCommand}" not found or failed to execute.`,
          recommendation: `Ensure the ${framework} CLI is installed.`,
        });
      } else {
        issues.push({
          id: 'build-execution-error',
          category: 'BUILD_SYSTEM',
          severity: 'high',
          phase: 'compile',
          message: `Build execution failed: ${msg}`,
          recommendation: 'Check build logs for details.',
        });
      }
    }

    return {
      phase: 'compile',
      name: 'build-validator',
      passed: issues.filter((i) => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      duration: 0,
    };
  },
};

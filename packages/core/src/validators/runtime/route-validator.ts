import { request } from 'undici';
import type { ValidatorModule, ValidationContext, ValidationResult } from '../../types.js';

const COMMON_ROUTES: Record<string, string[]> = {
  nextjs: ['/', '/api/health'],
  react: ['/'],
  node: ['/health', '/api/health'],
  express: ['/health', '/api/health'],
  nestjs: ['/', '/api/health'],
};

export const routeValidator: ValidatorModule = {
  name: 'route-validator',
  phase: 'runtime',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const framework = context.project.framework.type;
    const baseUrl = 'http://localhost:3000';

    const routes = COMMON_ROUTES[framework] ?? ['/'];

    for (const route of routes) {
      try {
        const url = `${baseUrl}${route}`;
        const response = await request(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000),
        });

        const statusCode = response.statusCode;

        if (statusCode >= 500) {
          issues.push({
            id: `route-5xx-${route}`,
            category: 'RUNTIME_IMPORT',
            severity: 'high',
            phase: 'runtime',
            message: `Route ${route} returned ${statusCode} (server error).`,
            recommendation: 'Check server logs for errors on this route.',
            metadata: { route, statusCode },
          });
        } else if (statusCode >= 400) {
          issues.push({
            id: `route-4xx-${route}`,
            category: 'RUNTIME_IMPORT',
            severity: 'medium',
            phase: 'runtime',
            message: `Route ${route} returned ${statusCode} (client error).`,
            recommendation: 'Check if the route exists and accepts the request.',
            metadata: { route, statusCode },
          });
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          issues.push({
            id: `route-timeout-${route}`,
            category: 'RUNTIME_IMPORT',
            severity: 'medium',
            phase: 'runtime',
            message: `Route ${route} timed out after 10s.`,
            recommendation: 'Check server responsiveness and route handler performance.',
            metadata: { route },
          });
        } else {
          issues.push({
            id: `route-error-${route}`,
            category: 'RUNTIME_IMPORT',
            severity: 'medium',
            phase: 'runtime',
            message: `Route ${route} failed: ${(error as Error).message}`,
            recommendation: 'Ensure the dev server is running and the route is accessible.',
            metadata: { route },
          });
        }
      }
    }

    return {
      phase: 'runtime',
      name: 'route-validator',
      passed: issues.length === 0,
      issues,
      duration: 0,
    };
  },
};

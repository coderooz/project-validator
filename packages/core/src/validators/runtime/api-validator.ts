import { request } from 'undici';
import type { ValidatorModule, ValidationContext, ValidationResult } from '../../types.js';

interface ApiRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  expectStatus?: number;
}

const COMMON_API_ROUTES: Record<string, ApiRoute[]> = {
  nextjs: [
    { path: '/api/health', method: 'GET', expectStatus: 200 },
  ],
  node: [
    { path: '/api/health', method: 'GET', expectStatus: 200 },
  ],
  express: [
    { path: '/api/health', method: 'GET', expectStatus: 200 },
  ],
  nestjs: [
    { path: '/api/health', method: 'GET', expectStatus: 200 },
  ],
};

export const apiValidator: ValidatorModule = {
  name: 'api-validator',
  phase: 'runtime',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const framework = context.project.framework.type;
    const baseUrl = 'http://localhost:3000';

    const apiRoutes = COMMON_API_ROUTES[framework] ?? [];

    for (const route of apiRoutes) {
      try {
        const url = `${baseUrl}${route.path}`;
        const requestOptions: Record<string, unknown> = {
          method: route.method,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000),
        };

        if (route.body) {
          requestOptions.body = JSON.stringify(route.body);
        }

        const response = await request(url, requestOptions as any);
        const statusCode = response.statusCode;
        const expected = route.expectStatus ?? 200;

        if (statusCode !== expected) {
          issues.push({
            id: `api-unexpected-status-${route.method}-${route.path}`,
            category: 'RUNTIME_IMPORT',
            severity: 'medium',
            phase: 'runtime',
            message: `API ${route.method} ${route.path} returned ${statusCode}, expected ${expected}.`,
            recommendation: 'Check API endpoint implementation.',
            metadata: { method: route.method, path: route.path, statusCode, expected },
          });
        }
      } catch (error) {
        issues.push({
          id: `api-error-${route.method}-${route.path}`,
          category: 'RUNTIME_IMPORT',
          severity: 'medium',
          phase: 'runtime',
          message: `API ${route.method} ${route.path} failed: ${(error as Error).message}`,
          recommendation: 'Ensure the dev server is running and API endpoint exists.',
          metadata: { method: route.method, path: route.path },
        });
      }
    }

    return {
      phase: 'runtime',
      name: 'api-validator',
      passed: issues.length === 0,
      issues,
      duration: 0,
    };
  },
};

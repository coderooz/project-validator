import { describe, it, expect } from 'vitest';
import { calculateHealthScore } from '../src/scoring/health-score.js';
import type { ValidationResult } from '../src/types.js';

describe('Health Score', () => {
  it('should return perfect score for clean results', () => {
    const results: ValidationResult[] = [
      {
        phase: 'static',
        name: 'clean',
        passed: true,
        issues: [],
        duration: 0,
      },
    ];

    const score = calculateHealthScore(results);
    expect(score.overall).toBe(100);
    expect(Object.keys(score.categories).length).toBeGreaterThan(0);
  });

  it('should penalize for critical issues', () => {
    const results: ValidationResult[] = [
      {
        phase: 'static',
        name: 'dirty',
        passed: false,
        issues: [
          {
            id: 'critical-1',
            category: 'TYPESCRIPT',
            severity: 'critical',
            phase: 'static',
            message: 'Critical error',
          },
        ],
        duration: 0,
      },
    ];

    const score = calculateHealthScore(results);
    expect(score.overall).toBeLessThan(100);
    expect(score.breakdown.some(b => b.category === 'Type Safety')).toBe(true);
  });

  it('should calculate breakdown correctly', () => {
    const results: ValidationResult[] = [
      {
        phase: 'static',
        name: 'test',
        passed: false,
        issues: [
          { id: 't1', category: 'TYPESCRIPT', severity: 'high', phase: 'static', message: 'TS error' },
          { id: 't2', category: 'CIRCULAR_DEPENDENCY', severity: 'medium', phase: 'static', message: 'Circular' },
          { id: 't3', category: 'ENVIRONMENT', severity: 'critical', phase: 'environment', message: 'Missing env' },
        ],
        duration: 0,
      },
    ];

    const score = calculateHealthScore(results);
    expect(score.breakdown.length).toBe(5);

    const typeSafety = score.breakdown.find(b => b.category === 'Type Safety');
    expect(typeSafety).toBeDefined();
    expect(typeSafety!.issues).toBeGreaterThan(0);
  });
});

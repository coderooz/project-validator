import { describe, it, expect } from 'vitest';
import { ValidationPipeline, createPipeline } from '../src/pipeline/engine.js';
import { aggregateReport } from '../src/pipeline/aggregator.js';
import type { ValidatorModule, ValidationContext, ValidationResult } from '../src/types.js';

describe('ValidationPipeline', () => {
  it('should create a pipeline', () => {
    const pipeline = createPipeline();
    expect(pipeline).toBeInstanceOf(ValidationPipeline);
  });

  it('should register validators', () => {
    const pipeline = createPipeline();
    const mockValidator: ValidatorModule = {
      name: 'test-validator',
      phase: 'static',
      async validate(_context: ValidationContext): Promise<ValidationResult> {
        return {
          phase: 'static',
          name: 'test-validator',
          passed: true,
          issues: [],
          duration: 0,
        };
      },
    };

    pipeline.register(mockValidator);
    const registered = pipeline.getRegisteredValidators();
    expect(registered).toHaveLength(1);
    expect(registered[0]?.name).toBe('test-validator');
  });

  it('should handle validator crashes gracefully', () => {
    const results: ValidationResult[] = [
      {
        phase: 'static',
        name: 'crash-test',
        passed: false,
        issues: [
          {
            id: 'validator-crash-crash-test',
            category: 'UNKNOWN',
            severity: 'critical',
            phase: 'static',
            message: 'Validator "crash-test" crashed: something went wrong',
            recommendation: 'Check validator implementation for bugs.',
          },
        ],
        duration: 100,
      },
    ];

    const summary = aggregateReport(results);
    expect(summary.failed).toBe(1);
    expect(summary.critical).toBe(1);
  });
});

describe('Aggregator', () => {
  it('should aggregate empty results', () => {
    const summary = aggregateReport([]);
    expect(summary.total).toBe(0);
    expect(summary.passed).toBe(0);
    expect(summary.failed).toBe(0);
    expect(summary.issues).toBe(0);
  });

  it('should aggregate mixed results', () => {
    const results: ValidationResult[] = [
      {
        phase: 'static',
        name: 'passing',
        passed: true,
        issues: [],
        duration: 10,
      },
      {
        phase: 'static',
        name: 'failing',
        passed: false,
        issues: [
          { id: 'err1', category: 'TYPESCRIPT', severity: 'high', phase: 'static', message: 'Error 1' },
          { id: 'err2', category: 'ESLINT', severity: 'medium', phase: 'static', message: 'Error 2' },
        ],
        duration: 20,
      },
    ];

    const summary = aggregateReport(results);
    expect(summary.total).toBe(2);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.issues).toBe(2);
    expect(summary.high).toBe(1);
    expect(summary.medium).toBe(1);
  });
});

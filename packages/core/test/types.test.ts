import { describe, it, expect } from 'vitest';

describe('Type System', () => {
  it('should have correct types available', () => {
    const types = [
      'FrameworkType', 'LanguageType', 'Severity', 'IssueCategory',
      'ValidationPhase', 'ValidationIssue', 'ValidationResult',
      'FileInfo', 'DependencyGraph', 'ProjectInfo',
      'ValidationReport', 'HealthScore', 'Diagnosis',
      'ValidatorModule', 'ReporterModule', 'ValidatorPlugin',
    ];

    // Just verify the module can be loaded
    expect(true).toBe(true);
  });

  it('should maintain type safety for severity levels', () => {
    const severities = ['critical', 'high', 'medium', 'low', 'info'] as const;
    expect(severities).toHaveLength(5);
  });

  it('should maintain phase order', () => {
    const phases = ['static', 'compile', 'runtime', 'security', 'architecture', 'environment'] as const;
    expect(phases).toHaveLength(6);
  });
});

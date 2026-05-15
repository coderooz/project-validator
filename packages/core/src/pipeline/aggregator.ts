import type { ValidationResult, ValidationReport } from '../types.js';

export function aggregateReport(results: ValidationResult[]): ValidationReport['summary'] {
  let issues = 0;
  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;
  let info = 0;
  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.passed) {
      passed++;
    } else {
      failed++;
    }

    for (const issue of result.issues) {
      issues++;
      switch (issue.severity) {
        case 'critical':
          critical++;
          break;
        case 'high':
          high++;
          break;
        case 'medium':
          medium++;
          break;
        case 'low':
          low++;
          break;
        case 'info':
          info++;
          break;
      }
    }
  }

  return {
    total: results.length,
    passed,
    failed,
    issues,
    critical,
    high,
    medium,
    low,
    info,
  };
}

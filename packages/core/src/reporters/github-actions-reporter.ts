import type { ValidationReport, ReporterModule, ValidationIssue, Severity } from '../types.js';

function severityToAnnotationLevel(severity: Severity): 'failure' | 'warning' | 'notice' {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'failure';
    case 'medium':
      return 'warning';
    case 'low':
    case 'info':
      return 'notice';
  }
}

function generateAnnotation(issue: ValidationIssue): string {
  const level = severityToAnnotationLevel(issue.severity);
  const file = issue.file ?? '__unknown__';
  const line = issue.line ?? 1;
  const title = `[${issue.category}] ${issue.message}`;

  return `::${level} file=${file},line=${line},title=${title}::${issue.message}`;
}

export function createGitHubActionsReporter(): ReporterModule {
  return {
    name: 'github-actions',
    async write(report: ValidationReport): Promise<void> {
      console.log(`::group::Project Validator Report`);

      for (const result of report.results) {
        for (const issue of result.issues) {
          console.log(generateAnnotation(issue));
        }
      }

      const summary = report.summary;
      console.log(`::notice title=Validator Summary::${summary.total} checks, ${summary.passed} passed, ${summary.failed} failed, ${summary.issues} issues`);

      if (summary.critical > 0 || summary.high > 0) {
        console.log(`::error title=Validator Failed::${summary.critical} critical and ${summary.high} high severity issues found`);
      }

      console.log(`::endgroup::`);
    },
  };
}

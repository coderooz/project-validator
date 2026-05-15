import type { ValidationReport, Diagnosis, ValidationIssue } from '../types.js';

interface RootCauseAnalysis {
  issue: string;
  triggers: string[];
  cascades: string[];
  rootCause: string;
  recommendations: string[];
}

const KNOWN_PATTERNS: RootCauseAnalysis[] = [
  {
    issue: 'Missing ENV variable',
    triggers: ['ENVIRONMENT'],
    cascades: ['RUNTIME_IMPORT', 'SERVER_ACTION', 'HYDRATION'],
    rootCause: 'Required environment variable is not configured in .env.local or CI environment.',
    recommendations: [
      'Add the missing variable to .env.local',
      'Configure the variable in CI/CD pipeline',
      'Update documentation with required env vars',
    ],
  },
  {
    issue: 'TypeScript compilation failure',
    triggers: ['TYPESCRIPT'],
    cascades: ['BUILD_SYSTEM'],
    rootCause: 'TypeScript type error prevents compilation.',
    recommendations: [
      'Fix the type error at the reported location',
      'Check for mismatched types in component props',
      'Verify imported types are correct',
    ],
  },
  {
    issue: 'Circular dependency',
    triggers: ['CIRCULAR_DEPENDENCY'],
    cascades: ['RUNTIME_IMPORT', 'BUILD_SYSTEM'],
    rootCause: 'Two or more modules import each other, creating a cycle.',
    recommendations: [
      'Extract shared logic into a separate module',
      'Use dependency inversion to break the cycle',
      'Consider introducing an interface layer',
    ],
  },
  {
    issue: 'Webpack build warning',
    triggers: ['WEBPACK'],
    cascades: ['BUILD_SYSTEM'],
    rootCause: 'Webpack detected a critical dependency in module bundling.',
    recommendations: [
      'Check for dynamic requires in the module',
      'Verify the dependency is compatible with the bundler',
      'Consider replacing the problematic module',
    ],
  },
  {
    issue: 'ESLint violation',
    triggers: ['ESLINT'],
    cascades: [],
    rootCause: 'Code does not follow project linting rules.',
    recommendations: [
      'Run `npm run lint -- --fix` for auto-fixable issues',
      'Review the specific rule being violated',
      'Update code to match project style guide',
    ],
  },
];

export function diagnose(issues: ValidationIssue[]): Diagnosis[] {
  const categorySet = new Set(issues.map((i) => i.category));
  const diagnoses: Diagnosis[] = [];

  for (const pattern of KNOWN_PATTERNS) {
    const triggered = pattern.triggers.some((t) => categorySet.has(t as any));
    if (!triggered) continue;

    const cascadingFailures = pattern.cascades.filter((c) =>
      issues.some((i) => i.category === c),
    );

    const severity = cascadingFailures.length > 1 ? 'high' : 'medium';

    diagnoses.push({
      issue: pattern.issue,
      rootCause: pattern.rootCause,
      recommendations: pattern.recommendations,
      severity,
      cascadingFailures: cascadingFailures.length > 0
        ? cascadingFailures
        : ['No cascading failures detected'],
    });
  }

  if (diagnoses.length === 0) {
    diagnoses.push({
      issue: 'Unknown issues detected',
      rootCause: 'Could not determine root cause from available diagnostics.',
      recommendations: [
        'Review individual issues for details',
        'Check build logs for additional context',
        'Run with --verbose for more information',
      ],
      severity: 'low',
      cascadingFailures: [],
    });
  }

  return diagnoses;
}

export function generateDoctorReport(report: ValidationReport): string {
  const lines: string[] = [];
  lines.push('═'.repeat(60));
  lines.push('  PROJECT VALIDATOR — DOCTOR MODE');
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`  Project: ${report.project.name}`);
  lines.push(`  Framework: ${report.project.framework.type}`);
  lines.push(`  Health: ${report.healthScore.overall}/100`);
  lines.push(`  Issues: ${report.summary.issues}`);
  lines.push('');

  const allIssues = report.results.flatMap((r) => r.issues);
  const diagnoses = diagnose(allIssues);

  lines.push('─'.repeat(60));
  lines.push('  ROOT CAUSE ANALYSIS');
  lines.push('─'.repeat(60));
  lines.push('');

  for (const d of diagnoses) {
    const severityLabel = d.severity === 'critical' ? '🚨 CRITICAL'
      : d.severity === 'high' ? '⚠️  HIGH'
      : d.severity === 'medium' ? '⚡ MEDIUM'
      : 'ℹ️  LOW';

    lines.push(`  ${severityLabel}: ${d.issue}`);
    lines.push(`  ├ Root Cause: ${d.rootCause}`);
    lines.push(`  └ Recommendations:`);
    for (const rec of d.recommendations) {
      lines.push(`       → ${rec}`);
    }
    if (d.cascadingFailures.length > 0) {
      lines.push(`     Cascading Failures:`);
      for (const cf of d.cascadingFailures) {
        lines.push(`       • ${cf}`);
      }
    }
    lines.push('');
  }

  lines.push('═'.repeat(60));
  return lines.join('\n');
}

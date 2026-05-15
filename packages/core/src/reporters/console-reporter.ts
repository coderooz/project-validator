import type { ValidationReport, ReporterModule, ValidationPhase } from '../types.js';

const PHASE_COLORS: Record<ValidationPhase, string> = {
  static: '\x1b[36m',
  compile: '\x1b[33m',
  runtime: '\x1b[35m',
  security: '\x1b[31m',
  architecture: '\x1b[34m',
  environment: '\x1b[32m',
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: '\x1b[31m🚨 CRITICAL\x1b[0m',
  high: '\x1b[31m⚠️  HIGH\x1b[0m',
  medium: '\x1b[33m⚡ MEDIUM\x1b[0m',
  low: '\x1b[34mℹ️  LOW\x1b[0m',
  info: '\x1b[36m💡 INFO\x1b[0m',
};

export const consoleReporter: ReporterModule = {
  name: 'console',
  async write(report: ValidationReport): Promise<void> {
    console.log('');
    console.log('\x1b[1m═'.repeat(60) + '\x1b[0m');
    console.log('\x1b[1m  PROJECT VALIDATOR REPORT\x1b[0m');
    console.log('\x1b[1m═'.repeat(60) + '\x1b[0m');
    console.log('');
    console.log(`  Project:     \x1b[36m${report.project.name}\x1b[0m`);
    console.log(`  Framework:   \x1b[33m${report.project.framework.type}\x1b[0m`);
    console.log(`  Files:       ${report.project.files.length}`);
    console.log(`  Duration:    ${report.duration}ms`);
    console.log(`  Timestamp:   ${report.timestamp}`);
    console.log('');

    const phases = new Map<ValidationPhase, typeof report.results>();
    for (const result of report.results) {
      const existing = phases.get(result.phase) ?? [];
      existing.push(result);
      phases.set(result.phase, existing);
    }

    for (const [phase, results] of phases) {
      const color = PHASE_COLORS[phase] ?? '\x1b[37m';
      console.log(`\x1b[1m${color}━━━ ${phase.toUpperCase()} PHASE ━━━\x1b[0m`);
      console.log('');

      for (const result of results) {
        const icon = result.passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
        console.log(`  ${icon} \x1b[1m${result.name}\x1b[0m (${result.duration}ms)`);

        if (result.issues.length > 0) {
          for (const issue of result.issues) {
            const sevLabel = SEVERITY_LABELS[issue.severity] ?? issue.severity;
            const location = issue.file
              ? ` \x1b[90m${issue.file}${issue.line ? `:${issue.line}` : ''}\x1b[0m`
              : '';
            console.log(`    ${sevLabel}${location}`);
            console.log(`    Message: ${issue.message}`);
            if (issue.recommendation) {
              console.log(`    \x1b[90m→ ${issue.recommendation}\x1b[0m`);
            }
            console.log('');
          }
        }
      }
    }

    console.log('\x1b[1m═'.repeat(60) + '\x1b[0m');
    console.log('  SUMMARY');
    console.log('\x1b[1m─'.repeat(60) + '\x1b[0m');
    console.log(`  Total Checks:  ${report.summary.total}`);
    console.log(`  \x1b[32mPassed:\x1b[0m        ${report.summary.passed}`);
    console.log(`  \x1b[31mFailed:\x1b[0m        ${report.summary.failed}`);
    console.log(`  Total Issues:  ${report.summary.issues}`);
    console.log(`  \x1b[31mCritical:\x1b[0m      ${report.summary.critical}`);
    console.log(`  \x1b[31mHigh:\x1b[0m          ${report.summary.high}`);
    console.log(`  \x1b[33mMedium:\x1b[0m        ${report.summary.medium}`);
    console.log(`  \x1b[34mLow:\x1b[0m           ${report.summary.low}`);
    console.log(`  \x1b[36mInfo:\x1b[0m          ${report.summary.info}`);
    console.log('');

    console.log('\x1b[1m═'.repeat(60) + '\x1b[0m');
    console.log('  HEALTH SCORE');
    console.log('\x1b[1m─'.repeat(60) + '\x1b[0m');
    console.log(`  \x1b[1mOverall: ${report.healthScore.overall}/100\x1b[0m`);
    for (const breakdown of report.healthScore.breakdown) {
      const bar = '█'.repeat(Math.round(breakdown.score / 10));
      const spaces = '░'.repeat(10 - Math.round(breakdown.score / 10));
      console.log(`  ${breakdown.category.padEnd(20)} ${bar}${spaces} ${breakdown.score}/100`);
    }
    console.log('');
    console.log('\x1b[1m═'.repeat(60) + '\x1b[0m\n');
  },
};

import { runHealth } from '@project-validator/core';

export async function healthCommand(cwd: string) {
  const report = await runHealth(cwd);
  console.log(`\nHealth Score: ${report.healthScore.overall}/100`);
  for (const b of report.healthScore.breakdown) {
    console.log(`  ${b.category}: ${b.score}/100 (${b.issues} issues)`);
  }
  process.exit(report.healthScore.overall < 50 ? 1 : 0);
}

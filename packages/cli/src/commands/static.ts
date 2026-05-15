import { runStatic } from '@project-validator/core';

export async function staticCommand(cwd: string) {
  const report = await runStatic(cwd);
  process.exit(report.summary.critical > 0 || report.summary.high > 0 ? 1 : 0);
}

import { runCompile } from '@project-validator/core';

export async function compileCommand(cwd: string) {
  const report = await runCompile(cwd);
  process.exit(report.summary.critical > 0 || report.summary.high > 0 ? 1 : 0);
}

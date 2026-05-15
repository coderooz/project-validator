import { runRuntime } from '@project-validator/core';

export async function runtimeCommand(cwd: string) {
  const report = await runRuntime(cwd);
  process.exit(report.summary.critical > 0 || report.summary.high > 0 ? 1 : 0);
}

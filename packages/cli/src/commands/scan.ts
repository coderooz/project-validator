import { validate } from '@project-validator/core';

export async function scanCommand(cwd: string, options: { json?: boolean; markdown?: boolean }) {
  const reporters = [];
  if (options.json) {
    const { createJsonReporter } = await import('@project-validator/core');
    reporters.push(createJsonReporter());
  }
  if (options.markdown) {
    const { createMarkdownReporter } = await import('@project-validator/core');
    reporters.push(createMarkdownReporter());
  }

  const report = await validate({ cwd, reporters });
  process.exit(report.summary.critical > 0 || report.summary.high > 0 ? 1 : 0);
}

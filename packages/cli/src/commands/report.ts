import { validate } from '@project-validator/core';
import { createJsonReporter, createMarkdownReporter } from '@project-validator/core';

export async function reportCommand(cwd: string, format: 'json' | 'markdown' | 'both') {
  const reporters = [];
  if (format === 'json' || format === 'both') {
    reporters.push(createJsonReporter());
  }
  if (format === 'markdown' || format === 'both') {
    reporters.push(createMarkdownReporter());
  }

  await validate({ cwd, reporters });
}

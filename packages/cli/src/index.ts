#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './commands/scan.js';
import { staticCommand } from './commands/static.js';
import { compileCommand } from './commands/compile.js';
import { runtimeCommand } from './commands/runtime.js';
import { healthCommand } from './commands/health.js';
import { doctorCommand } from './commands/doctor.js';
import { reportCommand } from './commands/report.js';

const program = new Command();

program
  .name('project-validate')
  .description('Universal project validation engine')
  .version('1.0.0-alpha.1')
  .option('-c, --cwd <path>', 'Working directory', process.cwd());

program
  .command('scan')
  .description('Run all validation phases')
  .option('--json', 'Generate JSON report')
  .option('--markdown', 'Generate Markdown report')
  .action(async (options) => {
    const cwd = program.opts().cwd;
    await scanCommand(cwd, options);
  });

program
  .command('static')
  .description('Run static analysis phase only')
  .action(async () => {
    const cwd = program.opts().cwd;
    await staticCommand(cwd);
  });

program
  .command('compile')
  .description('Run compile validation phase only')
  .action(async () => {
    const cwd = program.opts().cwd;
    await compileCommand(cwd);
  });

program
  .command('runtime')
  .description('Run runtime validation phase only')
  .action(async () => {
    const cwd = program.opts().cwd;
    await runtimeCommand(cwd);
  });

program
  .command('health')
  .description('Evaluate project health score')
  .action(async () => {
    const cwd = program.opts().cwd;
    await healthCommand(cwd);
  });

program
  .command('doctor')
  .description('Run diagnostics and root cause analysis')
  .action(async () => {
    const cwd = program.opts().cwd;
    await doctorCommand(cwd);
  });

program
  .command('report')
  .description('Generate validation report')
  .option('-f, --format <format>', 'Report format: json, markdown, both', 'both')
  .action(async (options) => {
    const cwd = program.opts().cwd;
    await reportCommand(cwd, options.format);
  });

program.parse(process.argv);

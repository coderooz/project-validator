import { scanFiles } from './scanner/file-scanner.js';
import { resolveProject } from './scanner/framework-resolver.js';
import { buildDependencyGraph } from './graph/dependency-graph.js';
import { ValidationPipeline, createPipeline } from './pipeline/engine.js';
import { getDefaultValidators } from './validators/index.js';
import { consoleReporter } from './reporters/console-reporter.js';
import { createJsonReporter } from './reporters/json-reporter.js';
import { createMarkdownReporter } from './reporters/markdown-reporter.js';
import { createGitHubActionsReporter } from './reporters/github-actions-reporter.js';
import { PluginRegistry, createPluginRegistry } from './plugins/plugin-system.js';
import { loadConfig } from './config/config-loader.js';
import { calculateHealthScore } from './scoring/health-score.js';
import { diagnose, generateDoctorReport } from './diagnostics/doctor.js';
import { detectFramework } from './resolver/framework-detector.js';
import { aggregateReport } from './pipeline/aggregator.js';
import type {
  ProjectValidatorConfig,
  ValidationPhase,
  ReporterModule,
  ValidationReport,
} from './types.js';

export type { ProjectValidatorConfig, ValidationPhase, ValidationReport, ReporterModule };

export {
  scanFiles,
  resolveProject,
  buildDependencyGraph,
  getDefaultValidators,
  PluginRegistry,
  createPluginRegistry,
  loadConfig,
  calculateHealthScore,
  diagnose,
  generateDoctorReport,
  detectFramework,
  aggregateReport,
  consoleReporter,
  createJsonReporter,
  createMarkdownReporter,
  createGitHubActionsReporter,
};

export interface ValidateOptions {
  cwd?: string;
  phases?: ValidationPhase[];
  config?: Partial<ProjectValidatorConfig>;
  reporters?: ReporterModule[];
}

export async function validate(options: ValidateOptions = {}): Promise<ValidationReport> {
  const rootPath = options.cwd ?? process.cwd();
  const baseConfig = loadConfig(rootPath);
  const config: ProjectValidatorConfig = { ...baseConfig, ...options.config, phases: { ...baseConfig.phases, ...options.config?.phases } };

  const pluginRegistry = createPluginRegistry();
  const pipeline = createPipeline();

  const validators = getDefaultValidators();
  pipeline.register(...validators);

  const pipelineValidators = pipeline.getRegisteredValidators();
  if (pipelineValidators.length > 0) {
    pluginRegistry.registerValidator(pipelineValidators[0]!);
  }

  await pluginRegistry.runHook('beforeScan', config);

  const files = await scanFiles(rootPath, {
    include: config.include,
    exclude: config.exclude,
  });

  const project = await resolveProject(rootPath, files);

  await pluginRegistry.runHook('afterScan', project);

  const entryPoints = project.framework.entryPoints;
  const graph = await buildDependencyGraph(files, entryPoints, rootPath);

  await pluginRegistry.runHook('beforeValidate', project);

  let report: ValidationReport;

  if (options.phases && options.phases.length > 0) {
    const allResults = [];
    let totalDuration = 0;
    for (const phase of options.phases) {
      const phaseReport = await pipeline.runPhase(phase, project, graph, config);
      allResults.push(...phaseReport.results);
      totalDuration += phaseReport.duration;
    }
    const healthScore = calculateHealthScore(allResults);
    const summary = aggregateReport(allResults);
    report = {
      project,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      results: allResults,
      healthScore,
      summary,
    };
  } else {
    report = await pipeline.run(project, graph, config);
  }

  await pluginRegistry.runHook('afterValidate', report);

  await pluginRegistry.runHook('beforeReport', report);

  const reporters: ReporterModule[] = [];

  for (const reporterName of config.reporters) {
    switch (reporterName) {
      case 'console':
        reporters.push(consoleReporter);
        break;
      case 'json':
        reporters.push(createJsonReporter());
        break;
      case 'markdown':
        reporters.push(createMarkdownReporter());
        break;
      case 'github-actions':
        reporters.push(createGitHubActionsReporter());
        break;
    }
  }

  if (options.reporters) {
    reporters.push(...options.reporters);
  }

  for (const reporter of reporters) {
    await reporter.write(report);
  }

  return report;
}

export async function runStatic(cwd?: string): Promise<ValidationReport> {
  return validate({ cwd, phases: ['static', 'environment', 'architecture'] });
}

export async function runCompile(cwd?: string): Promise<ValidationReport> {
  return validate({ cwd, phases: ['compile'] });
}

export async function runRuntime(cwd?: string): Promise<ValidationReport> {
  return validate({ cwd, phases: ['runtime'] });
}

export async function runHealth(cwd?: string): Promise<ValidationReport> {
  return validate({ cwd });
}

export async function runDoctor(cwd?: string): Promise<string> {
  const report = await validate({ cwd });
  return generateDoctorReport(report);
}

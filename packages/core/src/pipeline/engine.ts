import type {
  ProjectInfo,
  DependencyGraph,
  ProjectValidatorConfig,
  ValidationResult,
  ValidationPhase,
  ValidatorModule,
  ValidationReport,
  HealthScore,
} from '../types.js';
import { createContext } from './context.js';
import { executeValidators } from './executor.js';
import { calculateHealthScore } from '../scoring/health-score.js';
import { aggregateReport } from './aggregator.js';

const PHASE_ORDER: ValidationPhase[] = [
  'static',
  'environment',
  'architecture',
  'compile',
  'runtime',
  'security',
];

export class ValidationPipeline {
  private validators: ValidatorModule[] = [];

  register(...validators: ValidatorModule[]): void {
    this.validators.push(...validators);
  }

  getRegisteredValidators(): ValidatorModule[] {
    return [...this.validators];
  }

  async run(
    project: ProjectInfo,
    graph: DependencyGraph,
    config: ProjectValidatorConfig,
  ): Promise<ValidationReport> {
    const startTime = Date.now();
    const context = createContext(project, graph, config);

    for (const phase of PHASE_ORDER) {
      const phaseConfig = config.phases?.[phase];
      if (phaseConfig && !phaseConfig.enabled) continue;

      await executeValidators(this.validators, phase, context);
    }

    const duration = Date.now() - startTime;
    const healthScore = calculateHealthScore(context.results);
    const summary = aggregateReport(context.results);

    return {
      project,
      timestamp: new Date().toISOString(),
      duration,
      results: context.results,
      healthScore,
      summary,
    };
  }

  async runPhase(
    phase: ValidationPhase,
    project: ProjectInfo,
    graph: DependencyGraph,
    config: ProjectValidatorConfig,
  ): Promise<ValidationReport> {
    const startTime = Date.now();
    const context = createContext(project, graph, config);

    await executeValidators(this.validators, phase, context);

    const duration = Date.now() - startTime;
    const healthScore = calculateHealthScore(context.results);
    const summary = aggregateReport(context.results);

    return {
      project,
      timestamp: new Date().toISOString(),
      duration,
      results: context.results,
      healthScore,
      summary,
    };
  }
}

export function createPipeline(): ValidationPipeline {
  return new ValidationPipeline();
}

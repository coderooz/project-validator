import type { ValidatorModule, ValidationContext, ValidationResult } from '../../types.js';

export const circularDependencyValidator: ValidatorModule = {
  name: 'circular-dependency',
  phase: 'static',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const { graph } = context;

    for (const cycle of graph.circularDependencies) {
      issues.push({
        id: `circular-dep-${cycle.join('-')}`,
        category: 'CIRCULAR_DEPENDENCY',
        severity: 'high',
        phase: 'static',
        file: cycle[0],
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        recommendation: 'Extract shared code into a separate module or use dependency injection.',
        metadata: { cycle },
      });
    }

    return {
      phase: 'static',
      name: 'circular-dependency',
      passed: issues.length === 0,
      issues,
      duration: 0,
    };
  },
};

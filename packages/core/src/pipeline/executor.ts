import type { ValidatorModule, ValidationContext, ValidationPhase } from '../types.js';

export async function executeValidators(
  validators: ValidatorModule[],
  phase: ValidationPhase,
  context: ValidationContext,
): Promise<void> {
  const phaseValidators = validators.filter((v) => v.phase === phase);

  for (const validator of phaseValidators) {
    const startTime = Date.now();
    try {
      const result = await validator.validate(context);
      result.duration = Date.now() - startTime;
      context.results.push(result);
    } catch (error) {
      context.results.push({
        phase,
        name: validator.name,
        passed: false,
        issues: [
          {
            id: `validator-crash-${validator.name}`,
            category: 'UNKNOWN',
            severity: 'critical',
            phase,
            message: `Validator "${validator.name}" crashed: ${error instanceof Error ? error.message : String(error)}`,
            recommendation: 'Check validator implementation for bugs.',
          },
        ],
        duration: Date.now() - startTime,
      });
    }
  }
}

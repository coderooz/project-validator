import type {
  ValidatorPlugin,
  ValidatorModule,
  ReporterModule,
  ProjectInfo,
  ProjectValidatorConfig,
  ValidationReport,
  ValidationContext,
} from '../types.js';

export class PluginRegistry {
  private plugins: ValidatorPlugin[] = [];
  private validators: ValidatorModule[] = [];
  private reporters: ReporterModule[] = [];

  register(plugin: ValidatorPlugin): void {
    this.plugins.push(plugin);

    if (plugin.validators) {
      this.validators.push(...plugin.validators);
    }

    if (plugin.reporters) {
      this.reporters.push(...plugin.reporters);
    }
  }

  registerValidator(validator: ValidatorModule): void {
    this.validators.push(validator);
  }

  registerReporter(reporter: ReporterModule): void {
    this.reporters.push(reporter);
  }

  getValidators(): ValidatorModule[] {
    return [...this.validators];
  }

  getReporters(): ReporterModule[] {
    return [...this.reporters];
  }

  getPlugins(): ValidatorPlugin[] {
    return [...this.plugins];
  }

  async runHook(hook: keyof NonNullable<ValidatorPlugin['hooks']>, ...args: unknown[]): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.hooks?.[hook]) {
        await (plugin.hooks[hook] as (...args: unknown[]) => Promise<void>)(...args);
      }
    }
  }
}

export function createPluginRegistry(): PluginRegistry {
  return new PluginRegistry();
}

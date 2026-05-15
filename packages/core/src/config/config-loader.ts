import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectValidatorConfig, ValidationPhase } from '../types.js';

const DEFAULT_CONFIG: ProjectValidatorConfig = {
  include: ['src/**/*.{ts,tsx,js,jsx}', 'app/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}'],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/.git/**',
    '**/coverage/**',
  ],
  phases: {
    static: { enabled: true },
    environment: { enabled: true },
    architecture: { enabled: true },
    compile: { enabled: true },
    runtime: { enabled: false },
    security: { enabled: false },
  },
  timeout: 120000,
  reporters: ['console', 'json'],
};

const CONFIG_FILES = [
  'project-validator.config.ts',
  'project-validator.config.js',
  'project-validator.config.mjs',
  '.project-validator.json',
  'project-validator.json',
];

export function loadConfig(rootPath: string): ProjectValidatorConfig {
  for (const configFile of CONFIG_FILES) {
    const configPath = join(rootPath, configFile);
    if (!existsSync(configPath)) continue;

    try {
      if (configFile.endsWith('.json')) {
        const content = readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(content) as Partial<ProjectValidatorConfig>;
        return mergeConfig(DEFAULT_CONFIG, parsed);
      }

      if (configFile.endsWith('.ts') || configFile.endsWith('.js') || configFile.endsWith('.mjs')) {
        console.warn(`Config file "${configFile}" requires dynamic import - falling back to defaults for CLI usage.`);
        continue;
      }
    } catch (error) {
      console.warn(`Failed to load config "${configFile}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { ...DEFAULT_CONFIG };
}

function mergeConfig(base: ProjectValidatorConfig, override: Partial<ProjectValidatorConfig>): ProjectValidatorConfig {
  const merged: ProjectValidatorConfig = {
    ...base,
    ...override,
    include: override.include ?? base.include,
    exclude: override.exclude ?? base.exclude,
    phases: { ...base.phases },
    reporters: override.reporters ?? base.reporters,
  };

  if (override.phases) {
    for (const [phase, config] of Object.entries(override.phases)) {
      if (config) {
        merged.phases[phase as ValidationPhase] = {
          ...base.phases[phase as ValidationPhase],
          ...config,
        } as any;
      }
    }
  }

  if (override.env) {
    merged.env = { ...base.env, ...override.env };
  }

  return merged;
}

export { DEFAULT_CONFIG };

import type { ProjectInfo, DependencyGraph, ProjectValidatorConfig, ValidationResult, ValidationContext } from '../types.js';

export function createContext(
  project: ProjectInfo,
  graph: DependencyGraph,
  config: ProjectValidatorConfig,
): ValidationContext {
  return {
    project,
    graph,
    config,
    results: [],
    cache: new Map(),
  };
}

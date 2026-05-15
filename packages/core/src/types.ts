export type FrameworkType = 'nextjs' | 'react' | 'node' | 'express' | 'nestjs' | 'python' | 'go' | 'generic';

export type LanguageType = 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'java';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type IssueCategory =
  | 'TYPESCRIPT'
  | 'ESLINT'
  | 'WEBPACK'
  | 'NEXT_CONFIG'
  | 'ENVIRONMENT'
  | 'RUNTIME_IMPORT'
  | 'SERVER_ACTION'
  | 'HYDRATION'
  | 'BUILD_SYSTEM'
  | 'DEPENDENCY'
  | 'ARCHITECTURE'
  | 'CIRCULAR_DEPENDENCY'
  | 'UNUSED_EXPORT'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'UNKNOWN';

export type ValidationPhase =
  | 'static'
  | 'compile'
  | 'runtime'
  | 'security'
  | 'architecture'
  | 'environment';

export interface ValidationIssue {
  id: string;
  category: IssueCategory;
  severity: Severity;
  phase: ValidationPhase;
  file?: string;
  line?: number;
  column?: number;
  message: string;
  recommendation?: string;
  code?: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  phase: ValidationPhase;
  name: string;
  passed: boolean;
  issues: ValidationIssue[];
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface FileInfo {
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  language: LanguageType;
}

export interface DependencyNode {
  path: string;
  imports: string[];
  exportedBy: string[];
  isEntryPoint: boolean;
  metadata?: Record<string, unknown>;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  circularDependencies: string[][];
  entryPoints: string[];
}

export interface FrameworkInfo {
  type: FrameworkType;
  version?: string;
  configPath?: string;
  entryPoints: string[];
}

export interface ProjectInfo {
  name: string;
  version?: string;
  framework: FrameworkInfo;
  language: LanguageType;
  rootPath: string;
  files: FileInfo[];
}

export interface ScannerConfig {
  include: string[];
  exclude: string[];
  maxFileSize: number;
}

export interface ValidatorConfig {
  enabled: boolean;
  options?: Record<string, unknown>;
}

export interface ProjectValidatorConfig {
  name?: string;
  include: string[];
  exclude: string[];
  phases: Partial<Record<ValidationPhase, ValidatorConfig>>;
  timeout: number;
  reporters: string[];
  framework?: FrameworkType;
  env?: Record<string, string>;
}

export interface HealthScore {
  overall: number;
  categories: Record<string, number>;
  breakdown: {
    category: string;
    score: number;
    weight: number;
    issues: number;
  }[];
}

export interface ValidationReport {
  project: ProjectInfo;
  timestamp: string;
  duration: number;
  results: ValidationResult[];
  healthScore: HealthScore;
  summary: {
    total: number;
    passed: number;
    failed: number;
    issues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export interface Diagnosis {
  issue: string;
  rootCause: string;
  recommendations: string[];
  severity: Severity;
  cascadingFailures: string[];
}

export interface ValidatorPlugin {
  name: string;
  version: string;
  hooks?: {
    beforeScan?: (config: ProjectValidatorConfig) => Promise<void>;
    afterScan?: (project: ProjectInfo) => Promise<void>;
    beforeValidate?: (project: ProjectInfo) => Promise<void>;
    afterValidate?: (report: ValidationReport) => Promise<void>;
    beforeReport?: (report: ValidationReport) => Promise<void>;
  };
  validators?: ValidatorModule[];
  reporters?: ReporterModule[];
}

export interface ValidatorModule {
  name: string;
  phase: ValidationPhase;
  validate(context: ValidationContext): Promise<ValidationResult>;
}

export interface ReporterModule {
  name: string;
  write(report: ValidationReport): Promise<void>;
}

export interface ValidationContext {
  project: ProjectInfo;
  graph: DependencyGraph;
  config: ProjectValidatorConfig;
  results: ValidationResult[];
  cache: Map<string, unknown>;
}

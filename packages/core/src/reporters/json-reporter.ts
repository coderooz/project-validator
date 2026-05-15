import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidationReport, ReporterModule } from '../types.js';

function serializeReport(report: ValidationReport): string {
  const serializable = {
    project: {
      name: report.project.name,
      version: report.project.version,
      framework: report.project.framework.type,
      rootPath: report.project.rootPath,
      fileCount: report.project.files.length,
    },
    timestamp: report.timestamp,
    duration: report.duration,
    summary: report.summary,
    healthScore: report.healthScore,
    results: report.results.map((r) => ({
      phase: r.phase,
      name: r.name,
      passed: r.passed,
      duration: r.duration,
      issues: r.issues.map((i) => ({
        id: i.id,
        category: i.category,
        severity: i.severity,
        phase: i.phase,
        file: i.file,
        line: i.line,
        column: i.column,
        message: i.message,
        recommendation: i.recommendation,
      })),
    })),
  };

  return JSON.stringify(serializable, null, 2);
}

export function createJsonReporter(outputPath?: string): ReporterModule {
  return {
    name: 'json',
    async write(report: ValidationReport): Promise<void> {
      const json = serializeReport(report);
      const filePath = outputPath ?? join(process.cwd(), 'reports', 'validation-report.json');

      const { mkdirSync, existsSync } = await import('node:fs');
      const { dirname } = await import('node:path');
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(filePath, json, 'utf-8');
      console.log(`\x1b[36m📄 JSON report written to: ${filePath}\x1b[0m`);
    },
  };
}

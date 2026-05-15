import type { ValidationResult, HealthScore } from '../types.js';
import type { IssueCategory } from '../types.js';

interface ScoreCategory {
  name: string;
  weight: number;
  categories: IssueCategory[];
}

const SCORE_CATEGORIES: ScoreCategory[] = [
  { name: 'Type Safety', weight: 25, categories: ['TYPESCRIPT'] },
  { name: 'Architecture', weight: 20, categories: ['ARCHITECTURE', 'CIRCULAR_DEPENDENCY'] },
  { name: 'Runtime Stability', weight: 20, categories: ['RUNTIME_IMPORT', 'SERVER_ACTION', 'HYDRATION'] },
  { name: 'Dependency Health', weight: 15, categories: ['DEPENDENCY', 'UNUSED_EXPORT'] },
  { name: 'Build Reliability', weight: 20, categories: ['BUILD_SYSTEM', 'NEXT_CONFIG', 'WEBPACK', 'ESLINT'] },
];

function calculateCategoryScore(
  category: ScoreCategory,
  results: ValidationResult[],
): { score: number; issues: number } {
  let totalIssues = 0;
  let weightedPenalty = 0;

  for (const result of results) {
    for (const issue of result.issues) {
      if (category.categories.includes(issue.category)) {
        totalIssues++;
        switch (issue.severity) {
          case 'critical':
            weightedPenalty += 25;
            break;
          case 'high':
            weightedPenalty += 15;
            break;
          case 'medium':
            weightedPenalty += 8;
            break;
          case 'low':
            weightedPenalty += 3;
            break;
          case 'info':
            weightedPenalty += 1;
            break;
        }
      }
    }
  }

  const score = Math.max(0, Math.min(100, 100 - weightedPenalty));
  return { score, issues: totalIssues };
}

export function calculateHealthScore(results: ValidationResult[]): HealthScore {
  const breakdown = SCORE_CATEGORIES.map((cat) => {
    const { score, issues } = calculateCategoryScore(cat, results);
    return {
      category: cat.name,
      score,
      weight: cat.weight,
      issues,
    };
  });

  const categories: Record<string, number> = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const item of breakdown) {
    categories[item.category] = item.score;
    weightedSum += item.score * item.weight;
    totalWeight += item.weight;
  }

  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;

  return { overall, categories, breakdown };
}

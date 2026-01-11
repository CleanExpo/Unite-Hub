/**
 * Benchmark Insight Brief Service
 *
 * Generates neutral, AI-gated benchmarking insights.
 * If AI disabled by governance, provides deterministic fallback.
 */

import type { BenchmarkSnapshot } from './types';

/**
 * Generate a neutral benchmark insight brief
 */
export async function generateBenchmarkInsight(
  snapshot: BenchmarkSnapshot,
  aiEnabled: boolean = true
): Promise<string> {
  if (!aiEnabled) {
    return generateDeterministicInsight(snapshot);
  }

  // In production: Call Claude Haiku via narrativeService with governance checks
  // For now, return deterministic fallback
  return generateDeterministicInsight(snapshot);
}

/**
 * Deterministic fallback insight (no AI required)
 */
function generateDeterministicInsight(snapshot: BenchmarkSnapshot): string {
  if (snapshot.metrics.length === 0) {
    return 'No benchmark data available. Ensure sufficient operational history.';
  }

  const elevatedMetrics = snapshot.metrics.filter((m) => m.interpretation === 'elevated');
  const belowMetrics = snapshot.metrics.filter((m) => m.interpretation === 'below');
  const typicalMetrics = snapshot.metrics.filter((m) => m.interpretation === 'typical');

  const insights: string[] = [];

  // Generate neutral interpretation bullets
  if (elevatedMetrics.length > 0) {
    insights.push(
      `${elevatedMetrics.length} metric(s) are elevated above cohort median, indicating higher activity volumes.`
    );
  }

  if (belowMetrics.length > 0) {
    insights.push(
      `${belowMetrics.length} metric(s) are below cohort median, indicating lower activity volumes or higher stability.`
    );
  }

  if (typicalMetrics.length > 0) {
    insights.push(
      `${typicalMetrics.length} metric(s) align with peer cohort baseline, indicating comparable operational patterns.`
    );
  }

  // Add cohort context
  insights.push(
    `Comparison against ${snapshot.cohort.size}+ ${snapshot.cohort.industryLabel} peer organizations.`
  );

  // Add safety note
  insights.push(
    'Benchmarks are contextual operational indicators, not rankings or compliance metrics.'
  );

  return insights.join(' ');
}

/**
 * Ensure all insight language is neutral (no competitive/ranking terms)
 */
export function isNeutralLanguage(text: string): boolean {
  const forbiddenTerms = [
    /\bbetter\b/i,
    /\bworse\b/i,
    /\bsuperior\b/i,
    /\binferior\b/i,
    /\bfailing\b/i,
    /\bleading\b/i,
    /\btrailing\b/i,
    /\bcompetitive\b/i,
    /\brankings?\b/i,
    /\bscore\b/i,
    /\bperformance\b/i
  ];

  return !forbiddenTerms.some((term) => term.test(text));
}

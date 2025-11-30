/**
 * Synthex Algorithm Engine
 *
 * Blue Ocean Strategy alternative to standard ranking methods.
 * Provides multiple approaches for A/B testing to understand what works best.
 *
 * @example
 * ```typescript
 * import { synthexEngine, evaluateRanking, SYNTHEX_CONFIG } from '@/lib/algorithms';
 *
 * // Create an A/B test
 * synthexEngine.createABTest({
 *   testId: 'ranking-v1',
 *   methods: ['simple', 'din', 'hybrid'],
 *   trafficSplit: [33, 33, 34],
 *   startDate: new Date(),
 *   primaryMetric: 'ndcg',
 *   minimumSampleSize: 1000,
 * });
 *
 * // Rank items for a user
 * const results = synthexEngine.rank(items, user, {
 *   testId: 'ranking-v1',
 *   topK: 20,
 * });
 *
 * // Evaluate ranking quality
 * const metrics = evaluateRanking(predictions, groundTruth);
 * console.log('NDCG@10:', metrics.ndcg[10]);
 * ```
 */

// Main engine and types
export {
  SynthexRankingEngine,
  synthexEngine,
  SYNTHEX_CONFIG,
  type EngagementWeights,
  type ContentFeatures,
  type CreatorFeatures,
  type UserFeatures,
  type EngagementPattern,
  type RankingResult,
  type RankingMethod,
  type EvaluationMetrics,
  type ABTestConfig,
  type ABTestResult,
} from './synthex-engine';

// Loss functions
export {
  bprLoss,
  binaryCrossEntropyLoss,
  infoNCELoss,
} from './synthex-engine';

// Evaluation metrics
export {
  ndcgAtK,
  meanReciprocalRank,
  meanAveragePrecision,
  hitRateAtK,
  precisionAtK,
  recallAtK,
  evaluateRanking,
} from './synthex-engine';

// Scoring algorithms
export {
  simpleWeightedScore,
  dinAttentionScore,
  hybridScore,
} from './synthex-engine';

// Negative sampling
export {
  uniformSample,
  popularitySample,
  hardNegativeSample,
} from './synthex-engine';

// Cold start solutions
export {
  coldStartContentScore,
  coldStartPopularityScore,
} from './synthex-engine';

// A/B Testing
export { ABTestManager } from './synthex-engine';

// Configuration JSON
import synthexConfigJson from './synthex-config.json';
export const algorithmSpec = synthexConfigJson;

/**
 * Quick reference for available ranking methods
 */
export const RANKING_METHODS = {
  simple: 'Basic weighted scoring - fast, interpretable baseline',
  din: 'Deep Interest Network - attention-based personalisation',
  hybrid: 'Combined approach - best of both worlds',
  bpr: 'Bayesian Personalized Ranking - pairwise optimisation',
  ncf: 'Neural Collaborative Filtering - deep learning based',
  deepfm: 'Deep Factorisation Machine - CTR prediction',
  dcn: 'Deep Cross Network - explicit feature crossing',
  lightgcn: 'Light GCN - graph-based collaborative filtering',
} as const;

/**
 * Platform engagement weight references (verified from open source)
 */
export const PLATFORM_WEIGHTS = {
  twitter: SYNTHEX_CONFIG.engagementWeights,
  seo: SYNTHEX_CONFIG.seoWeights,
  webVitals: SYNTHEX_CONFIG.coreWebVitals,
} as const;

/**
 * Quick utility to compare two ranking methods
 */
export function compareRankingMethods(
  method1Results: EvaluationMetrics,
  method2Results: EvaluationMetrics,
  primaryMetric: 'ndcg' | 'mrr' | 'map' = 'ndcg',
  k: number = 10
): {
  winner: 'method1' | 'method2' | 'tie';
  improvement: number;
  metrics: {
    method1: number;
    method2: number;
  };
} {
  let m1Score: number;
  let m2Score: number;

  switch (primaryMetric) {
    case 'ndcg':
      m1Score = method1Results.ndcg[k] || 0;
      m2Score = method2Results.ndcg[k] || 0;
      break;
    case 'mrr':
      m1Score = method1Results.mrr;
      m2Score = method2Results.mrr;
      break;
    case 'map':
      m1Score = method1Results.map;
      m2Score = method2Results.map;
      break;
  }

  const diff = m1Score - m2Score;
  const improvement = m2Score > 0 ? ((m1Score - m2Score) / m2Score) * 100 : 0;

  return {
    winner: diff > 0.01 ? 'method1' : diff < -0.01 ? 'method2' : 'tie',
    improvement: Math.abs(improvement),
    metrics: {
      method1: m1Score,
      method2: m2Score,
    },
  };
}

// Import types for EvaluationMetrics in compareRankingMethods
import type { EvaluationMetrics } from './synthex-engine';
import { SYNTHEX_CONFIG } from './synthex-engine';

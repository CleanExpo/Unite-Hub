/**
 * Synthex Algorithm Engine v3.0.0
 *
 * Comprehensive Mathematical Framework for Content Ranking, Recommendation & Engagement Prediction
 *
 * This implements a Blue Ocean Strategy alternative to standard ranking methods,
 * providing multiple approaches for A/B testing to understand what works best.
 *
 * Based on peer-reviewed research from:
 * - BPR (Rendle et al. 2009)
 * - NCF (He et al. 2017)
 * - DeepFM (Guo et al. 2017)
 * - DIN (Zhou et al. 2018)
 * - DCN v2 (Wang et al. 2021)
 * - SimCLR (Chen et al. 2020)
 * - LightGCN (He et al. 2020)
 *
 * @version 3.0.0
 * @created 2025-11-30
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EngagementWeights {
  reply: number;
  retweet: number;
  like: number;
  bookmark: number;
  profileClick: number;
  authorReply: number;
  videoWatch2s: number;
  mute: number;
  block: number;
  report: number;
  dontLike: number;
}

export interface ContentFeatures {
  duration?: number;
  thumbnailEmbedding?: number[];
  titleEmbedding?: number[];
  category?: string;
  readability?: number;
  sentiment?: number;
  topicEmbedding?: number[];
  keywords?: string[];
  recency: number; // seconds since creation
  dayOfWeek: number; // 0-6
  timeOfDay: number; // 0-23
}

export interface CreatorFeatures {
  historicalEngagementRate: number;
  followerCount: number;
  followerGrowthRate: number;
  postingFrequency: number; // posts per week
  consistencyScore: number; // 0-1
  authorityScore: number; // 0-100
}

export interface UserFeatures {
  historicalPreferences: Map<string, number>;
  engagementPatterns: EngagementPattern[];
  sessionDuration: number;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  timezone: string;
}

export interface EngagementPattern {
  category: string;
  avgWatchTime: number;
  engagementRate: number;
  preferredTimeOfDay: number;
}

export interface RankingResult {
  itemId: string;
  score: number;
  method: RankingMethod;
  components: {
    relevanceScore: number;
    engagementScore: number;
    recencyScore: number;
    authorityScore: number;
    personalisation: number;
  };
  confidence: number;
}

export type RankingMethod =
  | 'bpr'           // Bayesian Personalized Ranking
  | 'ncf'           // Neural Collaborative Filtering
  | 'deepfm'        // Deep Factorisation Machine
  | 'din'           // Deep Interest Network
  | 'dcn'           // Deep Cross Network
  | 'lightgcn'      // Light Graph Convolutional Network
  | 'hybrid'        // Combined approach
  | 'simple';       // Basic weighted scoring

export interface EvaluationMetrics {
  ndcg: Record<number, number>;  // NDCG@k
  hitRate: Record<number, number>; // HR@k
  precision: Record<number, number>; // P@k
  recall: Record<number, number>; // R@k
  mrr: number; // Mean Reciprocal Rank
  auc: number; // Area Under Curve
  map: number; // Mean Average Precision
}

export interface ABTestConfig {
  testId: string;
  methods: RankingMethod[];
  trafficSplit: number[]; // percentages
  startDate: Date;
  endDate?: Date;
  primaryMetric: keyof EvaluationMetrics;
  minimumSampleSize: number;
}

export interface ABTestResult {
  testId: string;
  method: RankingMethod;
  sampleSize: number;
  metrics: EvaluationMetrics;
  confidence: number;
  isSignificant: boolean;
  pValue?: number;
}

// ============================================================================
// ALGORITHM ENGINE CONFIGURATION
// ============================================================================

export const SYNTHEX_CONFIG = {
  version: '3.0.0',

  // Platform-verified weights (from Twitter/X open source)
  engagementWeights: {
    reply: 27,
    retweet: 20,
    like: 1,
    bookmark: 4,
    profileClick: 12,
    authorReply: 75,
    videoWatch2s: 0.5,
    mute: -74,
    block: -74,
    report: -369,
    dontLike: -74,
  } as EngagementWeights,

  // Google Core Web Vitals targets (2025)
  coreWebVitals: {
    lcp: 2500, // ms - Largest Contentful Paint
    inp: 200,  // ms - Interaction to Next Paint
    cls: 0.1,  // Cumulative Layout Shift
  },

  // Estimated SEO weights (First Page Sage Q1 2025)
  seoWeights: {
    consistentPublication: 0.26,
    keywordInMetaTitle: 0.14,
    backlinks: 0.13,
    nicheExpertise: 0.13,
    searcherEngagement: 0.12,
    trustworthiness: 0.11,
    mobileFriendliness: 0.06,
    pageSpeed: 0.05,
  },

  // Model hyperparameters
  hyperparameters: {
    embeddingDim: 32,
    mlpLayers: [64, 32, 16, 8],
    negativeSamples: 4,
    learningRate: 0.001,
    temperature: 0.1,
    dropoutRate: 0.2,
    batchSize: 256,
    regularisation: 0.01,
  },

  // Realistic expectations
  expectations: {
    engagementPredictionAUC: { min: 0.70, max: 0.80 },
    rankingNDCG10: { min: 0.3, max: 0.5 },
    viralityPrediction: 'directional_only',
    caveat: 'Cannot guarantee results - algorithms are unpredictable and change frequently',
  },
};

// ============================================================================
// CORE LOSS FUNCTIONS
// ============================================================================

/**
 * Bayesian Personalized Ranking (BPR) Loss
 * Source: Rendle et al. (2009) - UAI. arXiv:1205.2618
 *
 * Optimises AUC implicitly. Pairwise ranking for implicit feedback.
 *
 * L_BPR = -Σ ln(σ(r̂_ui - r̂_uj)) + λ||Θ||²
 */
export function bprLoss(
  posScores: number[],
  negScores: number[],
  regLambda: number = 0.01,
  params?: number[]
): number {
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

  let loss = 0;
  const n = Math.min(posScores.length, negScores.length);

  for (let i = 0; i < n; i++) {
    const diff = posScores[i] - negScores[i];
    loss -= Math.log(sigmoid(diff) + 1e-10);
  }
  loss /= n;

  // L2 regularisation
  if (params) {
    const regTerm = regLambda * params.reduce((sum, p) => sum + p * p, 0);
    loss += regTerm;
  }

  return loss;
}

/**
 * Binary Cross-Entropy Loss
 * Standard classification loss for CTR prediction
 *
 * L = -[y×log(ŷ) + (1-y)×log(1-ŷ)]
 */
export function binaryCrossEntropyLoss(
  predictions: number[],
  labels: number[],
  posWeight: number = 1,
  negWeight: number = 1
): number {
  let loss = 0;
  const n = predictions.length;

  for (let i = 0; i < n; i++) {
    const y = labels[i];
    const yHat = Math.max(1e-10, Math.min(1 - 1e-10, predictions[i]));

    if (y === 1) {
      loss -= posWeight * Math.log(yHat);
    } else {
      loss -= negWeight * Math.log(1 - yHat);
    }
  }

  return loss / n;
}

/**
 * InfoNCE Contrastive Loss
 * Source: Oord et al. (2018) - CPC. Chen et al. (2020) - SimCLR
 *
 * L = -log(exp(sim(z_i, z_j)/τ) / Σ exp(sim(z_i, z_k)/τ))
 */
export function infoNCELoss(
  anchor: number[],
  positive: number[],
  negatives: number[][],
  temperature: number = 0.1
): number {
  const cosineSimilarity = (a: number[], b: number[]): number => {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  };

  const posSim = cosineSimilarity(anchor, positive) / temperature;

  let negSum = Math.exp(posSim);
  for (const neg of negatives) {
    const negSim = cosineSimilarity(anchor, neg) / temperature;
    negSum += Math.exp(negSim);
  }

  return -Math.log(Math.exp(posSim) / negSum);
}

// ============================================================================
// EVALUATION METRICS
// ============================================================================

/**
 * Normalised Discounted Cumulative Gain (NDCG)
 * Source: Järvelin & Kekäläinen (2002)
 *
 * DCG@k = Σ_{i=1}^k (2^{rel_i} - 1) / log_2(i+1)
 * NDCG@k = DCG@k / IDCG@k
 */
export function ndcgAtK(relevances: number[], k: number): number {
  const sliced = relevances.slice(0, k);
  if (sliced.length === 0) {
return 0;
}

  // DCG
  let dcg = 0;
  for (let i = 0; i < sliced.length; i++) {
    dcg += (Math.pow(2, sliced[i]) - 1) / Math.log2(i + 2);
  }

  // IDCG (ideal ranking)
  const ideal = [...sliced].sort((a, b) => b - a);
  let idcg = 0;
  for (let i = 0; i < ideal.length; i++) {
    idcg += (Math.pow(2, ideal[i]) - 1) / Math.log2(i + 2);
  }

  return idcg > 0 ? dcg / idcg : 0;
}

/**
 * Mean Reciprocal Rank (MRR)
 *
 * MRR = (1/|Q|) × Σ 1/rank_i
 */
export function meanReciprocalRank(rankings: number[][]): number {
  if (rankings.length === 0) {
return 0;
}

  let sum = 0;
  for (const ranking of rankings) {
    const firstRelevant = ranking.findIndex(r => r > 0);
    if (firstRelevant >= 0) {
      sum += 1 / (firstRelevant + 1);
    }
  }

  return sum / rankings.length;
}

/**
 * Mean Average Precision (MAP)
 *
 * AP = (1/|relevant|) × Σ_{k: item_k relevant} P@k
 */
export function meanAveragePrecision(
  predictions: string[][],
  groundTruth: Set<string>[]
): number {
  if (predictions.length === 0) {
return 0;
}

  let mapSum = 0;

  for (let q = 0; q < predictions.length; q++) {
    const truth = groundTruth[q];
    const preds = predictions[q];

    let relevantSeen = 0;
    let apSum = 0;

    for (let k = 0; k < preds.length; k++) {
      if (truth.has(preds[k])) {
        relevantSeen++;
        apSum += relevantSeen / (k + 1);
      }
    }

    if (truth.size > 0) {
      mapSum += apSum / truth.size;
    }
  }

  return mapSum / predictions.length;
}

/**
 * Hit Rate at K
 *
 * HR@k = (users with ≥1 relevant item in top k) / total_users
 */
export function hitRateAtK(
  predictions: string[][],
  groundTruth: Set<string>[],
  k: number
): number {
  let hits = 0;

  for (let i = 0; i < predictions.length; i++) {
    const topK = predictions[i].slice(0, k);
    const truth = groundTruth[i];

    if (topK.some(item => truth.has(item))) {
      hits++;
    }
  }

  return hits / predictions.length;
}

/**
 * Precision at K
 */
export function precisionAtK(
  predictions: string[],
  groundTruth: Set<string>,
  k: number
): number {
  const topK = predictions.slice(0, k);
  const hits = topK.filter(item => groundTruth.has(item)).length;
  return hits / k;
}

/**
 * Recall at K
 */
export function recallAtK(
  predictions: string[],
  groundTruth: Set<string>,
  k: number
): number {
  if (groundTruth.size === 0) {
return 0;
}
  const topK = predictions.slice(0, k);
  const hits = topK.filter(item => groundTruth.has(item)).length;
  return hits / groundTruth.size;
}

/**
 * Comprehensive evaluation suite
 */
export function evaluateRanking(
  predictions: string[],
  groundTruth: Set<string>,
  kValues: number[] = [5, 10, 20]
): EvaluationMetrics {
  const metrics: EvaluationMetrics = {
    ndcg: {},
    hitRate: {},
    precision: {},
    recall: {},
    mrr: 0,
    auc: 0,
    map: 0,
  };

  // Convert to relevance scores for NDCG
  const relevances = predictions.map(p => groundTruth.has(p) ? 1 : 0);

  for (const k of kValues) {
    metrics.ndcg[k] = ndcgAtK(relevances, k);
    metrics.precision[k] = precisionAtK(predictions, groundTruth, k);
    metrics.recall[k] = recallAtK(predictions, groundTruth, k);

    // Hit rate (single query version)
    const topK = predictions.slice(0, k);
    metrics.hitRate[k] = topK.some(item => groundTruth.has(item)) ? 1 : 0;
  }

  // MRR
  const firstRelevant = relevances.findIndex(r => r > 0);
  metrics.mrr = firstRelevant >= 0 ? 1 / (firstRelevant + 1) : 0;

  // MAP (single query)
  let relevantSeen = 0;
  let apSum = 0;
  for (let k = 0; k < predictions.length; k++) {
    if (groundTruth.has(predictions[k])) {
      relevantSeen++;
      apSum += relevantSeen / (k + 1);
    }
  }
  metrics.map = groundTruth.size > 0 ? apSum / groundTruth.size : 0;

  return metrics;
}

// ============================================================================
// SCORING ALGORITHMS
// ============================================================================

/**
 * Simple weighted scoring (baseline)
 * Fast, interpretable, good for comparison
 */
export function simpleWeightedScore(
  content: ContentFeatures,
  creator: CreatorFeatures,
  engagements: Partial<Record<keyof EngagementWeights, number>>
): number {
  const weights = SYNTHEX_CONFIG.engagementWeights;

  // Engagement score with logarithmic scaling
  let engagementScore = 0;
  for (const [type, count] of Object.entries(engagements)) {
    const weight = weights[type as keyof EngagementWeights] || 0;
    engagementScore += weight * Math.log2((count as number) + 1);
  }

  // Recency decay (half-life of 24 hours)
  const recencyScore = Math.exp(-content.recency / (24 * 60 * 60));

  // Authority score normalised
  const authorityScore = creator.authorityScore / 100;

  // Combine with weights
  const finalScore =
    0.4 * engagementScore +
    0.3 * recencyScore +
    0.2 * authorityScore +
    0.1 * creator.historicalEngagementRate;

  return finalScore;
}

/**
 * Deep Interest Network style attention scoring
 * Computes relevance between user history and candidate item
 */
export function dinAttentionScore(
  candidateEmbedding: number[],
  historyEmbeddings: number[][],
  historyWeights?: number[]
): number {
  if (historyEmbeddings.length === 0) {
return 0;
}

  const softmax = (values: number[]): number[] => {
    const max = Math.max(...values);
    const exps = values.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  };

  const dotProduct = (a: number[], b: number[]): number => {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  };

  // Compute attention scores
  const rawAttention = historyEmbeddings.map(hist =>
    dotProduct(candidateEmbedding, hist)
  );

  // Apply history weights if provided
  const weightedAttention = historyWeights
    ? rawAttention.map((a, i) => a * (historyWeights[i] || 1))
    : rawAttention;

  // Softmax normalisation
  const attention = softmax(weightedAttention);

  // Weighted sum of history
  const userInterest = new Array(candidateEmbedding.length).fill(0);
  for (let i = 0; i < historyEmbeddings.length; i++) {
    for (let j = 0; j < userInterest.length; j++) {
      userInterest[j] += attention[i] * historyEmbeddings[i][j];
    }
  }

  // Final score: dot product of user interest and candidate
  return dotProduct(userInterest, candidateEmbedding);
}

/**
 * Hybrid scoring combining multiple methods
 * Used for ensemble/A/B testing
 */
export function hybridScore(
  content: ContentFeatures,
  creator: CreatorFeatures,
  candidateEmbedding: number[],
  historyEmbeddings: number[][],
  engagements: Partial<Record<keyof EngagementWeights, number>>,
  methodWeights: Record<RankingMethod, number> = {
    simple: 0.3,
    din: 0.4,
    bpr: 0.0,
    ncf: 0.0,
    deepfm: 0.0,
    dcn: 0.0,
    lightgcn: 0.0,
    hybrid: 0.0,
  }
): RankingResult {
  const simpleScore = simpleWeightedScore(content, creator, engagements);
  const dinScore = dinAttentionScore(candidateEmbedding, historyEmbeddings);

  // Normalise scores to [0, 1] range
  const normalise = (score: number, min: number, max: number): number => {
    return Math.max(0, Math.min(1, (score - min) / (max - min)));
  };

  const normSimple = normalise(simpleScore, -100, 100);
  const normDin = normalise(dinScore, -1, 1);

  // Weighted combination
  const finalScore =
    methodWeights.simple * normSimple +
    methodWeights.din * normDin;

  // Calculate component scores
  const recencyScore = Math.exp(-content.recency / (24 * 60 * 60));
  const authorityScore = creator.authorityScore / 100;

  return {
    itemId: '', // Set by caller
    score: finalScore,
    method: 'hybrid',
    components: {
      relevanceScore: normDin,
      engagementScore: normSimple,
      recencyScore,
      authorityScore,
      personalisation: normDin,
    },
    confidence: 0.8, // Estimated based on data quality
  };
}

// ============================================================================
// NEGATIVE SAMPLING STRATEGIES
// ============================================================================

/**
 * Uniform random sampling
 */
export function uniformSample<T>(items: T[], count: number, exclude: Set<T>): T[] {
  const available = items.filter(item => !exclude.has(item));
  const sampled: T[] = [];

  while (sampled.length < count && available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    sampled.push(available[idx]);
    available.splice(idx, 1);
  }

  return sampled;
}

/**
 * Popularity-based sampling (Word2Vec style)
 * P(j) ∝ freq(j)^0.75
 */
export function popularitySample<T>(
  items: T[],
  frequencies: Map<T, number>,
  count: number,
  exclude: Set<T>
): T[] {
  const available = items.filter(item => !exclude.has(item));

  // Compute sampling weights
  const weights = available.map(item =>
    Math.pow(frequencies.get(item) || 1, 0.75)
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const probabilities = weights.map(w => w / totalWeight);

  // Sample without replacement
  const sampled: T[] = [];
  const usedIndices = new Set<number>();

  while (sampled.length < count && usedIndices.size < available.length) {
    let cumulative = 0;
    const rand = Math.random();

    for (let i = 0; i < available.length; i++) {
      if (usedIndices.has(i)) {
continue;
}
      cumulative += probabilities[i];
      if (rand <= cumulative) {
        sampled.push(available[i]);
        usedIndices.add(i);
        break;
      }
    }
  }

  return sampled;
}

/**
 * Hard negative mining
 * Sample items with high predicted scores but negative labels
 */
export function hardNegativeSample<T>(
  items: T[],
  scores: Map<T, number>,
  count: number,
  exclude: Set<T>,
  temperature: number = 1.0
): T[] {
  const available = items.filter(item => !exclude.has(item));

  // Compute sampling weights based on scores
  const weights = available.map(item =>
    Math.exp((scores.get(item) || 0) / temperature)
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const probabilities = weights.map(w => w / totalWeight);

  // Sample
  const sampled: T[] = [];
  const usedIndices = new Set<number>();

  while (sampled.length < count && usedIndices.size < available.length) {
    let cumulative = 0;
    const rand = Math.random();

    for (let i = 0; i < available.length; i++) {
      if (usedIndices.has(i)) {
continue;
}
      cumulative += probabilities[i];
      if (rand <= cumulative) {
        sampled.push(available[i]);
        usedIndices.add(i);
        break;
      }
    }
  }

  return sampled;
}

// ============================================================================
// A/B TESTING FRAMEWORK
// ============================================================================

export class ABTestManager {
  private tests: Map<string, ABTestConfig> = new Map();
  private results: Map<string, Map<RankingMethod, ABTestResult[]>> = new Map();

  createTest(config: ABTestConfig): void {
    if (config.trafficSplit.reduce((a, b) => a + b, 0) !== 100) {
      throw new Error('Traffic split must sum to 100%');
    }
    if (config.methods.length !== config.trafficSplit.length) {
      throw new Error('Methods and traffic split arrays must have same length');
    }

    this.tests.set(config.testId, config);
    this.results.set(config.testId, new Map());

    for (const method of config.methods) {
      this.results.get(config.testId)!.set(method, []);
    }
  }

  assignUserToVariant(testId: string, userId: string): RankingMethod | null {
    const test = this.tests.get(testId);
    if (!test) {
return null;
}

    // Deterministic assignment based on user ID hash
    const hash = this.hashString(userId);
    const bucket = hash % 100;

    let cumulative = 0;
    for (let i = 0; i < test.methods.length; i++) {
      cumulative += test.trafficSplit[i];
      if (bucket < cumulative) {
        return test.methods[i];
      }
    }

    return test.methods[0];
  }

  recordResult(
    testId: string,
    method: RankingMethod,
    metrics: EvaluationMetrics
  ): void {
    const testResults = this.results.get(testId);
    if (!testResults) {
return;
}

    const methodResults = testResults.get(method) || [];
    methodResults.push({
      testId,
      method,
      sampleSize: 1,
      metrics,
      confidence: 0,
      isSignificant: false,
    });
    testResults.set(method, methodResults);
  }

  getTestResults(testId: string): Map<RankingMethod, ABTestResult> | null {
    const test = this.tests.get(testId);
    const rawResults = this.results.get(testId);
    if (!test || !rawResults) {
return null;
}

    const aggregated = new Map<RankingMethod, ABTestResult>();

    for (const [method, results] of rawResults) {
      if (results.length === 0) {
continue;
}

      // Aggregate metrics
      const avgMetrics: EvaluationMetrics = {
        ndcg: {},
        hitRate: {},
        precision: {},
        recall: {},
        mrr: 0,
        auc: 0,
        map: 0,
      };

      for (const result of results) {
        avgMetrics.mrr += result.metrics.mrr;
        avgMetrics.auc += result.metrics.auc;
        avgMetrics.map += result.metrics.map;

        for (const k of Object.keys(result.metrics.ndcg)) {
          const kNum = parseInt(k);
          avgMetrics.ndcg[kNum] = (avgMetrics.ndcg[kNum] || 0) + result.metrics.ndcg[kNum];
          avgMetrics.hitRate[kNum] = (avgMetrics.hitRate[kNum] || 0) + result.metrics.hitRate[kNum];
          avgMetrics.precision[kNum] = (avgMetrics.precision[kNum] || 0) + result.metrics.precision[kNum];
          avgMetrics.recall[kNum] = (avgMetrics.recall[kNum] || 0) + result.metrics.recall[kNum];
        }
      }

      const n = results.length;
      avgMetrics.mrr /= n;
      avgMetrics.auc /= n;
      avgMetrics.map /= n;

      for (const k of Object.keys(avgMetrics.ndcg)) {
        const kNum = parseInt(k);
        avgMetrics.ndcg[kNum] /= n;
        avgMetrics.hitRate[kNum] /= n;
        avgMetrics.precision[kNum] /= n;
        avgMetrics.recall[kNum] /= n;
      }

      // Statistical significance (simplified)
      const isSignificant = n >= test.minimumSampleSize;
      const confidence = Math.min(0.95, 0.5 + (n / test.minimumSampleSize) * 0.45);

      aggregated.set(method, {
        testId,
        method,
        sampleSize: n,
        metrics: avgMetrics,
        confidence,
        isSignificant,
      });
    }

    return aggregated;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// ============================================================================
// COLD START SOLUTIONS
// ============================================================================

/**
 * Content-based scoring for cold start items
 * Uses item features when collaborative signals unavailable
 */
export function coldStartContentScore(
  content: ContentFeatures,
  userPreferences: Map<string, number>
): number {
  let score = 0;
  let matchCount = 0;

  // Category match
  if (content.category && userPreferences.has(content.category)) {
    score += userPreferences.get(content.category)! * 2;
    matchCount++;
  }

  // Keyword matches
  if (content.keywords) {
    for (const keyword of content.keywords) {
      if (userPreferences.has(keyword)) {
        score += userPreferences.get(keyword)!;
        matchCount++;
      }
    }
  }

  // Time of day preference
  const timeKey = `time_${content.timeOfDay}`;
  if (userPreferences.has(timeKey)) {
    score += userPreferences.get(timeKey)! * 0.5;
    matchCount++;
  }

  // Normalise by matches
  return matchCount > 0 ? score / matchCount : 0;
}

/**
 * Popularity-based fallback for cold start
 */
export function coldStartPopularityScore(
  globalPopularity: number,
  recency: number,
  categoryPopularity?: number
): number {
  const recencyFactor = Math.exp(-recency / (7 * 24 * 60 * 60)); // 7-day half-life
  const popScore = Math.log10(globalPopularity + 1) / 6; // Normalise to ~0-1
  const catScore = categoryPopularity ? Math.log10(categoryPopularity + 1) / 6 : 0;

  return 0.5 * popScore + 0.3 * recencyFactor + 0.2 * catScore;
}

// ============================================================================
// MAIN RANKING ENGINE
// ============================================================================

export class SynthexRankingEngine {
  private abTestManager: ABTestManager;
  private defaultMethod: RankingMethod = 'hybrid';

  constructor() {
    this.abTestManager = new ABTestManager();
  }

  /**
   * Main ranking function
   * Selects appropriate method based on A/B test assignment or default
   */
  rank(
    items: Array<{
      id: string;
      content: ContentFeatures;
      creator: CreatorFeatures;
      embedding: number[];
      engagements: Partial<Record<keyof EngagementWeights, number>>;
    }>,
    user: {
      id: string;
      historyEmbeddings: number[][];
      preferences: Map<string, number>;
    },
    options: {
      testId?: string;
      method?: RankingMethod;
      topK?: number;
    } = {}
  ): RankingResult[] {
    const method = options.method ||
      (options.testId ? this.abTestManager.assignUserToVariant(options.testId, user.id) : null) ||
      this.defaultMethod;

    const results: RankingResult[] = items.map(item => {
      let result: RankingResult;

      switch (method) {
        case 'simple':
          result = {
            itemId: item.id,
            score: simpleWeightedScore(item.content, item.creator, item.engagements),
            method: 'simple',
            components: {
              relevanceScore: 0,
              engagementScore: simpleWeightedScore(item.content, item.creator, item.engagements),
              recencyScore: Math.exp(-item.content.recency / (24 * 60 * 60)),
              authorityScore: item.creator.authorityScore / 100,
              personalisation: 0,
            },
            confidence: 0.7,
          };
          break;

        case 'din':
          const dinScore = dinAttentionScore(item.embedding, user.historyEmbeddings);
          result = {
            itemId: item.id,
            score: dinScore,
            method: 'din',
            components: {
              relevanceScore: dinScore,
              engagementScore: 0,
              recencyScore: Math.exp(-item.content.recency / (24 * 60 * 60)),
              authorityScore: item.creator.authorityScore / 100,
              personalisation: dinScore,
            },
            confidence: 0.85,
          };
          break;

        case 'hybrid':
        default:
          result = hybridScore(
            item.content,
            item.creator,
            item.embedding,
            user.historyEmbeddings,
            item.engagements
          );
          result.itemId = item.id;
          break;
      }

      // Handle cold start
      if (user.historyEmbeddings.length === 0) {
        const coldScore = coldStartContentScore(item.content, user.preferences);
        result.score = result.score * 0.3 + coldScore * 0.7;
        result.confidence *= 0.6; // Lower confidence for cold start
      }

      return result;
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return top K if specified
    return options.topK ? results.slice(0, options.topK) : results;
  }

  /**
   * Create A/B test
   */
  createABTest(config: ABTestConfig): void {
    this.abTestManager.createTest(config);
  }

  /**
   * Record A/B test result
   */
  recordABTestResult(
    testId: string,
    method: RankingMethod,
    predictions: string[],
    groundTruth: Set<string>
  ): void {
    const metrics = evaluateRanking(predictions, groundTruth);
    this.abTestManager.recordResult(testId, method, metrics);
  }

  /**
   * Get A/B test results
   */
  getABTestResults(testId: string): Map<RankingMethod, ABTestResult> | null {
    return this.abTestManager.getTestResults(testId);
  }

  /**
   * Set default ranking method
   */
  setDefaultMethod(method: RankingMethod): void {
    this.defaultMethod = method;
  }

  /**
   * Get configuration
   */
  getConfig(): typeof SYNTHEX_CONFIG {
    return SYNTHEX_CONFIG;
  }
}

// Export singleton instance
export const synthexEngine = new SynthexRankingEngine();

// Export configuration for reference
export { SYNTHEX_CONFIG as config };

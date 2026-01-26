/**
 * Statistical Analysis
 *
 * Statistical tests for A/B testing: t-tests, chi-square, z-tests
 *
 * @module ab-testing/StatisticalAnalysis
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ service: 'StatisticalAnalysis' });

// ============================================================================
// Types
// ============================================================================

export interface VariantMetrics {
  variantId: string;
  variantName: string;
  sampleSize: number;
  conversions: number;
  conversionRate: number;
  mean?: number;
  standardDeviation?: number;
}

export interface StatisticalTestResult {
  testType: 'z-test' | 't-test' | 'chi-square';
  pValue: number;
  confidenceLevel: number; // 0-100%
  isSignificant: boolean;
  winner?: string; // Variant ID
  summary: string;
}

export interface ABTestAnalysis {
  campaignId: string;
  variants: VariantMetrics[];
  testResult: StatisticalTestResult;
  minimumSampleSizeReached: boolean;
  recommendedAction: 'continue' | 'declare_winner' | 'inconclusive';
  details: Record<string, any>;
}

// ============================================================================
// Configuration
// ============================================================================

const config = {
  defaultConfidenceLevel: 95, // 95% confidence
  minimumSampleSize: 100, // Minimum per variant
  minimumDetectableEffect: 0.1, // 10% improvement
};

// ============================================================================
// Main API
// ============================================================================

/**
 * Analyze A/B test results and determine winner
 */
export function analyzeABTest(
  variants: VariantMetrics[],
  options: {
    confidenceLevel?: number;
    minimumSampleSize?: number;
    testType?: 'auto' | 'z-test' | 't-test' | 'chi-square';
  } = {}
): ABTestAnalysis {
  const confidenceLevel = options.confidenceLevel ?? config.defaultConfidenceLevel;
  const minimumSampleSize = options.minimumSampleSize ?? config.minimumSampleSize;

  logger.info('Analyzing A/B test', {
    variantCount: variants.length,
    confidenceLevel,
    minimumSampleSize,
  });

  // Check if minimum sample size reached
  const minSampleSize = Math.min(...variants.map((v) => v.sampleSize));
  const minimumSampleSizeReached = minSampleSize >= minimumSampleSize;

  if (!minimumSampleSizeReached) {
    logger.info('Minimum sample size not reached', {
      current: minSampleSize,
      required: minimumSampleSize,
    });

    return {
      campaignId: '',
      variants,
      testResult: {
        testType: 'z-test',
        pValue: 1.0,
        confidenceLevel: 0,
        isSignificant: false,
        summary: `Not enough data. Need ${minimumSampleSize} samples per variant (current: ${minSampleSize})`,
      },
      minimumSampleSizeReached: false,
      recommendedAction: 'continue',
      details: {
        minSampleSize,
        requiredSampleSize: minimumSampleSize,
      },
    };
  }

  // Choose appropriate test
  let testType = options.testType || 'auto';
  if (testType === 'auto') {
    testType = chooseStatisticalTest(variants);
  }

  // Run statistical test
  let testResult: StatisticalTestResult;

  switch (testType) {
    case 'z-test':
      testResult = zTestTwoProportions(variants[0], variants[1], confidenceLevel);
      break;

    case 't-test':
      testResult = tTestTwoSamples(variants[0], variants[1], confidenceLevel);
      break;

    case 'chi-square':
      testResult = chiSquareTest(variants, confidenceLevel);
      break;

    default:
      throw new Error(`Unknown test type: ${testType}`);
  }

  // Determine recommended action
  let recommendedAction: 'continue' | 'declare_winner' | 'inconclusive';

  if (testResult.isSignificant && testResult.winner) {
    recommendedAction = 'declare_winner';
  } else if (minSampleSize >= minimumSampleSize * 3) {
    // If we have 3x minimum sample size and still no significance, likely inconclusive
    recommendedAction = 'inconclusive';
  } else {
    recommendedAction = 'continue';
  }

  return {
    campaignId: '',
    variants,
    testResult,
    minimumSampleSizeReached: true,
    recommendedAction,
    details: {
      testType,
      minSampleSize,
      requiredSampleSize: minimumSampleSize,
    },
  };
}

// ============================================================================
// Statistical Tests
// ============================================================================

/**
 * Z-test for two proportions (most common for conversion rate testing)
 */
function zTestTwoProportions(
  variantA: VariantMetrics,
  variantB: VariantMetrics,
  confidenceLevel: number
): StatisticalTestResult {
  const n1 = variantA.sampleSize;
  const n2 = variantB.sampleSize;
  const p1 = variantA.conversionRate;
  const p2 = variantB.conversionRate;

  // Pooled proportion
  const pPooled = (variantA.conversions + variantB.conversions) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));

  // Z-score
  const z = (p1 - p2) / se;

  // P-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  // Critical value for confidence level
  const alpha = (100 - confidenceLevel) / 100;
  const isSignificant = pValue < alpha;

  // Determine winner
  let winner: string | undefined;
  if (isSignificant) {
    winner = p1 > p2 ? variantA.variantId : variantB.variantId;
  }

  return {
    testType: 'z-test',
    pValue,
    confidenceLevel: isSignificant ? confidenceLevel : 0,
    isSignificant,
    winner,
    summary: isSignificant
      ? `Variant ${winner} wins with ${confidenceLevel}% confidence (p=${pValue.toFixed(4)})`
      : `No significant difference (p=${pValue.toFixed(4)}, need p<${alpha})`,
  };
}

/**
 * T-test for two samples (for continuous metrics like revenue, time on site)
 */
function tTestTwoSamples(
  variantA: VariantMetrics,
  variantB: VariantMetrics,
  confidenceLevel: number
): StatisticalTestResult {
  const n1 = variantA.sampleSize;
  const n2 = variantB.sampleSize;
  const mean1 = variantA.mean || 0;
  const mean2 = variantB.mean || 0;
  const sd1 = variantA.standardDeviation || 0;
  const sd2 = variantB.standardDeviation || 0;

  // Pooled standard deviation
  const sp = Math.sqrt(((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2));

  // Standard error
  const se = sp * Math.sqrt(1 / n1 + 1 / n2);

  // T-score
  const t = (mean1 - mean2) / se;

  // Degrees of freedom
  const df = n1 + n2 - 2;

  // P-value (approximation using normal distribution for large samples)
  const pValue = 2 * (1 - normalCDF(Math.abs(t)));

  // Critical value
  const alpha = (100 - confidenceLevel) / 100;
  const isSignificant = pValue < alpha;

  // Determine winner
  let winner: string | undefined;
  if (isSignificant) {
    winner = mean1 > mean2 ? variantA.variantId : variantB.variantId;
  }

  return {
    testType: 't-test',
    pValue,
    confidenceLevel: isSignificant ? confidenceLevel : 0,
    isSignificant,
    winner,
    summary: isSignificant
      ? `Variant ${winner} wins with ${confidenceLevel}% confidence (p=${pValue.toFixed(4)})`
      : `No significant difference (p=${pValue.toFixed(4)}, need p<${alpha})`,
  };
}

/**
 * Chi-square test for multiple variants (>2)
 */
function chiSquareTest(
  variants: VariantMetrics[],
  confidenceLevel: number
): StatisticalTestResult {
  // Calculate expected frequencies
  const totalSamples = variants.reduce((sum, v) => sum + v.sampleSize, 0);
  const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0);
  const overallRate = totalConversions / totalSamples;

  // Chi-square statistic
  let chiSquare = 0;
  for (const variant of variants) {
    const expected = variant.sampleSize * overallRate;
    const observed = variant.conversions;
    chiSquare += Math.pow(observed - expected, 2) / expected;

    // Also check non-conversions
    const expectedNonConv = variant.sampleSize * (1 - overallRate);
    const observedNonConv = variant.sampleSize - variant.conversions;
    chiSquare += Math.pow(observedNonConv - expectedNonConv, 2) / expectedNonConv;
  }

  // Degrees of freedom
  const df = variants.length - 1;

  // P-value (approximation)
  const pValue = 1 - chiSquareCDF(chiSquare, df);

  // Critical value
  const alpha = (100 - confidenceLevel) / 100;
  const isSignificant = pValue < alpha;

  // Find winner (highest conversion rate)
  let winner: string | undefined;
  if (isSignificant) {
    winner = variants.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    ).variantId;
  }

  return {
    testType: 'chi-square',
    pValue,
    confidenceLevel: isSignificant ? confidenceLevel : 0,
    isSignificant,
    winner,
    summary: isSignificant
      ? `Variant ${winner} wins with ${confidenceLevel}% confidence (χ²=${chiSquare.toFixed(2)}, p=${pValue.toFixed(4)})`
      : `No significant difference (χ²=${chiSquare.toFixed(2)}, p=${pValue.toFixed(4)})`,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Choose appropriate statistical test
 */
function chooseStatisticalTest(variants: VariantMetrics[]): 'z-test' | 't-test' | 'chi-square' {
  // More than 2 variants -> chi-square
  if (variants.length > 2) {
    return 'chi-square';
  }

  // Check if we have continuous metrics (mean/stddev)
  const hasContinuousMetrics = variants.some((v) => v.mean !== undefined && v.standardDeviation !== undefined);

  if (hasContinuousMetrics) {
    // Small sample size -> t-test
    const minSampleSize = Math.min(...variants.map((v) => v.sampleSize));
    return minSampleSize < 30 ? 't-test' : 'z-test';
  }

  // Default: z-test for proportions
  return 'z-test';
}

/**
 * Normal cumulative distribution function
 */
function normalCDF(z: number): number {
  // Approximation using error function
  return (1 + erf(z / Math.sqrt(2))) / 2;
}

/**
 * Error function (approximation)
 */
function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Chi-square cumulative distribution function (approximation)
 */
function chiSquareCDF(x: number, k: number): number {
  // Approximation for large k using normal distribution
  if (k > 30) {
    const z = (Math.pow(x / k, 1 / 3) - (1 - 2 / (9 * k))) / Math.sqrt(2 / (9 * k));
    return normalCDF(z);
  }

  // For small k, use gamma function approximation
  // This is a simplified version
  return 1 - Math.exp(-x / 2) * Math.pow(x / 2, k / 2 - 1);
}

// ============================================================================
// Sample Size Calculation
// ============================================================================

/**
 * Calculate required sample size for desired power
 */
export function calculateRequiredSampleSize(options: {
  baselineRate: number;
  minimumDetectableEffect: number;
  confidenceLevel?: number;
  power?: number;
}): number {
  const { baselineRate, minimumDetectableEffect } = options;
  const confidenceLevel = options.confidenceLevel ?? 95;
  const power = options.power ?? 0.8; // 80% power

  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);

  const alpha = (100 - confidenceLevel) / 100;
  const beta = 1 - power;

  // Z-scores
  const zAlpha = normalInverse(1 - alpha / 2);
  const zBeta = normalInverse(1 - beta);

  // Sample size formula
  const pAvg = (p1 + p2) / 2;
  const n = Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2)) / Math.pow(p1 - p2, 2);

  return Math.ceil(n);
}

/**
 * Inverse normal CDF (approximation)
 */
function normalInverse(p: number): number {
  // Approximation for inverse normal
  if (p === 0.5) return 0;

  const sign = p > 0.5 ? 1 : -1;
  p = p > 0.5 ? p : 1 - p;

  const t = Math.sqrt(-2 * Math.log(1 - p));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;

  const z = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);

  return sign * z;
}

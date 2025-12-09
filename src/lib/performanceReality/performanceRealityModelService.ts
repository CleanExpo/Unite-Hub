/**
 * Performance Reality Model Service
 * Phase 81: Core model for reality-adjusted performance calculations
 */

import {
  ModelInput,
  ModelOutput,
  AttributionFactor,
  ExternalSignal,
} from './performanceRealityTypes';

/**
 * Compute reality-adjusted performance from model inputs
 */
export function computeTruePerformanceScore(input: ModelInput): ModelOutput {
  const { perceived_score, attribution_factors, external_signals, data_completeness } = input;

  // Calculate attribution adjustment
  const attributionAdjustment = calculateAttributionAdjustment(attribution_factors);

  // Calculate external signal adjustment
  const externalAdjustment = calculateExternalAdjustment(external_signals);

  // Calculate noise correction based on data completeness
  const noiseCorrection = calculateNoiseCorrection(perceived_score, data_completeness);

  // Compute true score with all adjustments
  let trueScore = perceived_score + attributionAdjustment + externalAdjustment + noiseCorrection;

  // Clamp to valid range
  trueScore = Math.max(0, Math.min(100, trueScore));

  // Calculate confidence band based on uncertainty
  const { confidenceLow, confidenceHigh } = calculateConfidenceBand(
    trueScore,
    data_completeness,
    attribution_factors,
    external_signals
  );

  // Estimate false positive/negative risks
  const { falsePositiveRisk, falseNegativeRisk } = estimateFalseSignalRisks(
    perceived_score,
    trueScore,
    data_completeness,
    attribution_factors
  );

  return {
    true_score: Math.round(trueScore * 10) / 10,
    confidence_low: Math.round(confidenceLow * 10) / 10,
    confidence_high: Math.round(confidenceHigh * 10) / 10,
    false_positive_risk: Math.round(falsePositiveRisk * 100) / 100,
    false_negative_risk: Math.round(falseNegativeRisk * 100) / 100,
    adjustment_breakdown: {
      attribution_adjustment: Math.round(attributionAdjustment * 10) / 10,
      external_adjustment: Math.round(externalAdjustment * 10) / 10,
      noise_correction: Math.round(noiseCorrection * 10) / 10,
    },
  };
}

/**
 * Calculate adjustment from attribution factors
 */
function calculateAttributionAdjustment(factors: AttributionFactor[]): number {
  if (factors.length === 0) {
return 0;
}

  let totalAdjustment = 0;

  for (const factor of factors) {
    const direction = factor.direction === 'positive' ? 1 : factor.direction === 'negative' ? -1 : 0;
    const impact = factor.weight * factor.contribution * direction * factor.confidence;
    totalAdjustment += impact;
  }

  // Scale to reasonable adjustment range (-20 to +20)
  return totalAdjustment * 20;
}

/**
 * Calculate adjustment from external signals
 */
function calculateExternalAdjustment(signals: ExternalSignal[]): number {
  if (signals.length === 0) {
return 0;
}

  let totalAdjustment = 0;

  for (const signal of signals) {
    const hint = signal.impact_hint;
    let impact = 0;

    switch (hint.expected_effect) {
      case 'higher_engagement':
        impact = (hint.magnitude || 0.1) * 10;
        break;
      case 'lower_engagement':
        impact = -(hint.magnitude || 0.1) * 10;
        break;
      case 'mixed':
        impact = 0;
        break;
      default:
        impact = 0;
    }

    totalAdjustment += impact;
  }

  // Cap external adjustment at ±15 points
  return Math.max(-15, Math.min(15, totalAdjustment));
}

/**
 * Calculate noise correction based on data completeness
 */
function calculateNoiseCorrection(perceivedScore: number, dataCompleteness: number): number {
  // Lower completeness = more potential noise
  const noiseFactor = 1 - dataCompleteness;

  // Regression toward mean (50) when data is incomplete
  const meanRegression = (50 - perceivedScore) * noiseFactor * 0.3;

  return meanRegression;
}

/**
 * Calculate confidence band around true score
 */
function calculateConfidenceBand(
  trueScore: number,
  dataCompleteness: number,
  factors: AttributionFactor[],
  signals: ExternalSignal[]
): { confidenceLow: number; confidenceHigh: number } {
  // Base band width inversely related to data completeness
  let bandWidth = 20 * (1 - dataCompleteness) + 5;

  // Widen band if factors have low confidence
  const avgFactorConfidence = factors.length > 0
    ? factors.reduce((sum, f) => sum + f.confidence, 0) / factors.length
    : 0.5;
  bandWidth += (1 - avgFactorConfidence) * 10;

  // Widen band for many external signals (more uncertainty)
  bandWidth += Math.min(signals.length * 2, 10);

  // Calculate bounds
  const confidenceLow = Math.max(0, trueScore - bandWidth / 2);
  const confidenceHigh = Math.min(100, trueScore + bandWidth / 2);

  return { confidenceLow, confidenceHigh };
}

/**
 * Estimate false positive and negative risks
 */
function estimateFalseSignalRisks(
  perceivedScore: number,
  trueScore: number,
  dataCompleteness: number,
  factors: AttributionFactor[]
): { falsePositiveRisk: number; falseNegativeRisk: number } {
  const scoreDelta = perceivedScore - trueScore;

  // False positive: perceived > true (overstated)
  let falsePositiveRisk = 0;
  if (scoreDelta > 0) {
    falsePositiveRisk = Math.min(1, (scoreDelta / 30) * (1 - dataCompleteness + 0.2));
  }

  // False negative: perceived < true (understated)
  let falseNegativeRisk = 0;
  if (scoreDelta < 0) {
    falseNegativeRisk = Math.min(1, (Math.abs(scoreDelta) / 30) * (1 - dataCompleteness + 0.2));
  }

  // Increase risk if attribution factors are low confidence
  const avgConfidence = factors.length > 0
    ? factors.reduce((sum, f) => sum + f.confidence, 0) / factors.length
    : 0.5;

  const confidenceMultiplier = 1 + (1 - avgConfidence) * 0.5;
  falsePositiveRisk = Math.min(1, falsePositiveRisk * confidenceMultiplier);
  falseNegativeRisk = Math.min(1, falseNegativeRisk * confidenceMultiplier);

  return { falsePositiveRisk, falseNegativeRisk };
}

/**
 * Generate demo perceived score for testing
 */
export function generateDemoPerceivedScore(scope: string): number {
  // Generate reasonable demo scores
  const baseScores: Record<string, number> = {
    global: 68,
    client: 72,
    cohort: 65,
    channel: 70,
    campaign: 75,
  };
  const base = baseScores[scope] || 70;
  return base + (Math.random() - 0.5) * 20;
}

/**
 * Determine primary driver from attribution factors
 */
export function getPrimaryDriver(factors: AttributionFactor[]): string {
  if (factors.length === 0) {
return 'unknown';
}

  const sorted = [...factors].sort((a, b) =>
    Math.abs(b.contribution * b.weight) - Math.abs(a.contribution * a.weight)
  );

  return sorted[0].name;
}

/**
 * Get secondary drivers from attribution factors
 */
export function getSecondaryDrivers(factors: AttributionFactor[]): string[] {
  if (factors.length < 2) {
return [];
}

  const sorted = [...factors].sort((a, b) =>
    Math.abs(b.contribution * b.weight) - Math.abs(a.contribution * a.weight)
  );

  return sorted.slice(1, 3).map(f => f.name);
}

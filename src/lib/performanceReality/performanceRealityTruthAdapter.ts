/**
 * Performance Reality Truth Adapter
 * Phase 81: Enforces truth-layer compliance - no fabricated metrics
 */

import {
  PerformanceRealitySnapshot,
  AttributionFactor,
  ExternalContext,
} from './performanceRealityTypes';

/**
 * Truth-layer compliant snapshot with uncertainty disclosures
 */
export interface TruthAdaptedSnapshot {
  // Core metrics
  perceived_score: number;
  true_score: number;
  score_difference: number;
  score_direction: 'higher' | 'lower' | 'same';

  // Confidence
  confidence_band: {
    low: number;
    high: number;
    width: number;
    reliability: 'high' | 'medium' | 'low';
  };

  // Risk indicators
  false_positive_warning: boolean;
  false_negative_warning: boolean;
  risk_summary: string;

  // Data quality
  data_completeness: number;
  completeness_label: string;
  missing_data_types: string[];

  // Attribution
  primary_driver: string;
  secondary_drivers: string[];
  low_confidence_factors: string[];

  // External context
  external_impact: string;
  active_signals: number;

  // Disclaimers
  disclaimers: string[];
}

/**
 * Adapt a snapshot for truth-compliant display
 */
export function adaptSnapshotForTruth(
  snapshot: PerformanceRealitySnapshot
): TruthAdaptedSnapshot {
  const scoreDiff = snapshot.true_score - snapshot.perceived_score;
  const bandWidth = snapshot.confidence_high - snapshot.confidence_low;

  // Determine reliability based on band width and completeness
  let reliability: 'high' | 'medium' | 'low' = 'medium';
  if (bandWidth < 15 && snapshot.data_completeness > 0.7) {
    reliability = 'high';
  } else if (bandWidth > 30 || snapshot.data_completeness < 0.4) {
    reliability = 'low';
  }

  // Identify low confidence factors
  const lowConfidenceFactors = snapshot.attribution_breakdown.factors
    .filter(f => f.confidence < 0.5)
    .map(f => f.name);

  // Build missing data types
  const missingDataTypes: string[] = [];
  if (snapshot.data_completeness < 0.6) {
    missingDataTypes.push('Historical archive events');
  }
  if (snapshot.data_completeness < 0.7) {
    missingDataTypes.push('Complete campaign metrics');
  }
  if (snapshot.data_completeness < 0.8) {
    missingDataTypes.push('External market signals');
  }

  // Build disclaimers
  const disclaimers = buildDisclaimers(snapshot, reliability, lowConfidenceFactors);

  // Get secondary drivers
  const sortedFactors = [...snapshot.attribution_breakdown.factors].sort(
    (a, b) => Math.abs(b.contribution * b.weight) - Math.abs(a.contribution * a.weight)
  );
  const secondaryDrivers = sortedFactors.slice(1, 3).map(f => f.name);

  // Build risk summary
  const riskSummary = buildRiskSummary(
    snapshot.false_positive_risk,
    snapshot.false_negative_risk
  );

  return {
    perceived_score: snapshot.perceived_score,
    true_score: snapshot.true_score,
    score_difference: Math.round(scoreDiff * 10) / 10,
    score_direction: scoreDiff > 0.5 ? 'higher' : scoreDiff < -0.5 ? 'lower' : 'same',

    confidence_band: {
      low: snapshot.confidence_low,
      high: snapshot.confidence_high,
      width: Math.round(bandWidth * 10) / 10,
      reliability,
    },

    false_positive_warning: snapshot.false_positive_risk > 0.3,
    false_negative_warning: snapshot.false_negative_risk > 0.3,
    risk_summary: riskSummary,

    data_completeness: snapshot.data_completeness,
    completeness_label: getCompletenessLabel(snapshot.data_completeness),
    missing_data_types: missingDataTypes,

    primary_driver: snapshot.attribution_breakdown.primary_driver,
    secondary_drivers: secondaryDrivers,
    low_confidence_factors: lowConfidenceFactors,

    external_impact: getExternalImpactLabel(snapshot.external_context),
    active_signals: snapshot.external_context.total_signals,

    disclaimers,
  };
}

/**
 * Build appropriate disclaimers based on data quality
 */
function buildDisclaimers(
  snapshot: PerformanceRealitySnapshot,
  reliability: 'high' | 'medium' | 'low',
  lowConfidenceFactors: string[]
): string[] {
  const disclaimers: string[] = [];

  // Reliability disclaimer
  if (reliability === 'low') {
    disclaimers.push(
      'Low reliability: Wide confidence band indicates significant uncertainty in this estimate.'
    );
  } else if (reliability === 'medium') {
    disclaimers.push(
      'Moderate reliability: Some uncertainty exists in this estimate.'
    );
  }

  // Data completeness disclaimer
  if (snapshot.data_completeness < 0.5) {
    disclaimers.push(
      `Limited data: Only ${Math.round(snapshot.data_completeness * 100)}% of expected data sources are available.`
    );
  } else if (snapshot.data_completeness < 0.7) {
    disclaimers.push(
      `Partial data: ${Math.round(snapshot.data_completeness * 100)}% data completeness may affect accuracy.`
    );
  }

  // Low confidence factors disclaimer
  if (lowConfidenceFactors.length > 0) {
    disclaimers.push(
      `Low confidence in: ${lowConfidenceFactors.join(', ')}. These factors have limited supporting data.`
    );
  }

  // False positive/negative warning
  if (snapshot.false_positive_risk > 0.4) {
    disclaimers.push(
      `High false positive risk (${Math.round(snapshot.false_positive_risk * 100)}%): Perceived performance may be overstated.`
    );
  }
  if (snapshot.false_negative_risk > 0.4) {
    disclaimers.push(
      `High false negative risk (${Math.round(snapshot.false_negative_risk * 100)}%): Perceived performance may be understated.`
    );
  }

  // External context disclaimer
  if (snapshot.external_context.total_signals > 0) {
    disclaimers.push(
      `${snapshot.external_context.total_signals} external factor(s) may be influencing performance.`
    );
  }

  // Model version disclaimer
  disclaimers.push(
    `Model version: ${snapshot.model_version}. Estimates improve as more data becomes available.`
  );

  return disclaimers;
}

/**
 * Get human-readable completeness label
 */
function getCompletenessLabel(completeness: number): string {
  if (completeness >= 0.85) return 'Excellent';
  if (completeness >= 0.7) return 'Good';
  if (completeness >= 0.5) return 'Moderate';
  if (completeness >= 0.3) return 'Limited';
  return 'Minimal';
}

/**
 * Get external impact label
 */
function getExternalImpactLabel(context: ExternalContext): string {
  if (context.total_signals === 0) {
    return 'No significant external factors detected';
  }

  switch (context.overall_impact) {
    case 'positive':
      return `${context.total_signals} external factor(s) boosting performance`;
    case 'negative':
      return `${context.total_signals} external factor(s) reducing performance`;
    case 'mixed':
      return `${context.total_signals} external factor(s) with mixed effects`;
    default:
      return `${context.total_signals} external factor(s) present`;
  }
}

/**
 * Build risk summary text
 */
function buildRiskSummary(falsePositiveRisk: number, falseNegativeRisk: number): string {
  if (falsePositiveRisk > 0.4 && falseNegativeRisk > 0.4) {
    return 'High uncertainty in both directions';
  }
  if (falsePositiveRisk > 0.4) {
    return 'Results may be overstated';
  }
  if (falseNegativeRisk > 0.4) {
    return 'Results may be understated';
  }
  if (falsePositiveRisk > 0.2 || falseNegativeRisk > 0.2) {
    return 'Some uncertainty present';
  }
  return 'Low risk of false signals';
}

/**
 * Check if a snapshot meets minimum truth standards
 */
export function meetsMinimumTruthStandards(snapshot: PerformanceRealitySnapshot): {
  meets: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check data completeness
  if (snapshot.data_completeness < 0.2) {
    issues.push('Insufficient data for reliable estimate (< 20% complete)');
  }

  // Check confidence band
  const bandWidth = snapshot.confidence_high - snapshot.confidence_low;
  if (bandWidth > 50) {
    issues.push('Confidence band too wide (> 50 points)');
  }

  // Check for all-zero attribution
  const hasAttribution = snapshot.attribution_breakdown.factors.some(
    f => Math.abs(f.contribution) > 0.01
  );
  if (!hasAttribution) {
    issues.push('No meaningful attribution factors computed');
  }

  // Check for implausible scores
  if (snapshot.true_score < 0 || snapshot.true_score > 100) {
    issues.push('True score outside valid range');
  }

  return {
    meets: issues.length === 0,
    issues,
  };
}

/**
 * Generate truth summary for display
 */
export function generateTruthSummary(snapshot: PerformanceRealitySnapshot): string {
  const adapted = adaptSnapshotForTruth(snapshot);

  const parts: string[] = [];

  // Score summary
  if (adapted.score_direction === 'same') {
    parts.push(`True performance (${adapted.true_score}) aligns with perceived (${adapted.perceived_score}).`);
  } else {
    const direction = adapted.score_direction === 'higher' ? 'higher' : 'lower';
    parts.push(
      `True performance (${adapted.true_score}) is ${Math.abs(adapted.score_difference)} points ${direction} than perceived (${adapted.perceived_score}).`
    );
  }

  // Primary driver
  parts.push(`Primary driver: ${adapted.primary_driver.replace(/_/g, ' ')}.`);

  // Confidence
  parts.push(
    `Confidence: ${adapted.confidence_band.low}-${adapted.confidence_band.high} (${adapted.confidence_band.reliability} reliability).`
  );

  // Data quality
  parts.push(`Data completeness: ${adapted.completeness_label} (${Math.round(adapted.data_completeness * 100)}%).`);

  return parts.join(' ');
}

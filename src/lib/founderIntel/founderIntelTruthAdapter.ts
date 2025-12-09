/**
 * Founder Intel Truth Adapter
 * Phase 80: Apply Truth Layer constraints to founder intelligence
 */

import {
  IntelSignal,
  AggregatedSignals,
} from './founderIntelTypes';

/**
 * Truth layer validation result
 */
export interface TruthValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  adjustedSignals: IntelSignal[];
}

/**
 * Banned marketing patterns that should not appear in founder intelligence
 */
const BANNED_PATTERNS = [
  /guaranteed results/i,
  /10x growth/i,
  /instant success/i,
  /risk-free/i,
  /proven to work/i,
  /always works/i,
  /never fails/i,
  /100% effective/i,
  /will definitely/i,
];

/**
 * Validate signals against truth layer rules
 */
export function validateSignalsAgainstTruthLayer(
  signals: IntelSignal[]
): TruthValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const adjustedSignals: IntelSignal[] = [];

  for (const signal of signals) {
    // Check for low confidence signals
    if (signal.confidence < 0.3) {
      warnings.push(
        `Signal "${signal.key}" from ${signal.engine} has very low confidence (${signal.confidence.toFixed(2)}). Consider excluding.`
      );
    }

    // Check for missing context
    if (!signal.context && signal.type === 'alert') {
      warnings.push(
        `Alert signal "${signal.key}" lacks context. Add explanatory details.`
      );
    }

    // Check for banned patterns in labels
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(signal.label)) {
        errors.push(
          `Signal "${signal.key}" contains banned marketing language: "${signal.label}"`
        );
      }
    }

    // Adjust signal based on rules
    const adjusted = { ...signal };

    // Cap confidence at 1.0
    if (adjusted.confidence > 1) {
      adjusted.confidence = 1;
    }

    // Add warning annotation if low confidence
    if (adjusted.confidence < 0.5 && !adjusted.context?.includes('[LOW CONFIDENCE]')) {
      adjusted.context = `[LOW CONFIDENCE] ${adjusted.context || ''}`;
    }

    adjustedSignals.push(adjusted);
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    adjustedSignals,
  };
}

/**
 * Compute confidence score from signals and metadata
 */
export function computeConfidenceScore(
  signals: AggregatedSignals,
  completenessMetadata: {
    has_archive_data: boolean;
    has_performance_data: boolean;
    has_client_data: boolean;
    data_age_days: number;
  }
): number {
  let score = 0;
  let factors = 0;

  // Average signal confidence
  if (signals.signals.length > 0) {
    const avgConfidence =
      signals.signals.reduce((sum, s) => sum + s.confidence, 0) / signals.signals.length;
    score += avgConfidence;
    factors++;
  }

  // Data completeness factors
  if (completenessMetadata.has_archive_data) {
    score += 0.9;
    factors++;
  } else {
    score += 0.3;
    factors++;
  }

  if (completenessMetadata.has_performance_data) {
    score += 0.9;
    factors++;
  } else {
    score += 0.4;
    factors++;
  }

  if (completenessMetadata.has_client_data) {
    score += 0.95;
    factors++;
  } else {
    score += 0.5;
    factors++;
  }

  // Recency penalty
  if (completenessMetadata.data_age_days > 30) {
    score += 0.5;
  } else if (completenessMetadata.data_age_days > 7) {
    score += 0.8;
  } else {
    score += 1.0;
  }
  factors++;

  return factors > 0 ? score / factors : 0;
}

/**
 * Compute data completeness score
 */
export function computeCompletenessScore(
  signals: AggregatedSignals
): number {
  let completeness = 0;
  const totalFactors = 6;

  // Check health metrics presence
  if (signals.agency_health.score > 0) {
completeness++;
}
  if (signals.client_health.score > 0) {
completeness++;
}
  if (signals.creative_health.score > 0) {
completeness++;
}
  if (signals.scaling_risk.score > 0) {
completeness++;
}
  if (signals.orm_reality.score > 0) {
completeness++;
}
  if (signals.archive_completeness.score > 0) {
completeness++;
}

  return completeness / totalFactors;
}

/**
 * Annotate summary with truth disclaimers
 */
export function annotateSummaryWithTruthDisclaimers(
  summaryMarkdown: string,
  metadata: {
    confidence_score: number;
    completeness_score: number;
    missing_data: string[];
    data_age_days: number;
  }
): string {
  let annotatedSummary = summaryMarkdown;

  // Add completeness notice if below threshold
  if (metadata.completeness_score < 0.8) {
    const missingList = metadata.missing_data.length > 0
      ? `\n\n**Missing Data Sources:**\n${metadata.missing_data.map(d => `- ${d}`).join('\n')}`
      : '';

    annotatedSummary += `\n\n---\n\n**Data Completeness Notice:** This intelligence is based on ${(metadata.completeness_score * 100).toFixed(0)}% of available data sources.${missingList}`;
  }

  // Add confidence notice if below threshold
  if (metadata.confidence_score < 0.7) {
    annotatedSummary += `\n\n**Confidence Notice:** The overall confidence in this analysis is ${(metadata.confidence_score * 100).toFixed(0)}%. Some conclusions may change as more data becomes available.`;
  }

  // Add staleness warning
  if (metadata.data_age_days > 7) {
    annotatedSummary += `\n\n**Note:** Some data included is ${metadata.data_age_days} days old. Recent changes may not be reflected.`;
  }

  return annotatedSummary;
}

/**
 * Check if summary contains banned marketing language
 */
export function containsBannedPatterns(text: string): string[] {
  const found: string[] = [];

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) {
        found.push(match[0]);
      }
    }
  }

  return found;
}

/**
 * Generate truth layer badge info
 */
export function getTruthBadgeInfo(
  confidenceScore: number,
  completenessScore: number
): {
  level: 'high' | 'medium' | 'low';
  label: string;
  color: string;
  tooltip: string;
} {
  const combined = (confidenceScore + completenessScore) / 2;

  if (combined >= 0.8) {
    return {
      level: 'high',
      label: 'High Confidence',
      color: 'text-green-500',
      tooltip: `Based on ${(completenessScore * 100).toFixed(0)}% complete data with ${(confidenceScore * 100).toFixed(0)}% confidence`,
    };
  }

  if (combined >= 0.6) {
    return {
      level: 'medium',
      label: 'Moderate Confidence',
      color: 'text-yellow-500',
      tooltip: `Based on ${(completenessScore * 100).toFixed(0)}% complete data with ${(confidenceScore * 100).toFixed(0)}% confidence. Some data gaps may affect accuracy.`,
    };
  }

  return {
    level: 'low',
    label: 'Low Confidence',
    color: 'text-orange-500',
    tooltip: `Based on ${(completenessScore * 100).toFixed(0)}% complete data with ${(confidenceScore * 100).toFixed(0)}% confidence. Significant data gaps present.`,
  };
}

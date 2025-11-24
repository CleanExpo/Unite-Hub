/**
 * Opportunity Scoring Service
 * Phase 95: Convert signals into weighted opportunity scores
 */

import type {
  CollectedSignal,
  OpportunityScore,
  OpportunityCategory,
} from './predictiveTypes';

/**
 * Category weights for different signal types
 */
const CATEGORY_SIGNAL_WEIGHTS: Record<OpportunityCategory, Record<string, number>> = {
  creative: {
    mesh_creative: 1.5,
    performance_engagement: 1.2,
    compliance_risk: 0.8,
  },
  posting: {
    mesh_signal: 1.0,
    scaling_pressure: 1.3,
    budget_headroom: 1.2,
    performance_engagement: 1.0,
  },
  campaign: {
    performance_growth: 1.5,
    client_score: 1.3,
    contact_recency: 1.2,
    mesh_composite: 1.0,
  },
  brand: {
    compliance_risk: 1.5,
    mesh_early_warning: 1.3,
    performance_engagement: 1.0,
  },
  engagement: {
    performance_engagement: 1.5,
    client_score: 1.3,
    contact_recency: 1.2,
    mesh_signal: 1.0,
  },
  audience: {
    performance_growth: 1.5,
    mesh_composite: 1.2,
    client_score: 1.0,
  },
  timing: {
    scaling_mode_score: 1.5,
    budget_headroom: 1.3,
    scaling_pressure: 1.2,
  },
};

/**
 * Compute opportunity scores from signals
 */
export function computeScores(signals: CollectedSignal[]): OpportunityScore[] {
  const categories: OpportunityCategory[] = [
    'creative', 'posting', 'campaign', 'brand', 'engagement', 'audience', 'timing'
  ];

  const scores: OpportunityScore[] = [];

  for (const category of categories) {
    const categoryWeights = CATEGORY_SIGNAL_WEIGHTS[category];
    let totalScore = 0;
    let totalWeight = 0;
    const relevantSignals: CollectedSignal[] = [];

    for (const signal of signals) {
      // Find matching weight for this signal type
      let signalWeight = 0.5; // Default weight
      for (const [pattern, weight] of Object.entries(categoryWeights)) {
        if (signal.type.includes(pattern)) {
          signalWeight = weight;
          break;
        }
      }

      const effectiveWeight = signalWeight * (signal.weight || 1.0);
      totalScore += signal.value * effectiveWeight;
      totalWeight += effectiveWeight;

      if (signalWeight > 0.7) {
        relevantSignals.push(signal);
      }
    }

    const rawScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Only include categories with meaningful signals
    if (relevantSignals.length > 0 && rawScore > 0.2) {
      scores.push({
        category,
        rawScore,
        confidence: 0, // Will be computed separately
        signals: relevantSignals,
      });
    }
  }

  return scores;
}

/**
 * Normalize confidence based on data completeness
 */
export function normalizeConfidence(rawScore: number, dataCompleteness: number): number {
  // Apply data completeness penalty
  const completenessMultiplier = 0.5 + (dataCompleteness * 0.5);

  // Cap confidence at 0.95 to maintain uncertainty
  const confidence = Math.min(0.95, rawScore * completenessMultiplier);

  // Floor at 0.1 if there's any signal
  return Math.max(0.1, confidence);
}

/**
 * Compute uncertainty notes based on signals and data quality
 */
export function computeUncertaintyNotes(
  signals: CollectedSignal[],
  dataCompleteness: number,
  category: OpportunityCategory
): string {
  const notes: string[] = [];

  // Data completeness warning
  if (dataCompleteness < 0.5) {
    notes.push('Limited data available - prediction has higher uncertainty.');
  } else if (dataCompleteness < 0.8) {
    notes.push('Some data sources unavailable - confidence may be overstated.');
  }

  // Signal count warning
  if (signals.length < 3) {
    notes.push('Few supporting signals - treat this opportunity as exploratory.');
  }

  // Category-specific warnings
  switch (category) {
    case 'creative':
      notes.push('Creative performance varies by audience segment and timing.');
      break;
    case 'campaign':
      notes.push('Campaign outcomes depend on factors beyond historical patterns.');
      break;
    case 'timing':
      notes.push('Optimal timing windows are estimates based on past patterns.');
      break;
    case 'audience':
      notes.push('Audience behavior may differ from predicted patterns.');
      break;
  }

  // General truth layer disclaimer
  notes.push('This is a probabilistic estimate, not a guarantee of outcomes.');

  return notes.join(' ');
}

/**
 * Get signal diversity score
 */
export function getSignalDiversity(signals: CollectedSignal[]): number {
  const uniqueTypes = new Set(signals.map(s => s.type.split('_')[0]));
  const maxDiversity = 5; // Expected maximum unique signal sources
  return Math.min(1, uniqueTypes.size / maxDiversity);
}

/**
 * Filter signals by minimum quality
 */
export function filterQualitySignals(
  signals: CollectedSignal[],
  minWeight: number = 0.5
): CollectedSignal[] {
  return signals.filter(s => (s.weight || 1.0) >= minWeight);
}

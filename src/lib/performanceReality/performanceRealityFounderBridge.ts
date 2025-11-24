/**
 * Performance Reality Founder Bridge
 * Phase 81: Integrates Performance Reality with Founder Intelligence Console
 */

import {
  PerformanceRealitySnapshot,
  RealityScope,
} from './performanceRealityTypes';
import {
  TruthAdaptedSnapshot,
  adaptSnapshotForTruth,
  generateTruthSummary,
} from './performanceRealityTruthAdapter';
import {
  getLatestSnapshot,
  generateDemoSnapshot,
} from './performanceRealitySnapshotService';

/**
 * Reality Strip data for Founder Intel display
 */
export interface RealityStripData {
  // Primary display
  perceived_score: number;
  true_score: number;
  score_delta: number;
  delta_direction: 'up' | 'down' | 'same';

  // Visual indicators
  confidence_low: number;
  confidence_high: number;
  reliability_color: 'green' | 'yellow' | 'red';

  // Attribution summary
  primary_driver: string;
  primary_driver_direction: 'positive' | 'negative' | 'neutral';

  // Warnings
  has_warning: boolean;
  warning_text: string | null;

  // Meta
  last_updated: string;
  scope: RealityScope;
  data_quality: string;
}

/**
 * Get Reality Strip data for Founder Intel dashboard
 */
export async function getRealityStripData(
  scope: RealityScope = 'global',
  clientId?: string
): Promise<RealityStripData> {
  // Try to get latest snapshot
  let snapshot = await getLatestSnapshot(scope, clientId);

  // Fall back to demo if no snapshot exists
  if (!snapshot) {
    snapshot = await generateDemoSnapshot(scope);
  }

  const adapted = adaptSnapshotForTruth(snapshot);

  // Determine reliability color
  let reliabilityColor: 'green' | 'yellow' | 'red' = 'yellow';
  if (adapted.confidence_band.reliability === 'high') {
    reliabilityColor = 'green';
  } else if (adapted.confidence_band.reliability === 'low') {
    reliabilityColor = 'red';
  }

  // Find primary driver direction
  const primaryFactor = snapshot.attribution_breakdown.factors.find(
    f => f.name === adapted.primary_driver
  );
  const primaryDirection = primaryFactor?.direction || 'neutral';

  // Build warning text
  let warningText: string | null = null;
  if (adapted.false_positive_warning) {
    warningText = `${Math.round(snapshot.false_positive_risk * 100)}% chance perceived score is overstated`;
  } else if (adapted.false_negative_warning) {
    warningText = `${Math.round(snapshot.false_negative_risk * 100)}% chance perceived score is understated`;
  }

  return {
    perceived_score: Math.round(snapshot.perceived_score),
    true_score: Math.round(snapshot.true_score),
    score_delta: Math.round((snapshot.true_score - snapshot.perceived_score) * 10) / 10,
    delta_direction:
      snapshot.true_score > snapshot.perceived_score + 0.5
        ? 'up'
        : snapshot.true_score < snapshot.perceived_score - 0.5
        ? 'down'
        : 'same',

    confidence_low: Math.round(snapshot.confidence_low),
    confidence_high: Math.round(snapshot.confidence_high),
    reliability_color: reliabilityColor,

    primary_driver: adapted.primary_driver.replace(/_/g, ' '),
    primary_driver_direction: primaryDirection,

    has_warning: adapted.false_positive_warning || adapted.false_negative_warning,
    warning_text: warningText,

    last_updated: snapshot.created_at,
    scope: snapshot.scope,
    data_quality: adapted.completeness_label,
  };
}

/**
 * Founder Intel alert from Performance Reality
 */
export interface RealityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alert_type: 'risk' | 'opportunity' | 'anomaly' | 'info';
  source_engine: 'performance';
  metadata: Record<string, unknown>;
}

/**
 * Generate alerts from Performance Reality for Founder Intel
 */
export async function generateRealityAlerts(
  scope: RealityScope = 'global',
  clientId?: string
): Promise<RealityAlert[]> {
  const snapshot = await getLatestSnapshot(scope, clientId);

  if (!snapshot) {
    return [];
  }

  const alerts: RealityAlert[] = [];
  const adapted = adaptSnapshotForTruth(snapshot);

  // High false positive alert
  if (snapshot.false_positive_risk > 0.4) {
    alerts.push({
      id: `reality-fp-${snapshot.id}`,
      title: 'Performance may be overstated',
      description: `${Math.round(snapshot.false_positive_risk * 100)}% risk that perceived score (${Math.round(snapshot.perceived_score)}) is higher than reality (${Math.round(snapshot.true_score)}).`,
      severity: snapshot.false_positive_risk > 0.6 ? 'high' : 'medium',
      alert_type: 'risk',
      source_engine: 'performance',
      metadata: {
        perceived_score: snapshot.perceived_score,
        true_score: snapshot.true_score,
        risk_level: snapshot.false_positive_risk,
      },
    });
  }

  // High false negative alert
  if (snapshot.false_negative_risk > 0.4) {
    alerts.push({
      id: `reality-fn-${snapshot.id}`,
      title: 'Performance may be understated',
      description: `${Math.round(snapshot.false_negative_risk * 100)}% risk that perceived score (${Math.round(snapshot.perceived_score)}) is lower than reality (${Math.round(snapshot.true_score)}).`,
      severity: snapshot.false_negative_risk > 0.6 ? 'high' : 'medium',
      alert_type: 'opportunity',
      source_engine: 'performance',
      metadata: {
        perceived_score: snapshot.perceived_score,
        true_score: snapshot.true_score,
        risk_level: snapshot.false_negative_risk,
      },
    });
  }

  // Low data completeness alert
  if (snapshot.data_completeness < 0.4) {
    alerts.push({
      id: `reality-data-${snapshot.id}`,
      title: 'Insufficient data for reliable analysis',
      description: `Only ${Math.round(snapshot.data_completeness * 100)}% data completeness. Confidence band is wide (${Math.round(snapshot.confidence_low)}-${Math.round(snapshot.confidence_high)}).`,
      severity: 'medium',
      alert_type: 'info',
      source_engine: 'performance',
      metadata: {
        completeness: snapshot.data_completeness,
        missing_types: adapted.missing_data_types,
      },
    });
  }

  // Significant external impact
  if (snapshot.external_context.total_signals > 2) {
    alerts.push({
      id: `reality-external-${snapshot.id}`,
      title: 'Multiple external factors affecting performance',
      description: `${snapshot.external_context.total_signals} external signals detected with ${snapshot.external_context.overall_impact} overall impact.`,
      severity: 'low',
      alert_type: 'info',
      source_engine: 'performance',
      metadata: {
        signals: snapshot.external_context.signals,
        impact: snapshot.external_context.overall_impact,
      },
    });
  }

  // Large score discrepancy
  const scoreDelta = Math.abs(snapshot.true_score - snapshot.perceived_score);
  if (scoreDelta > 15) {
    alerts.push({
      id: `reality-discrepancy-${snapshot.id}`,
      title: 'Significant discrepancy between perceived and true performance',
      description: `${Math.round(scoreDelta)} point difference. Primary driver: ${adapted.primary_driver.replace(/_/g, ' ')}.`,
      severity: scoreDelta > 25 ? 'high' : 'medium',
      alert_type: scoreDelta > 0 ? 'anomaly' : 'risk',
      source_engine: 'performance',
      metadata: {
        perceived: snapshot.perceived_score,
        true: snapshot.true_score,
        delta: scoreDelta,
        driver: adapted.primary_driver,
      },
    });
  }

  return alerts;
}

/**
 * Get signal for Founder Intel aggregation
 */
export interface RealitySignal {
  key: string;
  value: number;
  label: string;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

/**
 * Get reality signals for Founder Intel aggregation
 */
export async function getRealitySignals(
  scope: RealityScope = 'global',
  clientId?: string
): Promise<RealitySignal[]> {
  const snapshot = await getLatestSnapshot(scope, clientId);

  if (!snapshot) {
    return [];
  }

  const adapted = adaptSnapshotForTruth(snapshot);
  const signals: RealitySignal[] = [];

  // True performance signal
  signals.push({
    key: 'true_performance',
    value: snapshot.true_score,
    label: 'True Performance',
    trend: snapshot.true_score > snapshot.perceived_score ? 'up' : 'down',
    confidence: 1 - (snapshot.confidence_high - snapshot.confidence_low) / 100,
  });

  // Data quality signal
  signals.push({
    key: 'data_quality',
    value: snapshot.data_completeness * 100,
    label: 'Data Quality',
    trend: 'stable',
    confidence: 0.9,
  });

  // Reality accuracy signal
  const accuracy = 1 - Math.max(snapshot.false_positive_risk, snapshot.false_negative_risk);
  signals.push({
    key: 'reality_accuracy',
    value: accuracy * 100,
    label: 'Reality Accuracy',
    trend: accuracy > 0.7 ? 'up' : 'down',
    confidence: 0.8,
  });

  return signals;
}

/**
 * Get weekly briefing content for Performance Reality
 */
export async function getRealityBriefingContent(
  scope: RealityScope = 'global'
): Promise<string> {
  const snapshot = await getLatestSnapshot(scope);

  if (!snapshot) {
    return 'No performance reality data available for this period.';
  }

  const summary = generateTruthSummary(snapshot);
  const adapted = adaptSnapshotForTruth(snapshot);

  let briefing = `## Performance Reality\n\n${summary}\n\n`;

  // Add key insights
  briefing += '### Key Insights\n\n';

  if (adapted.score_direction !== 'same') {
    const direction = adapted.score_direction === 'higher' ? 'higher' : 'lower';
    briefing += `- True performance is **${Math.abs(adapted.score_difference)} points ${direction}** than perceived metrics suggest\n`;
  }

  briefing += `- Primary performance driver: **${adapted.primary_driver.replace(/_/g, ' ')}**\n`;

  if (adapted.secondary_drivers.length > 0) {
    briefing += `- Secondary factors: ${adapted.secondary_drivers.map(d => d.replace(/_/g, ' ')).join(', ')}\n`;
  }

  // Add warnings
  if (adapted.has_warning) {
    briefing += '\n### Warnings\n\n';
    if (adapted.false_positive_warning) {
      briefing += `- ⚠️ **False Positive Risk**: ${Math.round(snapshot.false_positive_risk * 100)}% chance metrics are overstated\n`;
    }
    if (adapted.false_negative_warning) {
      briefing += `- ⚠️ **False Negative Risk**: ${Math.round(snapshot.false_negative_risk * 100)}% chance metrics are understated\n`;
    }
  }

  // Add data quality note
  briefing += `\n### Data Quality\n\n`;
  briefing += `- Completeness: ${adapted.completeness_label} (${Math.round(adapted.data_completeness * 100)}%)\n`;
  briefing += `- Confidence band: ${adapted.confidence_band.low} - ${adapted.confidence_band.high}\n`;
  briefing += `- Reliability: ${adapted.confidence_band.reliability}\n`;

  return briefing;
}

/**
 * Creative Signals Hub
 * Phase 71: Aggregate signals from all creative engines into unified dimensions
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  getMethodPerformanceRecords,
  getChannelPerformanceSnapshots,
  getCampaignPerformanceSummary,
} from '@/lib/visual/reactive/creativePerformanceSignals';
import { getCreativeHealthScore } from '@/lib/visual/reactive/reactiveCreativeEngine';

export interface CreativeSignal {
  signal_id: string;
  source: SignalSource;
  dimension: SignalDimension;
  value: number; // 0-100
  trend: 'rising' | 'falling' | 'stable' | 'volatile';
  timestamp: string;
  metadata: Record<string, unknown>;
}

export type SignalSource =
  | 'vif'
  | 'reactive'
  | 'performance'
  | 'engagement'
  | 'funnel'
  | 'seo'
  | 'production'
  | 'brand';

export type SignalDimension =
  | 'momentum'
  | 'stagnation'
  | 'resonance'
  | 'fatigue'
  | 'unexplored_opportunity'
  | 'channel_tension';

export interface SignalsSnapshot {
  workspace_id: string;
  timestamp: string;
  signals: CreativeSignal[];
  dimensions: DimensionSummary[];
  overall_health: number;
  alerts: SignalAlert[];
}

export interface DimensionSummary {
  dimension: SignalDimension;
  value: number;
  contributing_signals: string[];
  trend: 'rising' | 'falling' | 'stable';
  interpretation: string;
}

export interface SignalAlert {
  alert_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dimension: SignalDimension;
  message: string;
  recommended_action: string;
}

export interface SignalDelta {
  signal_id: string;
  previous_value: number;
  current_value: number;
  delta: number;
  delta_percent: number;
  timestamp: string;
}

/**
 * Collect all signals from various engines
 */
export async function collectCreativeSignals(
  workspaceId: string
): Promise<SignalsSnapshot> {
  const timestamp = new Date().toISOString();
  const signals: CreativeSignal[] = [];

  // Collect from reactive engine
  const health = await getCreativeHealthScore(workspaceId);
  const methodRecords = await getMethodPerformanceRecords(workspaceId);
  const channelSnapshots = await getChannelPerformanceSnapshots(workspaceId);

  // Momentum signal from engagement trends
  const improvingChannels = channelSnapshots.filter(s => s.trend === 'improving');
  const momentumValue = channelSnapshots.length > 0
    ? (improvingChannels.length / channelSnapshots.length) * 100
    : 50;

  signals.push({
    signal_id: `sig_momentum_${Date.now()}`,
    source: 'reactive',
    dimension: 'momentum',
    value: momentumValue,
    trend: momentumValue > 60 ? 'rising' : momentumValue < 40 ? 'falling' : 'stable',
    timestamp,
    metadata: { improving_channels: improvingChannels.length, total_channels: channelSnapshots.length },
  });

  // Stagnation signal from method diversity
  const recentMethods = methodRecords.filter(r => {
    if (!r.last_used) return false;
    const days = (Date.now() - new Date(r.last_used).getTime()) / (1000 * 60 * 60 * 24);
    return days < 30;
  });
  const stagnationValue = methodRecords.length > 0
    ? Math.max(0, 100 - (recentMethods.length / methodRecords.length) * 100)
    : 50;

  signals.push({
    signal_id: `sig_stagnation_${Date.now()}`,
    source: 'vif',
    dimension: 'stagnation',
    value: stagnationValue,
    trend: stagnationValue > 60 ? 'rising' : stagnationValue < 40 ? 'falling' : 'stable',
    timestamp,
    metadata: { recent_methods: recentMethods.length, total_methods: methodRecords.length },
  });

  // Resonance signal from engagement rates
  const avgEngagement = methodRecords.reduce(
    (sum, r) => sum + (r.avg_engagement_rate || 0),
    0
  ) / Math.max(methodRecords.length, 1);
  const resonanceValue = Math.min(100, avgEngagement * 2000); // Scale to 0-100

  signals.push({
    signal_id: `sig_resonance_${Date.now()}`,
    source: 'performance',
    dimension: 'resonance',
    value: resonanceValue,
    trend: avgEngagement > 0.03 ? 'rising' : avgEngagement < 0.01 ? 'falling' : 'stable',
    timestamp,
    metadata: { avg_engagement: avgEngagement },
  });

  // Fatigue signal from declining channels
  const decliningChannels = channelSnapshots.filter(s => s.trend === 'declining');
  const fatigueValue = channelSnapshots.length > 0
    ? (decliningChannels.length / channelSnapshots.length) * 100
    : 0;

  signals.push({
    signal_id: `sig_fatigue_${Date.now()}`,
    source: 'engagement',
    dimension: 'fatigue',
    value: fatigueValue,
    trend: fatigueValue > 40 ? 'rising' : fatigueValue < 20 ? 'falling' : 'stable',
    timestamp,
    metadata: { declining_channels: decliningChannels.length },
  });

  // Unexplored opportunity from unused methods
  const unusedMethods = methodRecords.filter(r => r.usage_count === 0);
  const opportunityValue = methodRecords.length > 0
    ? (unusedMethods.length / methodRecords.length) * 100
    : 50;

  signals.push({
    signal_id: `sig_opportunity_${Date.now()}`,
    source: 'vif',
    dimension: 'unexplored_opportunity',
    value: opportunityValue,
    trend: 'stable',
    timestamp,
    metadata: { unused_methods: unusedMethods.length },
  });

  // Channel tension from performance variance
  const channelEngagements = channelSnapshots
    .map(s => s.engagement_rate || 0)
    .filter(e => e > 0);
  const variance = calculateVariance(channelEngagements);
  const tensionValue = Math.min(100, variance * 10000);

  signals.push({
    signal_id: `sig_tension_${Date.now()}`,
    source: 'performance',
    dimension: 'channel_tension',
    value: tensionValue,
    trend: tensionValue > 50 ? 'rising' : 'stable',
    timestamp,
    metadata: { variance, channel_count: channelEngagements.length },
  });

  // Aggregate dimensions
  const dimensions = aggregateDimensions(signals);

  // Generate alerts
  const alerts = generateAlerts(signals, dimensions);

  return {
    workspace_id: workspaceId,
    timestamp,
    signals,
    dimensions,
    overall_health: health.score,
    alerts,
  };
}

/**
 * Calculate signal deltas from previous snapshot
 */
export function calculateSignalDeltas(
  previous: SignalsSnapshot,
  current: SignalsSnapshot
): SignalDelta[] {
  const deltas: SignalDelta[] = [];

  for (const currentSignal of current.signals) {
    const prevSignal = previous.signals.find(
      s => s.dimension === currentSignal.dimension && s.source === currentSignal.source
    );

    if (prevSignal) {
      const delta = currentSignal.value - prevSignal.value;
      deltas.push({
        signal_id: currentSignal.signal_id,
        previous_value: prevSignal.value,
        current_value: currentSignal.value,
        delta,
        delta_percent: prevSignal.value > 0
          ? (delta / prevSignal.value) * 100
          : 0,
        timestamp: current.timestamp,
      });
    }
  }

  return deltas;
}

/**
 * Get signals for a specific dimension
 */
export function getSignalsByDimension(
  snapshot: SignalsSnapshot,
  dimension: SignalDimension
): CreativeSignal[] {
  return snapshot.signals.filter(s => s.dimension === dimension);
}

/**
 * Get critical alerts requiring attention
 */
export function getCriticalAlerts(snapshot: SignalsSnapshot): SignalAlert[] {
  return snapshot.alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
}

// Helper functions

function aggregateDimensions(signals: CreativeSignal[]): DimensionSummary[] {
  const dimensionMap = new Map<SignalDimension, CreativeSignal[]>();

  for (const signal of signals) {
    if (!dimensionMap.has(signal.dimension)) {
      dimensionMap.set(signal.dimension, []);
    }
    dimensionMap.get(signal.dimension)!.push(signal);
  }

  const summaries: DimensionSummary[] = [];

  for (const [dimension, dimSignals] of dimensionMap) {
    const avgValue = dimSignals.reduce((sum, s) => sum + s.value, 0) / dimSignals.length;
    const trends = dimSignals.map(s => s.trend);
    const overallTrend = trends.includes('rising') ? 'rising'
      : trends.includes('falling') ? 'falling'
      : 'stable';

    summaries.push({
      dimension,
      value: avgValue,
      contributing_signals: dimSignals.map(s => s.signal_id),
      trend: overallTrend,
      interpretation: interpretDimension(dimension, avgValue),
    });
  }

  return summaries;
}

function interpretDimension(dimension: SignalDimension, value: number): string {
  switch (dimension) {
    case 'momentum':
      return value > 60 ? 'Strong creative momentum' : value < 40 ? 'Low momentum, needs boost' : 'Stable momentum';
    case 'stagnation':
      return value > 60 ? 'Creative stagnation detected' : value < 40 ? 'Good creative variety' : 'Moderate variety';
    case 'resonance':
      return value > 60 ? 'High audience resonance' : value < 40 ? 'Low resonance, review content' : 'Average resonance';
    case 'fatigue':
      return value > 60 ? 'Creative fatigue high' : value < 40 ? 'Content still fresh' : 'Some fatigue signs';
    case 'unexplored_opportunity':
      return value > 60 ? 'Many methods untested' : value < 40 ? 'Well-explored methods' : 'Some opportunities remain';
    case 'channel_tension':
      return value > 60 ? 'High channel variance' : value < 40 ? 'Balanced performance' : 'Moderate variance';
    default:
      return 'Unknown dimension';
  }
}

function generateAlerts(
  signals: CreativeSignal[],
  dimensions: DimensionSummary[]
): SignalAlert[] {
  const alerts: SignalAlert[] = [];

  for (const dim of dimensions) {
    if (dim.dimension === 'fatigue' && dim.value > 70) {
      alerts.push({
        alert_id: `alert_fatigue_${Date.now()}`,
        severity: 'high',
        dimension: 'fatigue',
        message: 'High creative fatigue detected',
        recommended_action: 'Launch refresh campaign or new visual direction',
      });
    }

    if (dim.dimension === 'stagnation' && dim.value > 70) {
      alerts.push({
        alert_id: `alert_stagnation_${Date.now()}`,
        severity: 'medium',
        dimension: 'stagnation',
        message: 'Creative approach becoming stale',
        recommended_action: 'Test new methods from VIF catalog',
      });
    }

    if (dim.dimension === 'momentum' && dim.value < 30) {
      alerts.push({
        alert_id: `alert_momentum_${Date.now()}`,
        severity: 'high',
        dimension: 'momentum',
        message: 'Creative momentum critically low',
        recommended_action: 'Implement burst campaign strategy',
      });
    }

    if (dim.dimension === 'channel_tension' && dim.value > 60) {
      alerts.push({
        alert_id: `alert_tension_${Date.now()}`,
        severity: 'medium',
        dimension: 'channel_tension',
        message: 'High performance variance across channels',
        recommended_action: 'Review underperforming channels and adjust strategy',
      });
    }

    if (dim.dimension === 'resonance' && dim.value < 30) {
      alerts.push({
        alert_id: `alert_resonance_${Date.now()}`,
        severity: 'critical',
        dimension: 'resonance',
        message: 'Audience resonance critically low',
        recommended_action: 'Immediate content strategy review needed',
      });
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

export default {
  collectCreativeSignals,
  calculateSignalDeltas,
  getSignalsByDimension,
  getCriticalAlerts,
};

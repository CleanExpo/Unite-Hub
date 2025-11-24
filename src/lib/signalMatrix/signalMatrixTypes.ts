/**
 * Signal Matrix Types
 * Phase 82: Type definitions for Unified Signal Matrix & Early Warning Engine
 */

export type SignalScope = 'global' | 'client' | 'channel' | 'campaign';

export type WarningSeverity = 'low' | 'medium' | 'high';

export type WarningType =
  | 'trend_shift'
  | 'collapse_risk'
  | 'fatigue'
  | 'operational_stress'
  | 'story_stall'
  | 'creative_drift'
  | 'scaling_pressure'
  | 'performance_conflict'
  | 'data_gap'
  | 'blindspot';

export type WarningStatus = 'open' | 'acknowledged' | 'resolved';

/**
 * Individual signal from an engine
 */
export interface EngineSignal {
  engine: string;
  metric: string;
  value: number;
  normalised: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: string;
}

/**
 * Aggregated signals by engine category
 */
export interface SignalCategory {
  score: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  signals: EngineSignal[];
}

/**
 * Complete signal JSON structure
 */
export interface SignalJson {
  creative: SignalCategory;
  performance: SignalCategory;
  reality: SignalCategory;
  orm: SignalCategory;
  alignment: SignalCategory;
  scaling: SignalCategory;
  campaign: SignalCategory;
  vif: SignalCategory;
  story: SignalCategory;
  external: SignalCategory;
  errors: string[];
}

/**
 * Unified Signal Matrix row
 */
export interface UnifiedSignalMatrix {
  id: string;
  created_at: string;
  client_id: string | null;
  scope: SignalScope;
  signal_json: SignalJson;
  completeness_score: number;
  confidence_score: number;
  anomaly_score: number;
  trend_shift_score: number;
  fatigue_score: number;
}

/**
 * Early Warning Event
 */
export interface EarlyWarningEvent {
  id: string;
  created_at: string;
  client_id: string | null;
  severity: WarningSeverity;
  warning_type: WarningType;
  title: string;
  description_markdown: string;
  source_signals: EngineSignal[];
  confidence: number;
  timeframe_start: string | null;
  timeframe_end: string | null;
  status: WarningStatus;
  resolved_at: string | null;
  resolved_by_user_id: string | null;
}

/**
 * Early Warning Factor (configurable threshold)
 */
export interface EarlyWarningFactor {
  id: string;
  created_at: string;
  updated_at: string;
  factor_name: WarningType;
  threshold: number;
  weight: number;
  active: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Warning detection result
 */
export interface WarningDetection {
  detected: boolean;
  type: WarningType;
  severity: WarningSeverity;
  score: number;
  confidence: number;
  signals: EngineSignal[];
  reason: string;
}

/**
 * Matrix evaluation result
 */
export interface MatrixEvaluation {
  warnings: WarningDetection[];
  overall_risk: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  primary_concern: string;
  completeness: number;
}

/**
 * Get severity display properties
 */
export function getSeverityDisplay(severity: WarningSeverity): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (severity) {
    case 'high':
      return { label: 'High', color: 'text-red-500', bgColor: 'bg-red-500/10' };
    case 'medium':
      return { label: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
    case 'low':
      return { label: 'Low', color: 'text-blue-500', bgColor: 'bg-blue-500/10' };
  }
}

/**
 * Get warning type display label
 */
export function getWarningTypeLabel(type: WarningType): string {
  const labels: Record<WarningType, string> = {
    trend_shift: 'Trend Shift',
    collapse_risk: 'Collapse Risk',
    fatigue: 'Fatigue',
    operational_stress: 'Operational Stress',
    story_stall: 'Story Stall',
    creative_drift: 'Creative Drift',
    scaling_pressure: 'Scaling Pressure',
    performance_conflict: 'Performance Conflict',
    data_gap: 'Data Gap',
    blindspot: 'Blindspot',
  };
  return labels[type];
}

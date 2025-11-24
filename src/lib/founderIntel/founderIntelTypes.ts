/**
 * Founder Intelligence Types
 * Phase 80: Type definitions for Founder Intelligence Mode
 */

export type IntelScope = 'global' | 'client' | 'cohort' | 'segment';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type OpportunityLevel = 'none' | 'low' | 'medium' | 'high';
export type AlertType = 'risk' | 'opportunity' | 'anomaly' | 'info';
export type AlertStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
export type SourceEngine =
  | 'agency_director'
  | 'creative_director'
  | 'scaling_engine'
  | 'orm'
  | 'alignment_engine'
  | 'story_engine'
  | 'vif'
  | 'archive'
  | 'marketing_engine'
  | 'performance'
  | 'reports'
  | 'touchpoints';

/**
 * Founder Intelligence Snapshot
 */
export interface FounderIntelSnapshot {
  id: string;
  created_at: string;
  created_by_user_id?: string;
  scope: IntelScope;
  client_id?: string;
  title: string;
  summary_markdown: string;
  intelligence_json: IntelligenceData;
  risk_level: RiskLevel;
  opportunity_level: OpportunityLevel;
  confidence_score: number;
  timeframe_start?: string;
  timeframe_end?: string;
  data_completeness_score: number;
}

/**
 * Structured intelligence data within a snapshot
 */
export interface IntelligenceData {
  signals: IntelSignal[];
  metrics: Record<string, number | string>;
  sources: string[];
  archive_event_ids?: string[];
  report_ids?: string[];
  client_ids?: string[];
}

/**
 * Individual signal from an engine
 */
export interface IntelSignal {
  engine: SourceEngine;
  type: 'metric' | 'trend' | 'alert' | 'opportunity' | 'status';
  key: string;
  value: number | string | boolean;
  label: string;
  context?: string;
  confidence: number;
  timestamp?: string;
}

/**
 * Founder Intelligence Alert
 */
export interface FounderIntelAlert {
  id: string;
  created_at: string;
  client_id?: string;
  source_engine: SourceEngine;
  alert_type: AlertType;
  severity: RiskLevel;
  title: string;
  description_markdown: string;
  metadata: AlertMetadata;
  status: AlertStatus;
  resolved_at?: string;
  resolved_by_user_id?: string;
}

/**
 * Alert metadata with source references
 */
export interface AlertMetadata {
  archive_event_ids?: string[];
  report_ids?: string[];
  client_ids?: string[];
  metrics?: Record<string, number | string>;
  threshold_breached?: number;
  current_value?: number;
}

/**
 * Founder Intelligence Preferences
 */
export interface FounderIntelPreferences {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  risk_thresholds: Record<SourceEngine, number>;
  opportunity_preferences: OpportunityPreferences;
  briefing_schedule: BriefingSchedule;
  mute_rules: MuteRules;
}

export interface OpportunityPreferences {
  min_confidence: number;
  show_low_opportunities: boolean;
  highlight_high_impact: boolean;
}

export interface BriefingSchedule {
  weekly: {
    day: string;
    hour: number;
  };
  timezone: string;
}

export interface MuteRules {
  muted_engines: SourceEngine[];
  muted_alert_types: AlertType[];
  muted_clients: string[];
}

/**
 * Aggregated signals from all engines
 */
export interface AggregatedSignals {
  agency_health: HealthMetric;
  client_health: HealthMetric;
  creative_health: HealthMetric;
  scaling_risk: HealthMetric;
  orm_reality: HealthMetric;
  archive_completeness: HealthMetric;
  signals: IntelSignal[];
  alerts: FounderIntelAlert[];
  opportunities: IntelSignal[];
}

export interface HealthMetric {
  score: number;
  trend: 'up' | 'down' | 'stable';
  label: string;
  color: string;
  details?: string;
}

/**
 * Input for creating a snapshot
 */
export interface CreateSnapshotInput {
  scope: IntelScope;
  client_id?: string;
  title: string;
  timeframe_start?: string;
  timeframe_end?: string;
  created_by_user_id?: string;
}

/**
 * Filters for querying alerts
 */
export interface AlertFilters {
  status?: AlertStatus[];
  severity?: RiskLevel[];
  source_engine?: SourceEngine[];
  client_id?: string;
  limit?: number;
  offset?: number;
}

/**
 * Filters for querying snapshots
 */
export interface SnapshotFilters {
  scope?: IntelScope;
  client_id?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Briefing generation options
 */
export interface BriefingOptions {
  timeframe_days: number;
  include_opportunities: boolean;
  include_risks: boolean;
  include_recommendations: boolean;
}

/**
 * Get display properties for risk level
 */
export function getRiskLevelDisplay(level: RiskLevel): {
  label: string;
  color: string;
  icon: string;
} {
  const displays: Record<RiskLevel, { label: string; color: string; icon: string }> = {
    low: { label: 'Low', color: 'text-green-500', icon: 'CheckCircle' },
    medium: { label: 'Medium', color: 'text-yellow-500', icon: 'AlertCircle' },
    high: { label: 'High', color: 'text-orange-500', icon: 'AlertTriangle' },
    critical: { label: 'Critical', color: 'text-red-500', icon: 'XCircle' },
  };
  return displays[level];
}

/**
 * Get display properties for opportunity level
 */
export function getOpportunityLevelDisplay(level: OpportunityLevel): {
  label: string;
  color: string;
} {
  const displays: Record<OpportunityLevel, { label: string; color: string }> = {
    none: { label: 'None', color: 'text-muted-foreground' },
    low: { label: 'Low', color: 'text-blue-400' },
    medium: { label: 'Medium', color: 'text-blue-500' },
    high: { label: 'High', color: 'text-emerald-500' },
  };
  return displays[level];
}

/**
 * Get display properties for alert status
 */
export function getAlertStatusDisplay(status: AlertStatus): {
  label: string;
  color: string;
} {
  const displays: Record<AlertStatus, { label: string; color: string }> = {
    open: { label: 'Open', color: 'text-red-500' },
    acknowledged: { label: 'Acknowledged', color: 'text-yellow-500' },
    in_progress: { label: 'In Progress', color: 'text-blue-500' },
    resolved: { label: 'Resolved', color: 'text-green-500' },
    dismissed: { label: 'Dismissed', color: 'text-muted-foreground' },
  };
  return displays[status];
}

/**
 * Get display properties for source engine
 */
export function getSourceEngineDisplay(engine: SourceEngine): {
  label: string;
  color: string;
} {
  const displays: Record<SourceEngine, { label: string; color: string }> = {
    agency_director: { label: 'Agency Director', color: 'bg-purple-500/10' },
    creative_director: { label: 'Creative Director', color: 'bg-pink-500/10' },
    scaling_engine: { label: 'Scaling Engine', color: 'bg-orange-500/10' },
    orm: { label: 'ORM', color: 'bg-blue-500/10' },
    alignment_engine: { label: 'Alignment', color: 'bg-indigo-500/10' },
    story_engine: { label: 'Stories', color: 'bg-cyan-500/10' },
    vif: { label: 'VIF', color: 'bg-fuchsia-500/10' },
    archive: { label: 'Archive', color: 'bg-slate-500/10' },
    marketing_engine: { label: 'Marketing', color: 'bg-emerald-500/10' },
    performance: { label: 'Performance', color: 'bg-green-500/10' },
    reports: { label: 'Reports', color: 'bg-blue-500/10' },
    touchpoints: { label: 'Touchpoints', color: 'bg-teal-500/10' },
  };
  return displays[engine];
}

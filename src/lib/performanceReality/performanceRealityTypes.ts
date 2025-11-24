/**
 * Performance Reality Types
 * Phase 81: Type definitions for Performance Reality Engine
 */

export type RealityScope = 'global' | 'client' | 'cohort' | 'channel' | 'campaign';
export type PerformanceChannel = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'google' | 'email' | 'website' | 'multi' | 'none';
export type SignalSource = 'manual' | 'import' | 'integration';
export type SignalType = 'holiday' | 'weather' | 'industry_event' | 'campaign_conflict' | 'platform_issue' | 'other';

/**
 * Performance Reality Snapshot
 */
export interface PerformanceRealitySnapshot {
  id: string;
  created_at: string;
  created_by_user_id?: string;
  scope: RealityScope;
  client_id?: string;
  channel?: PerformanceChannel;
  campaign_id?: string;
  timeframe_start: string;
  timeframe_end: string;
  perceived_performance_score: number;
  true_performance_score: number;
  confidence_low: number;
  confidence_high: number;
  attribution_json: AttributionBreakdown;
  external_context_json: ExternalContext;
  false_positive_risk: number;
  false_negative_risk: number;
  summary_markdown: string;
}

/**
 * Attribution breakdown by factor
 */
export interface AttributionBreakdown {
  factors: AttributionFactor[];
  total_adjustment: number;
  primary_driver: string;
  secondary_drivers: string[];
}

/**
 * Single attribution factor contribution
 */
export interface AttributionFactor {
  name: string;
  weight: number;
  contribution: number;
  direction: 'positive' | 'negative' | 'neutral';
  confidence: number;
  notes?: string;
}

/**
 * Attribution factor definition from database
 */
export interface AttributionFactorDefinition {
  id: string;
  name: string;
  description: string;
  default_weight: number;
  active: boolean;
  metadata: Record<string, unknown>;
}

/**
 * External context captured for correction
 */
export interface ExternalContext {
  signals: ExternalSignalSummary[];
  total_impact_adjustment: number;
  confidence_impact: number;
}

/**
 * Summary of external signal for context
 */
export interface ExternalSignalSummary {
  id: string;
  type: SignalType;
  title: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number;
}

/**
 * External signal from database
 */
export interface ExternalSignal {
  id: string;
  created_at: string;
  source: SignalSource;
  region?: string;
  starts_at: string;
  ends_at: string;
  signal_type: SignalType;
  title: string;
  description: string;
  impact_hint: ImpactHint;
}

/**
 * Impact hint for external signal
 */
export interface ImpactHint {
  expected_effect: 'higher_engagement' | 'lower_engagement' | 'mixed' | 'unknown';
  affected_channels?: PerformanceChannel[];
  magnitude?: number;
  notes?: string;
}

/**
 * Input for generating a reality snapshot
 */
export interface GenerateSnapshotInput {
  scope: RealityScope;
  client_id?: string;
  channel?: PerformanceChannel;
  campaign_id?: string;
  timeframe_start: string;
  timeframe_end: string;
  created_by_user_id?: string;
}

/**
 * Filters for querying snapshots
 */
export interface SnapshotFilters {
  scope?: RealityScope;
  client_id?: string;
  channel?: PerformanceChannel;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Model input for computing true performance
 */
export interface ModelInput {
  perceived_score: number;
  attribution_factors: AttributionFactor[];
  external_signals: ExternalSignal[];
  data_completeness: number;
}

/**
 * Model output with adjusted scores
 */
export interface ModelOutput {
  true_score: number;
  confidence_low: number;
  confidence_high: number;
  false_positive_risk: number;
  false_negative_risk: number;
  adjustment_breakdown: {
    attribution_adjustment: number;
    external_adjustment: number;
    noise_correction: number;
  };
}

/**
 * Get display properties for scope
 */
export function getScopeDisplay(scope: RealityScope): { label: string; color: string } {
  const displays: Record<RealityScope, { label: string; color: string }> = {
    global: { label: 'Global', color: 'text-purple-500' },
    client: { label: 'Client', color: 'text-blue-500' },
    cohort: { label: 'Cohort', color: 'text-indigo-500' },
    channel: { label: 'Channel', color: 'text-cyan-500' },
    campaign: { label: 'Campaign', color: 'text-emerald-500' },
  };
  return displays[scope];
}

/**
 * Get display properties for channel
 */
export function getChannelDisplay(channel: PerformanceChannel): { label: string; color: string } {
  const displays: Record<PerformanceChannel, { label: string; color: string }> = {
    facebook: { label: 'Facebook', color: 'text-blue-600' },
    instagram: { label: 'Instagram', color: 'text-pink-500' },
    linkedin: { label: 'LinkedIn', color: 'text-blue-700' },
    tiktok: { label: 'TikTok', color: 'text-black' },
    youtube: { label: 'YouTube', color: 'text-red-500' },
    google: { label: 'Google', color: 'text-yellow-500' },
    email: { label: 'Email', color: 'text-gray-600' },
    website: { label: 'Website', color: 'text-green-500' },
    multi: { label: 'Multi-Channel', color: 'text-purple-500' },
    none: { label: 'N/A', color: 'text-muted-foreground' },
  };
  return displays[channel];
}

/**
 * Get display for signal type
 */
export function getSignalTypeDisplay(type: SignalType): { label: string; icon: string } {
  const displays: Record<SignalType, { label: string; icon: string }> = {
    holiday: { label: 'Holiday', icon: 'Calendar' },
    weather: { label: 'Weather', icon: 'Cloud' },
    industry_event: { label: 'Industry Event', icon: 'Building' },
    campaign_conflict: { label: 'Campaign Conflict', icon: 'AlertTriangle' },
    platform_issue: { label: 'Platform Issue', icon: 'AlertCircle' },
    other: { label: 'Other', icon: 'Info' },
  };
  return displays[type];
}

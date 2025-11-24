/**
 * Archive Types
 * Phase 78: Type definitions for Living Intelligence Archive
 */

/**
 * Event types for archive entries
 */
export type ArchiveEventType =
  | 'weekly_report'
  | 'monthly_report'
  | 'ninety_day_report'
  | 'story'
  | 'touchpoint'
  | 'success_event'
  | 'performance_event'
  | 'creative_event'
  | 'vif_event'
  | 'production_event'
  | 'director_alert'
  | 'governance_alert'
  // VIF-specific event types (Phase 79)
  | 'vif_method_used'
  | 'vif_asset_created'
  | 'vif_asset_refined'
  | 'vif_evolution_step'
  | 'vif_campaign_bundle_created'
  | 'vif_campaign_launched'
  | 'vif_ab_visual_test_started'
  | 'vif_ab_visual_test_concluded'
  | 'vif_visual_high_performer'
  | 'vif_visual_underperformer'
  | 'vif_creative_quality_scored';

/**
 * Source engines that generate archive entries
 */
export type SourceEngine =
  | 'performance'
  | 'success'
  | 'creative_ops'
  | 'creative_director'
  | 'vif'
  | 'visual_intelligence_fabric' // VIF Phase 79
  | 'production'
  | 'director'
  | 'governance'
  | 'reports'
  | 'storytelling'
  | 'touchpoints';

/**
 * Archive entry categories
 */
export type ArchiveCategory =
  | 'reports'
  | 'stories'
  | 'events'
  | 'alerts'
  | 'milestones'
  | 'visual_intelligence'; // VIF Phase 79

/**
 * Truth completeness status
 */
export type TruthCompleteness = 'complete' | 'partial' | 'limited';

/**
 * Core archive entry from database
 */
export interface ArchiveEntry {
  id: string;
  workspace_id: string;
  client_id: string;
  created_at: string;
  event_date: string;
  event_type: ArchiveEventType;
  source_engine: SourceEngine;
  category: ArchiveCategory;
  importance_score: number;
  summary: string;
  details_json: Record<string, unknown>;
  period_start?: string;
  period_end?: string;
  is_demo: boolean;
  truth_completeness: TruthCompleteness;
  data_sources: string[];
}

/**
 * Archive tag
 */
export interface ArchiveTag {
  id: string;
  archive_entry_id: string;
  tag: string;
  created_at: string;
}

/**
 * Client archive entry with UI display properties
 */
export interface ClientArchiveEntry extends ArchiveEntry {
  displayIcon: string;
  displayColor: string;
  shortLabel: string;
  contextLink?: string;
  tags?: string[];
}

/**
 * Archive filter options
 */
export interface ArchiveFilters {
  clientId?: string;
  workspaceId?: string;
  from?: string;
  to?: string;
  types?: ArchiveEventType[];
  sources?: SourceEngine[];
  categories?: ArchiveCategory[];
  importanceMin?: number;
  isDemo?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Archive query result
 */
export interface ArchiveQueryResult {
  entries: ClientArchiveEntry[];
  total: number;
  hasMore: boolean;
  earliestEventDate?: string;
  latestEventDate?: string;
  suggestedGrouping: 'daily' | 'weekly' | 'phase';
}

/**
 * Archive overview stats
 */
export interface ArchiveOverviewStats {
  totalEntries: number;
  entriesByType: Record<ArchiveEventType, number>;
  entriesBySource: Record<SourceEngine, number>;
  entriesByClient: Array<{
    clientId: string;
    clientName?: string;
    count: number;
    lastActivity: string;
  }>;
  dateRange: {
    earliest: string;
    latest: string;
  };
}

/**
 * Timeline group for UI display
 */
export interface TimelineGroup {
  date: string;
  label: string;
  items: ClientArchiveEntry[];
}

/**
 * Phase timeline group
 */
export interface PhaseTimelineGroup {
  phaseNumber: number;
  phaseName: string;
  dateRange: string;
  items: ClientArchiveEntry[];
}

/**
 * Client narrative summary
 */
export interface ClientNarrativeSummary {
  clientId: string;
  firstEventDate: string;
  latestEventDate: string;
  totalEvents: number;
  eventTypeCounts: Partial<Record<ArchiveEventType, number>>;
  keyHighlights: string[];
  recentActivity: ClientArchiveEntry[];
}

/**
 * Input for creating archive entry
 */
export interface CreateArchiveEntryInput {
  workspace_id: string;
  client_id: string;
  event_date: string;
  event_type: ArchiveEventType;
  source_engine: SourceEngine;
  category: ArchiveCategory;
  importance_score?: number;
  summary: string;
  details_json?: Record<string, unknown>;
  period_start?: string;
  period_end?: string;
  is_demo?: boolean;
  truth_completeness?: TruthCompleteness;
  data_sources?: string[];
  tags?: string[];
}

/**
 * Get display properties for event type
 */
export function getEventTypeDisplay(type: ArchiveEventType): {
  icon: string;
  color: string;
  label: string;
} {
  const displays: Record<ArchiveEventType, { icon: string; color: string; label: string }> = {
    weekly_report: { icon: 'FileText', color: 'text-blue-500', label: 'Weekly Report' },
    monthly_report: { icon: 'FileText', color: 'text-purple-500', label: 'Monthly Report' },
    ninety_day_report: { icon: 'FileText', color: 'text-green-500', label: '90-Day Report' },
    story: { icon: 'BookOpen', color: 'text-indigo-500', label: 'Story' },
    touchpoint: { icon: 'MessageCircle', color: 'text-cyan-500', label: 'Touchpoint' },
    success_event: { icon: 'Trophy', color: 'text-yellow-500', label: 'Success' },
    performance_event: { icon: 'TrendingUp', color: 'text-emerald-500', label: 'Performance' },
    creative_event: { icon: 'Palette', color: 'text-pink-500', label: 'Creative' },
    vif_event: { icon: 'Target', color: 'text-orange-500', label: 'VIF' },
    production_event: { icon: 'Factory', color: 'text-slate-500', label: 'Production' },
    director_alert: { icon: 'AlertTriangle', color: 'text-red-500', label: 'Director Alert' },
    governance_alert: { icon: 'Shield', color: 'text-amber-500', label: 'Governance' },
    // VIF-specific event types (Phase 79)
    vif_method_used: { icon: 'Wand2', color: 'text-violet-500', label: 'VIF Method' },
    vif_asset_created: { icon: 'Image', color: 'text-fuchsia-500', label: 'Visual Created' },
    vif_asset_refined: { icon: 'Sparkles', color: 'text-pink-500', label: 'Visual Refined' },
    vif_evolution_step: { icon: 'GitBranch', color: 'text-purple-500', label: 'Evolution Step' },
    vif_campaign_bundle_created: { icon: 'Package', color: 'text-indigo-500', label: 'Campaign Bundle' },
    vif_campaign_launched: { icon: 'Rocket', color: 'text-blue-500', label: 'Campaign Launched' },
    vif_ab_visual_test_started: { icon: 'FlaskConical', color: 'text-cyan-500', label: 'A/B Test Started' },
    vif_ab_visual_test_concluded: { icon: 'Trophy', color: 'text-emerald-500', label: 'A/B Test Winner' },
    vif_visual_high_performer: { icon: 'TrendingUp', color: 'text-green-500', label: 'High Performer' },
    vif_visual_underperformer: { icon: 'TrendingDown', color: 'text-orange-500', label: 'Underperformer' },
    vif_creative_quality_scored: { icon: 'Star', color: 'text-yellow-500', label: 'Quality Scored' },
  };

  return displays[type] || { icon: 'Circle', color: 'text-muted-foreground', label: type };
}

/**
 * Get display properties for source engine
 */
export function getSourceEngineDisplay(source: SourceEngine): {
  label: string;
  color: string;
} {
  const displays: Record<SourceEngine, { label: string; color: string }> = {
    performance: { label: 'Performance', color: 'bg-emerald-500/10' },
    success: { label: 'Success', color: 'bg-yellow-500/10' },
    creative_ops: { label: 'Creative Ops', color: 'bg-pink-500/10' },
    creative_director: { label: 'Creative Director', color: 'bg-rose-500/10' },
    vif: { label: 'VIF', color: 'bg-orange-500/10' },
    visual_intelligence_fabric: { label: 'Visual Intelligence', color: 'bg-fuchsia-500/10' },
    production: { label: 'Production', color: 'bg-slate-500/10' },
    director: { label: 'Director', color: 'bg-red-500/10' },
    governance: { label: 'Governance', color: 'bg-amber-500/10' },
    reports: { label: 'Reports', color: 'bg-blue-500/10' },
    storytelling: { label: 'Storytelling', color: 'bg-indigo-500/10' },
    touchpoints: { label: 'Touchpoints', color: 'bg-cyan-500/10' },
  };

  return displays[source] || { label: source, color: 'bg-muted' };
}

/**
 * Calculate importance level label
 */
export function getImportanceLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 90) return { label: 'Critical', color: 'text-red-500' };
  if (score >= 70) return { label: 'Significant', color: 'text-orange-500' };
  if (score >= 50) return { label: 'Notable', color: 'text-yellow-500' };
  return { label: 'Routine', color: 'text-muted-foreground' };
}

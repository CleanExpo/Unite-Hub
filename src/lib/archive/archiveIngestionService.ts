/**
 * Archive Ingestion Service
 * Phase 78: Centralized ingestion layer for archive entries
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ArchiveEventType,
  SourceEngine,
  ArchiveCategory,
  TruthCompleteness,
  CreateArchiveEntryInput,
} from './archiveTypes';

/**
 * Context for archive ingestion
 */
interface IngestionContext {
  workspaceId: string;
  clientId: string;
  isDemo?: boolean;
}

/**
 * Report metadata for archive entry
 */
interface ReportMeta {
  reportId: string;
  reportType: 'weekly' | 'monthly' | 'ninety_day';
  title: string;
  timeframe: { start: string; end: string; label: string };
  sectionsIncluded: string[];
  sectionsOmitted: string[];
  dataSources: string[];
}

/**
 * Story metadata for archive entry
 */
interface StoryMeta {
  storyId: string;
  period: string;
  title: string;
  milestoneCount: number;
  keyWins: string[];
  challenges: string[];
}

/**
 * Touchpoint metadata for archive entry
 */
interface TouchpointMeta {
  touchpointId: string;
  touchpointType: string;
  summary: string;
  participants?: string[];
  outcomes?: string[];
}

/**
 * Performance event metadata
 */
interface PerformanceMeta {
  eventId: string;
  metricType: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  summary: string;
}

/**
 * Success event metadata
 */
interface SuccessMeta {
  eventId: string;
  successType: string;
  title: string;
  description: string;
  impact?: string;
}

/**
 * Creative event metadata
 */
interface CreativeMeta {
  eventId: string;
  assetType: string;
  title: string;
  status: string;
  deliverables?: number;
}

/**
 * Production event metadata
 */
interface ProductionMeta {
  jobId: string;
  jobType: string;
  outputCount: number;
  deliverables: string[];
  status: string;
}

/**
 * Director event metadata
 */
interface DirectorMeta {
  alertId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  recommendations?: string[];
}

/**
 * Create archive entry in database
 */
async function createEntry(input: CreateArchiveEntryInput): Promise<string | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('archive_entries')
      .insert({
        workspace_id: input.workspace_id,
        client_id: input.client_id,
        event_date: input.event_date,
        event_type: input.event_type,
        source_engine: input.source_engine,
        category: input.category,
        importance_score: input.importance_score || 50,
        summary: input.summary,
        details_json: input.details_json || {},
        period_start: input.period_start,
        period_end: input.period_end,
        is_demo: input.is_demo || false,
        truth_completeness: input.truth_completeness || 'complete',
        data_sources: input.data_sources || [],
      })
      .select('id')
      .single();

    if (error) {
      console.error('Archive entry creation failed:', error);
      return null;
    }

    // Add tags if provided
    if (input.tags && input.tags.length > 0 && data?.id) {
      const tags = input.tags.map(tag => ({
        archive_entry_id: data.id,
        tag,
      }));

      await supabase.from('archive_tags').insert(tags);
    }

    return data?.id || null;
  } catch (error) {
    console.error('Archive ingestion error:', error);
    return null;
  }
}

/**
 * Log report entry to archive
 */
export async function logReportEntry(
  ctx: IngestionContext,
  meta: ReportMeta,
  completeness: number
): Promise<string | null> {
  const eventType: ArchiveEventType =
    meta.reportType === 'weekly' ? 'weekly_report' :
    meta.reportType === 'monthly' ? 'monthly_report' : 'ninety_day_report';

  const importance =
    meta.reportType === 'ninety_day' ? 70 :
    meta.reportType === 'monthly' ? 60 : 50;

  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: eventType,
    source_engine: 'reports',
    category: 'reports',
    importance_score: importance,
    summary: `${meta.title} - ${meta.timeframe.label}`,
    details_json: {
      report_id: meta.reportId,
      title: meta.title,
      sections_included: meta.sectionsIncluded,
      sections_omitted: meta.sectionsOmitted,
      completeness_percent: completeness,
    },
    period_start: meta.timeframe.start,
    period_end: meta.timeframe.end,
    is_demo: ctx.isDemo,
    truth_completeness: completeness >= 75 ? 'complete' : completeness >= 40 ? 'partial' : 'limited',
    data_sources: meta.dataSources,
    tags: [meta.reportType, 'report'],
  });
}

/**
 * Log story entry to archive
 */
export async function logStoryEntry(
  ctx: IngestionContext,
  meta: StoryMeta
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'story',
    source_engine: 'storytelling',
    category: 'stories',
    importance_score: 55,
    summary: meta.title,
    details_json: {
      story_id: meta.storyId,
      period: meta.period,
      milestone_count: meta.milestoneCount,
      key_wins: meta.keyWins,
      challenges: meta.challenges,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['storytelling'],
    tags: ['story', meta.period],
  });
}

/**
 * Log touchpoint entry to archive
 */
export async function logTouchpointEntry(
  ctx: IngestionContext,
  meta: TouchpointMeta
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'touchpoint',
    source_engine: 'touchpoints',
    category: 'events',
    importance_score: 40,
    summary: meta.summary,
    details_json: {
      touchpoint_id: meta.touchpointId,
      touchpoint_type: meta.touchpointType,
      participants: meta.participants,
      outcomes: meta.outcomes,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['touchpoints'],
    tags: ['touchpoint', meta.touchpointType],
  });
}

/**
 * Log performance event to archive
 */
export async function logPerformanceEvent(
  ctx: IngestionContext,
  meta: PerformanceMeta
): Promise<string | null> {
  const importance = meta.trend === 'up' ? 60 : meta.trend === 'down' ? 70 : 40;

  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'performance_event',
    source_engine: 'performance',
    category: 'events',
    importance_score: importance,
    summary: meta.summary,
    details_json: {
      event_id: meta.eventId,
      metric_type: meta.metricType,
      value: meta.value,
      trend: meta.trend,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['performance'],
    tags: ['performance', meta.metricType, meta.trend],
  });
}

/**
 * Log success event to archive
 */
export async function logSuccessEvent(
  ctx: IngestionContext,
  meta: SuccessMeta
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'success_event',
    source_engine: 'success',
    category: 'milestones',
    importance_score: 70,
    summary: meta.title,
    details_json: {
      event_id: meta.eventId,
      success_type: meta.successType,
      description: meta.description,
      impact: meta.impact,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['success'],
    tags: ['success', meta.successType],
  });
}

/**
 * Log creative event to archive
 */
export async function logCreativeEvent(
  ctx: IngestionContext,
  meta: CreativeMeta
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'creative_event',
    source_engine: 'creative_ops',
    category: 'events',
    importance_score: 50,
    summary: meta.title,
    details_json: {
      event_id: meta.eventId,
      asset_type: meta.assetType,
      status: meta.status,
      deliverables: meta.deliverables,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['creative_ops'],
    tags: ['creative', meta.assetType],
  });
}

/**
 * Log production event to archive
 */
export async function logProductionEvent(
  ctx: IngestionContext,
  meta: ProductionMeta
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'production_event',
    source_engine: 'production',
    category: 'events',
    importance_score: 55,
    summary: `Production: ${meta.outputCount} ${meta.jobType} deliverables`,
    details_json: {
      job_id: meta.jobId,
      job_type: meta.jobType,
      output_count: meta.outputCount,
      deliverables: meta.deliverables,
      status: meta.status,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['production'],
    tags: ['production', meta.jobType],
  });
}

/**
 * Log director event to archive
 */
export async function logDirectorEvent(
  ctx: IngestionContext,
  meta: DirectorMeta
): Promise<string | null> {
  const importance =
    meta.severity === 'critical' ? 90 :
    meta.severity === 'high' ? 80 :
    meta.severity === 'medium' ? 60 : 40;

  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'director_alert',
    source_engine: 'director',
    category: 'alerts',
    importance_score: importance,
    summary: meta.summary,
    details_json: {
      alert_id: meta.alertId,
      alert_type: meta.alertType,
      severity: meta.severity,
      recommendations: meta.recommendations,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['director'],
    tags: ['alert', meta.alertType, meta.severity],
  });
}

/**
 * Log VIF event to archive
 */
export async function logVifEvent(
  ctx: IngestionContext,
  meta: {
    eventId: string;
    vifType: string;
    summary: string;
    alignmentScore?: number;
  }
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'vif_event',
    source_engine: 'vif',
    category: 'events',
    importance_score: 55,
    summary: meta.summary,
    details_json: {
      event_id: meta.eventId,
      vif_type: meta.vifType,
      alignment_score: meta.alignmentScore,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['vif'],
    tags: ['vif', meta.vifType],
  });
}

/**
 * Log governance alert to archive
 */
export async function logGovernanceAlert(
  ctx: IngestionContext,
  meta: {
    alertId: string;
    alertType: string;
    severity: string;
    summary: string;
  }
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'governance_alert',
    source_engine: 'governance',
    category: 'alerts',
    importance_score: 75,
    summary: meta.summary,
    details_json: {
      alert_id: meta.alertId,
      alert_type: meta.alertType,
      severity: meta.severity,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['governance'],
    tags: ['governance', meta.alertType],
  });
}

export default {
  logReportEntry,
  logStoryEntry,
  logTouchpointEntry,
  logPerformanceEvent,
  logSuccessEvent,
  logCreativeEvent,
  logProductionEvent,
  logDirectorEvent,
  logVifEvent,
  logGovernanceAlert,
};

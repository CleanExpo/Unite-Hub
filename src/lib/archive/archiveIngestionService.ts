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

// ============================================
// VIF-specific ingestion helpers (Phase 79)
// ============================================

import {
  VifArchiveDetails,
  calculateVifImportanceScore,
} from './vifArchiveEvents';

/**
 * Log VIF method used
 */
export async function logVifMethodUsed(
  ctx: IngestionContext,
  params: {
    methodId: string;
    methodName: string;
    methodCategory?: string;
    summary?: string;
  }
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'vif_method_used',
    source_engine: 'visual_intelligence_fabric',
    category: 'visual_intelligence',
    importance_score: calculateVifImportanceScore('vif_method_used'),
    summary: params.summary || `VIF method: ${params.methodName}`,
    details_json: {
      methodId: params.methodId,
      methodName: params.methodName,
      methodCategory: params.methodCategory,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['visual_intelligence_fabric'],
    tags: ['vif', 'method', params.methodCategory || 'general'],
  });
}

/**
 * Log VIF asset created
 */
export async function logVifAssetCreated(
  ctx: IngestionContext,
  params: {
    assetId: string;
    assetType: string;
    methodId?: string;
    methodName?: string;
    provider?: string;
    qualityScore?: number;
    isFirst?: boolean;
  }
): Promise<string | null> {
  const importance = calculateVifImportanceScore('vif_asset_created', {
    isFirst: params.isFirst,
  });

  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'vif_asset_created',
    source_engine: 'visual_intelligence_fabric',
    category: 'visual_intelligence',
    importance_score: importance,
    summary: `Visual ${params.assetType} created${params.isFirst ? ' (first)' : ''}`,
    details_json: {
      assetId: params.assetId,
      assetType: params.assetType,
      methodId: params.methodId,
      methodName: params.methodName,
      provider: params.provider,
      qualityScore: params.qualityScore,
      isFirst: params.isFirst,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['visual_intelligence_fabric'],
    tags: ['vif', 'asset', params.assetType],
  });
}

/**
 * Log VIF asset refined
 */
export async function logVifAssetRefined(
  ctx: IngestionContext,
  params: {
    assetId: string;
    originalAssetId?: string;
    assetType: string;
    fitnessDelta?: number;
    context?: string;
  }
): Promise<string | null> {
  const importance = calculateVifImportanceScore('vif_asset_refined', {
    fitnessDelta: params.fitnessDelta,
  });

  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'vif_asset_refined',
    source_engine: 'visual_intelligence_fabric',
    category: 'visual_intelligence',
    importance_score: importance,
    summary: `Visual ${params.assetType} refined${params.fitnessDelta ? ` (+${(params.fitnessDelta * 100).toFixed(0)}%)` : ''}`,
    details_json: {
      assetId: params.assetId,
      originalAssetId: params.originalAssetId,
      assetType: params.assetType,
      fitnessDelta: params.fitnessDelta,
      context: params.context,
    },
    is_demo: ctx.isDemo,
    truth_completeness: params.fitnessDelta ? 'complete' : 'partial',
    data_sources: ['visual_intelligence_fabric'],
    tags: ['vif', 'refined', params.assetType],
  });
}

/**
 * Log VIF evolution step
 */
export async function logVifEvolutionStep(
  ctx: IngestionContext,
  params: {
    evolutionId: string;
    generationNumber: number;
    bestCandidateId: string;
    fitnessDelta: number;
    metrics?: Record<string, number>;
  }
): Promise<string | null> {
  const importance = calculateVifImportanceScore('vif_evolution_step', {
    fitnessDelta: params.fitnessDelta,
  });

  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'vif_evolution_step',
    source_engine: 'visual_intelligence_fabric',
    category: 'visual_intelligence',
    importance_score: importance,
    summary: `Evolution gen ${params.generationNumber}: +${(params.fitnessDelta * 100).toFixed(0)}% fitness`,
    details_json: {
      evolutionId: params.evolutionId,
      generationNumber: params.generationNumber,
      bestCandidateId: params.bestCandidateId,
      fitnessDelta: params.fitnessDelta,
      metrics: params.metrics,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['visual_intelligence_fabric'],
    tags: ['vif', 'evolution', `gen-${params.generationNumber}`],
  });
}

/**
 * Log VIF campaign bundle created
 */
export async function logVifCampaignBundleCreated(
  ctx: IngestionContext,
  params: {
    campaignId: string;
    campaignName: string;
    bundleTemplate?: string;
    assetCount: number;
    channels?: string[];
  }
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'vif_campaign_bundle_created',
    source_engine: 'visual_intelligence_fabric',
    category: 'visual_intelligence',
    importance_score: calculateVifImportanceScore('vif_campaign_bundle_created'),
    summary: `Campaign bundle: ${params.campaignName} (${params.assetCount} assets)`,
    details_json: {
      campaignId: params.campaignId,
      campaignName: params.campaignName,
      bundleTemplate: params.bundleTemplate,
      assetCount: params.assetCount,
      channels: params.channels,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['visual_intelligence_fabric'],
    tags: ['vif', 'campaign', 'bundle'],
  });
}

/**
 * Log VIF campaign launched
 */
export async function logVifCampaignLaunched(
  ctx: IngestionContext,
  params: {
    campaignId: string;
    campaignName: string;
    channel: string;
  }
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'vif_campaign_launched',
    source_engine: 'visual_intelligence_fabric',
    category: 'visual_intelligence',
    importance_score: calculateVifImportanceScore('vif_campaign_launched'),
    summary: `Campaign launched: ${params.campaignName} on ${params.channel}`,
    details_json: {
      campaignId: params.campaignId,
      campaignName: params.campaignName,
      channel: params.channel,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['visual_intelligence_fabric', 'production'],
    tags: ['vif', 'campaign', 'launched', params.channel],
  });
}

/**
 * Log VIF A/B test started
 */
export async function logVifAbTestStarted(
  ctx: IngestionContext,
  params: {
    testId: string;
    variantAId: string;
    variantBId: string;
    channels?: string[];
  }
): Promise<string | null> {
  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'vif_ab_visual_test_started',
    source_engine: 'visual_intelligence_fabric',
    category: 'visual_intelligence',
    importance_score: calculateVifImportanceScore('vif_ab_visual_test_started'),
    summary: `A/B visual test started`,
    details_json: {
      testId: params.testId,
      variantAId: params.variantAId,
      variantBId: params.variantBId,
      channels: params.channels,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['visual_intelligence_fabric', 'vif_reactive'],
    tags: ['vif', 'ab-test', 'started'],
  });
}

/**
 * Log VIF A/B test concluded
 */
export async function logVifAbTestConcluded(
  ctx: IngestionContext,
  params: {
    testId: string;
    winnerVariantId: string;
    significanceLevel: number;
    metrics?: Record<string, number>;
  }
): Promise<string | null> {
  const importance = calculateVifImportanceScore('vif_ab_visual_test_concluded', {
    significance: params.significanceLevel,
  });

  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'vif_ab_visual_test_concluded',
    source_engine: 'visual_intelligence_fabric',
    category: 'visual_intelligence',
    importance_score: importance,
    summary: `A/B test winner: ${(params.significanceLevel * 100).toFixed(0)}% confidence`,
    details_json: {
      testId: params.testId,
      winnerVariantId: params.winnerVariantId,
      significanceLevel: params.significanceLevel,
      metrics: params.metrics,
    },
    is_demo: ctx.isDemo,
    truth_completeness: 'complete',
    data_sources: ['visual_intelligence_fabric', 'vif_reactive'],
    tags: ['vif', 'ab-test', 'winner'],
  });
}

/**
 * Log VIF visual performance event (high/under performer)
 */
export async function logVifVisualPerformanceEvent(
  ctx: IngestionContext,
  params: {
    assetId: string;
    performanceLabel: 'high_performer' | 'underperformer';
    performanceScore?: number;
    metrics?: Record<string, number>;
  }
): Promise<string | null> {
  const eventType = params.performanceLabel === 'high_performer'
    ? 'vif_visual_high_performer'
    : 'vif_visual_underperformer';

  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: eventType,
    source_engine: 'visual_intelligence_fabric',
    category: 'visual_intelligence',
    importance_score: calculateVifImportanceScore(eventType),
    summary: params.performanceLabel === 'high_performer'
      ? `High-performing visual identified`
      : `Underperforming visual flagged`,
    details_json: {
      assetId: params.assetId,
      performanceLabel: params.performanceLabel,
      performanceScore: params.performanceScore,
      metrics: params.metrics,
    },
    is_demo: ctx.isDemo,
    truth_completeness: params.metrics ? 'complete' : 'metrics_only',
    data_sources: ['visual_intelligence_fabric', 'vif_reactive', 'performance'],
    tags: ['vif', 'performance', params.performanceLabel],
  });
}

/**
 * Log VIF creative quality scored
 */
export async function logVifCreativeQualityScored(
  ctx: IngestionContext,
  params: {
    assetId: string;
    qualityGrade: string;
    qualityScore?: number;
    components?: Record<string, number>;
  }
): Promise<string | null> {
  const importance = calculateVifImportanceScore('vif_creative_quality_scored', {
    qualityGrade: params.qualityGrade,
  });

  return createEntry({
    workspace_id: ctx.workspaceId,
    client_id: ctx.clientId,
    event_date: new Date().toISOString(),
    event_type: 'vif_creative_quality_scored',
    source_engine: 'visual_intelligence_fabric',
    category: 'visual_intelligence',
    importance_score: importance,
    summary: `Quality grade: ${params.qualityGrade}`,
    details_json: {
      assetId: params.assetId,
      qualityGrade: params.qualityGrade,
      qualityScore: params.qualityScore,
      qualityComponents: params.components,
    },
    is_demo: ctx.isDemo,
    truth_completeness: params.components ? 'complete' : 'partial',
    data_sources: ['visual_intelligence_fabric', 'creative_director'],
    tags: ['vif', 'quality', `grade-${params.qualityGrade.toLowerCase()}`],
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
  // VIF-specific (Phase 79)
  logVifMethodUsed,
  logVifAssetCreated,
  logVifAssetRefined,
  logVifEvolutionStep,
  logVifCampaignBundleCreated,
  logVifCampaignLaunched,
  logVifAbTestStarted,
  logVifAbTestConcluded,
  logVifVisualPerformanceEvent,
  logVifCreativeQualityScored,
};

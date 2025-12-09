/**
 * Navigator Snapshot Service
 * Phase 96: Generate and save navigator snapshots
 */

import { getSupabaseServer } from '@/lib/supabase';
import { collectAllInputs } from './navigatorInputCollector';
import { generateInsights, getConfidenceBand } from './navigatorInferenceEngine';
import type {
  NavigatorSnapshot,
  NavigatorInsight,
  NavigatorSummary,
  PriorityMap,
  ActionSuggestion,
  NavigatorContext,
} from './navigatorTypes';

export async function generateSnapshot(context: NavigatorContext): Promise<NavigatorSnapshot> {
  if (!context.tenantId) {
    throw new Error('tenantId is required');
  }

  // Collect inputs
  const inputs = await collectAllInputs(context.tenantId, context.regionId);

  // Generate insights
  const generatedInsights = generateInsights(inputs);

  // Build summary
  const summary = buildSummary(generatedInsights);

  // Build priority map
  const priorityMap = buildPriorityMap(generatedInsights);

  // Build action suggestions
  const actionSuggestions = buildActionSuggestions(generatedInsights);

  // Calculate overall confidence
  const avgConfidence = inputs.length > 0
    ? inputs.reduce((sum, i) => sum + i.confidence, 0) / inputs.length
    : 0.5;

  // Save to database
  const supabase = await getSupabaseServer();

  const { data: snapshot, error: snapError } = await supabase
    .from('navigator_snapshots')
    .insert({
      tenant_id: context.tenantId,
      region_id: context.regionId || null,
      summary,
      confidence: avgConfidence,
      priority_map: priorityMap,
      action_suggestions: actionSuggestions,
      metadata: { inputCount: inputs.length, insightCount: generatedInsights.length },
    })
    .select()
    .single();

  if (snapError) {
    throw new Error(`Failed to save snapshot: ${snapError.message}`);
  }

  // Save insights
  const insightInserts = generatedInsights.map(insight => ({
    snapshot_id: snapshot.id,
    category: insight.category,
    title: insight.title,
    detail: insight.detail,
    confidence_band: getConfidenceBand(insight.confidence),
    uncertainty_notes: insight.uncertaintyNotes,
    priority: insight.priority,
    source_signals: insight.sourceSignals,
  }));

  if (insightInserts.length > 0) {
    await supabase.from('navigator_insights').insert(insightInserts);
  }

  return transformSnapshot(snapshot);
}

export async function getLatestSnapshot(tenantId: string): Promise<NavigatorSnapshot | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('navigator_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
return null;
}

  return transformSnapshot(data);
}

export async function getSnapshotById(snapshotId: string): Promise<NavigatorSnapshot | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('navigator_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (error || !data) {
return null;
}

  return transformSnapshot(data);
}

export async function getInsightsForSnapshot(snapshotId: string): Promise<NavigatorInsight[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('navigator_insights')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .order('priority', { ascending: false });

  if (error || !data) {
return [];
}

  return data.map(transformInsight);
}

export async function listSnapshots(
  tenantId: string,
  limit: number = 10
): Promise<NavigatorSnapshot[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('navigator_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
return [];
}

  return data.map(transformSnapshot);
}

// Helper functions

function buildSummary(insights: Array<{
  category: string;
  priority: number;
  title: string;
  confidence: number;
}>): NavigatorSummary {
  const opportunities = insights.filter(i => i.category === 'opportunity').length;
  const warnings = insights.filter(i => i.category === 'warning').length;
  const performance = insights.filter(i => i.category === 'performance').length;
  const compliance = insights.filter(i => i.category === 'compliance').length;

  const criticalWarnings = insights.filter(i => i.category === 'warning' && i.priority >= 9).length;

  let overallHealth: 'excellent' | 'good' | 'attention' | 'critical';
  if (criticalWarnings > 0) {
    overallHealth = 'critical';
  } else if (warnings > 2 || compliance > 2) {
    overallHealth = 'attention';
  } else if (opportunities > 3) {
    overallHealth = 'excellent';
  } else {
    overallHealth = 'good';
  }

  const topPriority = insights.length > 0 ? insights[0].title : 'No immediate priorities';

  const quickWins = insights
    .filter(i => i.category === 'opportunity' && i.confidence >= 0.7)
    .slice(0, 3)
    .map(i => i.title);

  const watchItems = insights
    .filter(i => i.category === 'warning' || i.category === 'compliance')
    .slice(0, 3)
    .map(i => i.title);

  return {
    overallHealth,
    keyMetrics: { opportunities, warnings, performance, compliance },
    topPriority,
    quickWins,
    watchItems,
  };
}

function buildPriorityMap(insights: Array<{ priority: number; title: string }>): PriorityMap {
  return {
    immediate: insights.filter(i => i.priority >= 9).map(i => i.title),
    shortTerm: insights.filter(i => i.priority >= 7 && i.priority < 9).map(i => i.title),
    mediumTerm: insights.filter(i => i.priority >= 5 && i.priority < 7).map(i => i.title),
    monitoring: insights.filter(i => i.priority < 5).map(i => i.title),
  };
}

function buildActionSuggestions(insights: Array<{
  category: string;
  title: string;
  priority: number;
  confidence: number;
  detail: { suggestedActions?: string[] };
}>): ActionSuggestion[] {
  const suggestions: ActionSuggestion[] = [];

  for (const insight of insights.slice(0, 5)) {
    const actions = insight.detail.suggestedActions || [];
    if (actions.length > 0) {
      suggestions.push({
        action: actions[0],
        rationale: insight.title,
        priority: insight.priority,
        confidence: insight.confidence,
        category: insight.category as ActionSuggestion['category'],
      });
    }
  }

  return suggestions;
}

function transformSnapshot(row: Record<string, unknown>): NavigatorSnapshot {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string | null,
    regionId: row.region_id as string | null,
    summary: row.summary as NavigatorSummary,
    confidence: row.confidence as number,
    priorityMap: row.priority_map as PriorityMap,
    actionSuggestions: (row.action_suggestions || []) as ActionSuggestion[],
    metadata: (row.metadata || {}) as Record<string, unknown>,
    createdAt: row.created_at as string,
  };
}

function transformInsight(row: Record<string, unknown>): NavigatorInsight {
  return {
    id: row.id as string,
    snapshotId: row.snapshot_id as string,
    category: row.category as NavigatorInsight['category'],
    title: row.title as string,
    detail: row.detail as NavigatorInsight['detail'],
    confidenceBand: row.confidence_band as NavigatorInsight['confidenceBand'],
    uncertaintyNotes: row.uncertainty_notes as string | null,
    priority: row.priority as number,
    sourceSignals: (row.source_signals || []) as string[],
    createdAt: row.created_at as string,
  };
}

/**
 * Combat Entry Service
 * Phase 88: Bind creatives + posting executions to rounds
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  CombatEntry,
  AttachEntryInput,
  RawMetrics,
  AdjustedMetrics,
} from './combatTypes';

/**
 * Attach an entry to a round
 */
export async function attachEntry(input: AttachEntryInput): Promise<CombatEntry> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('combat_entries')
    .insert({
      round_id: input.roundId,
      creative_asset_id: input.creativeAssetId,
      posting_execution_id: input.postingExecutionId,
      variant: input.variant,
      raw_metrics: input.rawMetrics || {},
      reality_adjusted_metrics: {},
      entry_status: 'pending',
      metadata: {
        attached_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to attach entry: ${error.message}`);
  }

  return mapToEntry(data);
}

/**
 * Update entry with metrics from execution
 */
export async function updateEntryMetrics(
  entryId: string,
  metrics: RawMetrics
): Promise<CombatEntry> {
  const supabase = await getSupabaseServer();

  // Calculate basic engagement metrics
  const impressions = metrics.impressions || 0;
  const clicks = metrics.clicks || 0;
  const conversions = metrics.conversions || 0;
  const engagementRate = impressions > 0
    ? ((clicks + (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0)) / impressions)
    : 0;

  const { data, error } = await supabase
    .from('combat_entries')
    .update({
      raw_metrics: metrics,
      impressions,
      clicks,
      conversions,
      engagement_rate: engagementRate,
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update entry metrics: ${error.message}`);
  }

  return mapToEntry(data);
}

/**
 * Apply reality adjustments from Performance Reality Engine
 */
export async function applyRealityAdjustments(
  entryId: string
): Promise<CombatEntry> {
  const supabase = await getSupabaseServer();

  // Get current entry
  const { data: entry } = await supabase
    .from('combat_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (!entry) {
    throw new Error('Entry not found');
  }

  const rawMetrics = entry.raw_metrics as RawMetrics;

  // Calculate reality adjustments
  const adjustments = calculateRealityAdjustments(rawMetrics, entry);

  // Compute composite score
  const score = computeCompositeScore(rawMetrics, adjustments);

  // Calculate confidence based on sample size
  const confidence = calculateConfidence(entry.impressions);

  const { data: updated, error } = await supabase
    .from('combat_entries')
    .update({
      reality_adjusted_metrics: adjustments,
      score,
      confidence,
      entry_status: 'active',
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to apply adjustments: ${error.message}`);
  }

  return mapToEntry(updated);
}

/**
 * Get entry by ID
 */
export async function getEntryById(entryId: string): Promise<CombatEntry | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('combat_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (error || !data) {
return null;
}

  return mapToEntry(data);
}

/**
 * List entries for a round
 */
export async function listEntriesByRound(roundId: string): Promise<CombatEntry[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('combat_entries')
    .select('*')
    .eq('round_id', roundId)
    .order('score', { ascending: false });

  if (error) {
    console.error('Failed to list entries:', error);
    return [];
  }

  return (data || []).map(mapToEntry);
}

/**
 * Update entry status
 */
export async function updateEntryStatus(
  entryId: string,
  status: 'winner' | 'loser' | 'tied'
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase
    .from('combat_entries')
    .update({ entry_status: status })
    .eq('id', entryId);
}

// Helper functions

function calculateRealityAdjustments(
  raw: RawMetrics,
  entry: any
): AdjustedMetrics {
  // Get factors from metadata or use defaults
  const seasonalityFactor = entry.metadata?.seasonality_factor || 1.0;
  const fatigueFactor = entry.metadata?.fatigue_factor || 1.0;

  // Apply adjustments
  const adjustedImpressions = (raw.impressions || 0) * seasonalityFactor;
  const adjustedClicks = (raw.clicks || 0) * seasonalityFactor * fatigueFactor;
  const adjustedConversions = (raw.conversions || 0) * seasonalityFactor * fatigueFactor;

  // Confidence adjustment based on data completeness
  let confidenceAdjustment = 1.0;
  if (!raw.conversions) {
confidenceAdjustment *= 0.9;
}
  if (!raw.cost) {
confidenceAdjustment *= 0.95;
}
  if ((raw.impressions || 0) < 100) {
confidenceAdjustment *= 0.8;
}

  return {
    adjustedImpressions,
    adjustedClicks,
    adjustedConversions,
    confidenceAdjustment,
    seasonalityFactor,
    fatigueFactor,
  };
}

function computeCompositeScore(
  raw: RawMetrics,
  adjustments: AdjustedMetrics
): number {
  // Weighted scoring based on business value
  const weights = {
    conversions: 0.4,
    clicks: 0.25,
    engagement: 0.2,
    efficiency: 0.15,
  };

  // Normalize metrics to 0-100 scale
  const conversionScore = Math.min(100, (adjustments.adjustedConversions || 0) * 10);
  const clickScore = Math.min(100, (adjustments.adjustedClicks || 0) / 10);
  const engagementScore = Math.min(100, (raw.engagementRate || 0) * 1000);

  // Efficiency: conversions per cost (if available)
  let efficiencyScore = 50; // default
  if (raw.cost && raw.cost > 0 && raw.conversions) {
    efficiencyScore = Math.min(100, (raw.conversions / raw.cost) * 100);
  }

  // Compute weighted score
  const score = (
    conversionScore * weights.conversions +
    clickScore * weights.clicks +
    engagementScore * weights.engagement +
    efficiencyScore * weights.efficiency
  ) * (adjustments.confidenceAdjustment || 1);

  return Math.round(score * 100) / 100;
}

function calculateConfidence(impressions: number): number {
  // Confidence increases with sample size
  if (impressions < 100) {
return 0.3;
}
  if (impressions < 500) {
return 0.5;
}
  if (impressions < 1000) {
return 0.7;
}
  if (impressions < 5000) {
return 0.85;
}
  return 0.95;
}

function mapToEntry(row: any): CombatEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    roundId: row.round_id,
    creativeAssetId: row.creative_asset_id,
    postingExecutionId: row.posting_execution_id,
    variant: row.variant,
    rawMetrics: row.raw_metrics,
    realityAdjustedMetrics: row.reality_adjusted_metrics,
    confidence: parseFloat(row.confidence),
    score: parseFloat(row.score),
    impressions: row.impressions,
    clicks: row.clicks,
    conversions: row.conversions,
    engagementRate: parseFloat(row.engagement_rate),
    entryStatus: row.entry_status,
    metadata: row.metadata,
  };
}

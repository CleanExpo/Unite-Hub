/**
 * MCOE Asset Selector Service
 * Phase 84: Choose assets using VIF, historical performance, fatigue avoidance
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  Channel,
  RiskClass,
} from './mcoeTypes';

interface AssetSelection {
  asset_id: string;
  variation_id?: string;
  confidence: number;
  reasoning: string;
  risk_level: RiskClass;
  truth_notes: string[];
}

interface SelectionContext {
  performance_data?: any;
  channel_state?: any;
  recent_posts?: string[];
  creative_scores?: Record<string, number>;
}

/**
 * Select best asset for a channel posting
 */
export async function selectAssetForChannel(
  clientId: string,
  workspaceId: string,
  channel: Channel,
  context?: SelectionContext
): Promise<AssetSelection | null> {
  const supabase = await getSupabaseServer();
  const truthNotes: string[] = [];

  // Get available assets
  const { data: assets } = await supabase
    .from('generatedContent')
    .select('id, content_type, content, metadata, created_at')
    .eq('workspace_id', workspaceId)
    .eq('contact_id', clientId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!assets || assets.length === 0) {
    return null;
  }

  // Get recently used assets to avoid repetition
  const { data: recentSchedules } = await supabase
    .from('campaign_orchestration_schedules')
    .select('creative_asset_id')
    .eq('client_id', clientId)
    .eq('channel', channel)
    .in('status', ['completed', 'pending', 'ready'])
    .gte('scheduled_for', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(10);

  const recentAssetIds = new Set(
    recentSchedules?.map(s => s.creative_asset_id).filter(Boolean) || []
  );

  // Score assets
  const scoredAssets = assets.map(asset => {
    let score = 50; // Base score

    // Penalize recently used
    if (recentAssetIds.has(asset.id)) {
      score -= 30;
    }

    // Boost based on metadata quality score if available
    const qualityScore = asset.metadata?.quality_score || 0.5;
    score += qualityScore * 20;

    // Boost based on brand consistency
    const brandScore = asset.metadata?.brand_consistency || 0.5;
    score += brandScore * 15;

    // Channel-specific boosts
    if (asset.metadata?.optimized_for?.includes(channel)) {
      score += 15;
    }

    // Recency boost (newer is slightly better)
    const ageHours = (Date.now() - new Date(asset.created_at).getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) score += 10;
    else if (ageHours < 72) score += 5;

    return {
      asset,
      score,
    };
  });

  // Sort by score
  scoredAssets.sort((a, b) => b.score - a.score);

  const selected = scoredAssets[0];

  if (!selected) {
    return null;
  }

  // Determine confidence
  let confidence = 0.7;
  if (selected.score >= 80) confidence = 0.9;
  else if (selected.score >= 60) confidence = 0.8;
  else if (selected.score < 40) confidence = 0.5;

  // Add truth notes
  if (recentAssetIds.size === 0) {
    truthNotes.push('No posting history available for fatigue calculation.');
  }

  if (!context?.performance_data) {
    truthNotes.push('No performance data available for optimization.');
  }

  if (assets.length < 5) {
    truthNotes.push(`Limited asset pool (${assets.length} available).`);
  }

  // Determine risk level
  let riskLevel: RiskClass = 'low';
  if (confidence < 0.6) riskLevel = 'high';
  else if (confidence < 0.75) riskLevel = 'medium';

  return {
    asset_id: selected.asset.id,
    variation_id: selected.asset.metadata?.variation_id,
    confidence,
    reasoning: generateReasoning(selected.asset, selected.score, channel),
    risk_level: riskLevel,
    truth_notes: truthNotes,
  };
}

/**
 * Select variation or evolution step for an asset
 */
export async function selectVariationOrEvolution(
  assetId: string,
  workspaceId: string
): Promise<{
  variation_id?: string;
  evolution_step?: number;
  confidence: number;
  reasoning: string;
} | null> {
  const supabase = await getSupabaseServer();

  // Check for variations
  const { data: variations } = await supabase
    .from('generatedContent')
    .select('id, metadata')
    .eq('workspace_id', workspaceId)
    .eq('metadata->>parent_id', assetId)
    .eq('status', 'approved');

  if (!variations || variations.length === 0) {
    return null;
  }

  // Score variations by performance
  const scoredVariations = variations.map(v => {
    const score = v.metadata?.performance_score || 0.5;
    return { variation: v, score };
  });

  scoredVariations.sort((a, b) => b.score - a.score);

  const selected = scoredVariations[0];

  return {
    variation_id: selected.variation.id,
    evolution_step: selected.variation.metadata?.evolution_step,
    confidence: selected.score,
    reasoning: `Selected top-performing variation (score: ${Math.round(selected.score * 100)}%)`,
  };
}

/**
 * Get unused assets for a channel
 */
export async function getUnusedAssets(
  clientId: string,
  workspaceId: string,
  channel: Channel,
  limit = 10
): Promise<any[]> {
  const supabase = await getSupabaseServer();

  // Get all used asset IDs for this channel
  const { data: usedSchedules } = await supabase
    .from('campaign_orchestration_schedules')
    .select('creative_asset_id')
    .eq('client_id', clientId)
    .eq('channel', channel)
    .not('creative_asset_id', 'is', null);

  const usedIds = new Set(usedSchedules?.map(s => s.creative_asset_id) || []);

  // Get approved assets
  const { data: assets } = await supabase
    .from('generatedContent')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('contact_id', clientId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  // Filter unused
  const unused = (assets || []).filter(a => !usedIds.has(a.id));

  return unused.slice(0, limit);
}

/**
 * Check asset freshness
 */
export function checkAssetFreshness(
  assetCreatedAt: string,
  thresholdDays = 30
): { fresh: boolean; age_days: number; recommendation: string } {
  const ageMs = Date.now() - new Date(assetCreatedAt).getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  if (ageDays <= 7) {
    return {
      fresh: true,
      age_days: ageDays,
      recommendation: 'Asset is fresh, good for immediate use',
    };
  } else if (ageDays <= thresholdDays) {
    return {
      fresh: true,
      age_days: ageDays,
      recommendation: 'Asset is usable but consider refreshing soon',
    };
  } else {
    return {
      fresh: false,
      age_days: ageDays,
      recommendation: 'Asset is stale, consider generating new content',
    };
  }
}

/**
 * Generate reasoning for asset selection
 */
function generateReasoning(
  asset: any,
  score: number,
  channel: Channel
): string {
  const parts: string[] = [];

  parts.push(`Selected asset with score ${Math.round(score)}/100.`);

  if (asset.metadata?.quality_score >= 0.8) {
    parts.push('High quality score.');
  }

  if (asset.metadata?.optimized_for?.includes(channel)) {
    parts.push(`Optimized for ${channel}.`);
  }

  const ageHours = (Date.now() - new Date(asset.created_at).getTime()) / (1000 * 60 * 60);
  if (ageHours < 24) {
    parts.push('Recently created.');
  }

  return parts.join(' ');
}

/**
 * Performance Reality Snapshot Service
 * Phase 81: CRUD operations for performance reality snapshots
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  PerformanceRealitySnapshot,
  RealityScope,
  ModelInput,
} from './performanceRealityTypes';
import { computeTruePerformanceScore, generateDemoPerceivedScore } from './performanceRealityModelService';
import { computeAttributionFactors } from './performanceAttributionService';
import { getExternalSignals, getExternalContext } from './performanceExternalSignalService';

/**
 * Create a new performance reality snapshot
 */
export async function createPerformanceRealitySnapshot(
  scope: RealityScope,
  clientId?: string,
  timeframeDays: number = 30
): Promise<PerformanceRealitySnapshot | null> {
  const supabase = await getSupabaseServer();

  // Calculate timeframe
  const timeframeEnd = new Date();
  const timeframeStart = new Date(timeframeEnd.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

  // Get perceived score (from actual metrics or demo)
  const perceivedScore = await getPerceivedScore(supabase, scope, clientId, timeframeStart, timeframeEnd);

  // Compute attribution factors
  const attribution = await computeAttributionFactors(scope, clientId, timeframeStart, timeframeEnd);

  // Get external signals
  const externalSignals = await getExternalSignals(timeframeStart, timeframeEnd);

  // Calculate data completeness
  const dataCompleteness = await calculateDataCompleteness(
    supabase,
    scope,
    clientId,
    timeframeStart,
    timeframeEnd
  );

  // Build model input
  const modelInput: ModelInput = {
    perceived_score: perceivedScore,
    attribution_factors: attribution.factors,
    external_signals: externalSignals,
    data_completeness: dataCompleteness,
  };

  // Compute true performance
  const modelOutput = computeTruePerformanceScore(modelInput);

  // Get external context for storage
  const externalContext = await getExternalContext(timeframeStart, timeframeEnd);

  // Create snapshot record
  const { data, error } = await supabase
    .from('performance_reality_snapshots')
    .insert({
      scope,
      client_id: clientId || null,
      perceived_score: perceivedScore,
      true_score: modelOutput.true_score,
      confidence_low: modelOutput.confidence_low,
      confidence_high: modelOutput.confidence_high,
      false_positive_risk: modelOutput.false_positive_risk,
      false_negative_risk: modelOutput.false_negative_risk,
      data_completeness: dataCompleteness,
      attribution_breakdown: attribution,
      external_context: externalContext,
      model_version: '1.0.0',
      timeframe_start: timeframeStart.toISOString(),
      timeframe_end: timeframeEnd.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating performance reality snapshot:', error);
    return null;
  }

  return data as PerformanceRealitySnapshot;
}

/**
 * Get a single snapshot by ID
 */
export async function getPerformanceRealitySnapshot(
  id: string
): Promise<PerformanceRealitySnapshot | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('performance_reality_snapshots')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching snapshot:', error);
    return null;
  }

  return data as PerformanceRealitySnapshot;
}

/**
 * List snapshots with optional filters
 */
export async function listPerformanceRealitySnapshots(options: {
  scope?: RealityScope;
  clientId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ snapshots: PerformanceRealitySnapshot[]; total: number }> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('performance_reality_snapshots')
    .select('*', { count: 'exact' });

  if (options.scope) {
    query = query.eq('scope', options.scope);
  }

  if (options.clientId) {
    query = query.eq('client_id', options.clientId);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(
      options.offset || 0,
      (options.offset || 0) + (options.limit || 10) - 1
    );

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing snapshots:', error);
    return { snapshots: [], total: 0 };
  }

  return {
    snapshots: (data || []) as PerformanceRealitySnapshot[],
    total: count || 0,
  };
}

/**
 * Get the latest snapshot for a scope
 */
export async function getLatestSnapshot(
  scope: RealityScope,
  clientId?: string
): Promise<PerformanceRealitySnapshot | null> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('performance_reality_snapshots')
    .select('*')
    .eq('scope', scope)
    .order('created_at', { ascending: false })
    .limit(1);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query.single();

  if (error) {
    // Not found is ok
    if (error.code !== 'PGRST116') {
      console.error('Error fetching latest snapshot:', error);
    }
    return null;
  }

  return data as PerformanceRealitySnapshot;
}

/**
 * Delete a snapshot
 */
export async function deletePerformanceRealitySnapshot(id: string): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('performance_reality_snapshots')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting snapshot:', error);
    return false;
  }

  return true;
}

/**
 * Get perceived score from actual metrics
 */
async function getPerceivedScore(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  scope: RealityScope,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Try to get real metrics from campaigns
  const query = supabase
    .from('campaigns')
    .select('open_rate, click_rate, status')
    .eq('status', 'sent')
    .gte('sent_at', startDate.toISOString())
    .lte('sent_at', endDate.toISOString());

  // Note: campaigns don't have client_id directly, would need join
  // For MVP, use demo scores

  const { data: campaigns } = await query.limit(50);

  if (!campaigns || campaigns.length === 0) {
    // Use demo score
    return generateDemoPerceivedScore(scope);
  }

  // Calculate weighted average of open and click rates
  let totalScore = 0;
  let count = 0;

  for (const campaign of campaigns) {
    const openRate = campaign.open_rate || 0;
    const clickRate = campaign.click_rate || 0;

    // Score formula: open rate (50%) + click rate (50%) * 100
    const campaignScore = ((openRate * 0.5) + (clickRate * 0.5)) * 100;
    totalScore += campaignScore;
    count++;
  }

  if (count === 0) {
    return generateDemoPerceivedScore(scope);
  }

  return totalScore / count;
}

/**
 * Calculate data completeness score
 */
async function calculateDataCompleteness(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  scope: RealityScope,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<number> {
  let completeness = 0.5; // Base completeness

  // Check for archive events
  let archiveQuery = supabase
    .from('living_intelligence_archive')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) {
    archiveQuery = archiveQuery.eq('client_id', clientId);
  }

  const { count: archiveCount } = await archiveQuery;

  if (archiveCount && archiveCount > 0) {
    completeness += 0.15;
    if (archiveCount > 10) {
completeness += 0.1;
}
    if (archiveCount > 50) {
completeness += 0.1;
}
  }

  // Check for campaign data
  const { count: campaignCount } = await supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (campaignCount && campaignCount > 0) {
    completeness += 0.1;
  }

  // Check for contact data
  if (clientId) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('ai_score, email, phone')
      .eq('id', clientId)
      .single();

    if (contact) {
      if (contact.ai_score) {
completeness += 0.05;
}
      if (contact.email) {
completeness += 0.05;
}
      if (contact.phone) {
completeness += 0.05;
}
    }
  }

  return Math.min(1, completeness);
}

/**
 * Generate a demo snapshot for testing
 */
export async function generateDemoSnapshot(
  scope: RealityScope = 'global'
): Promise<PerformanceRealitySnapshot> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const perceivedScore = generateDemoPerceivedScore(scope);

  const demoInput: ModelInput = {
    perceived_score: perceivedScore,
    attribution_factors: [
      {
        name: 'creative_quality',
        description: 'Quality of creative assets',
        weight: 0.2,
        contribution: 0.3,
        confidence: 0.7,
        direction: 'positive',
      },
      {
        name: 'audience_match',
        description: 'Targeting accuracy',
        weight: 0.15,
        contribution: -0.1,
        confidence: 0.6,
        direction: 'negative',
      },
      {
        name: 'timing_relevance',
        description: 'Send timing',
        weight: 0.1,
        contribution: 0.2,
        confidence: 0.8,
        direction: 'positive',
      },
    ],
    external_signals: [
      {
        id: 'demo-holiday',
        signal_type: 'holiday',
        name: 'Public Holiday',
        description: 'Regional holiday',
        start_date: weekAgo.toISOString(),
        end_date: weekAgo.toISOString(),
        region: 'AU',
        impact_hint: {
          expected_effect: 'lower_engagement',
          magnitude: 0.2,
          reasoning: 'Holiday reduces engagement',
        },
        source: 'demo',
        metadata: {},
        is_active: true,
      },
    ],
    data_completeness: 0.65,
  };

  const output = computeTruePerformanceScore(demoInput);

  return {
    id: `demo-${Date.now()}`,
    created_at: now.toISOString(),
    scope,
    client_id: null,
    perceived_score: perceivedScore,
    true_score: output.true_score,
    confidence_low: output.confidence_low,
    confidence_high: output.confidence_high,
    false_positive_risk: output.false_positive_risk,
    false_negative_risk: output.false_negative_risk,
    data_completeness: 0.65,
    attribution_breakdown: {
      factors: demoInput.attribution_factors,
      total_contribution: 0.4,
      primary_driver: 'creative_quality',
    },
    external_context: {
      signals: [
        {
          type: 'holiday',
          name: 'Public Holiday',
          impact: 'lower_engagement',
          magnitude: 0.2,
          dates: weekAgo.toLocaleDateString(),
        },
      ],
      overall_impact: 'negative',
      total_signals: 1,
      total_magnitude: 0.2,
    },
    model_version: '1.0.0',
    timeframe_start: weekAgo.toISOString(),
    timeframe_end: now.toISOString(),
  };
}

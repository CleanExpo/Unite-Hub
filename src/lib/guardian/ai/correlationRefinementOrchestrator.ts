/**
 * H03: Correlation Refinement Orchestrator
 * Builds and stores heuristic + optional AI recommendations for correlation clustering
 */

import { getSupabaseServer } from '@/lib/supabase';
import { buildCorrelationSignals } from './correlationSignals';
import { deriveHeuristicCorrelationRecommendations } from './heuristicCorrelationRefiner';
import { generateAiCorrelationRecommendations, mergeRecommendations } from './aiCorrelationRefiner';
import { isAiEnabled } from './metaGovernanceHelper';
import { logMetaAuditEvent } from './metaAuditService';

export interface BuildRecommendationsOptions {
  windowDays?: number;
  maxRecommendations?: number;
  actor?: string;
  forceNoAi?: boolean;
}

export interface BuildRecommendationsResult {
  created: number;
  aiUsed: boolean;
  warnings: string[];
}

/**
 * Build and store correlation refinement recommendations for a tenant
 */
export async function buildAndStoreCorrelationRecommendations(
  tenantId: string,
  options: BuildRecommendationsOptions = {}
): Promise<BuildRecommendationsResult> {
  const supabase = getSupabaseServer();
  const windowDays = options.windowDays || 7;
  const maxRecommendations = options.maxRecommendations || 10;
  const actor = options.actor || 'system';
  const forceNoAi = options.forceNoAi || false;

  const warnings: string[] = [];

  try {
    // Step 1: Build correlation signals
    console.info(`[H03 Orchestrator] Building signals for tenant ${tenantId} (window: ${windowDays}d)`);
    const signals = await buildCorrelationSignals(tenantId, { days: windowDays });

    if (signals.clusters.length === 0) {
      return {
        created: 0,
        aiUsed: false,
        warnings: ['No correlation clusters found in window'],
      };
    }

    // Step 2: Generate heuristic recommendations (always)
    console.info('[H03 Orchestrator] Generating heuristic recommendations');
    const heuristicRecs = deriveHeuristicCorrelationRecommendations(signals);

    // Step 3: Generate AI recommendations (if allowed)
    let aiRecs: any[] = [];
    let aiUsed = false;

    if (!forceNoAi) {
      try {
        const aiAllowed = await isAiEnabled(tenantId);
        if (aiAllowed) {
          console.info('[H03 Orchestrator] AI enabled, generating AI recommendations');
          aiRecs = await generateAiCorrelationRecommendations(tenantId, signals);
          aiUsed = aiRecs.length > 0;
        } else {
          console.info('[H03 Orchestrator] AI disabled, skipping AI recommendations');
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        warnings.push(`AI recommendation generation failed: ${msg}`);
      }
    }

    // Step 4: Merge and dedupe recommendations
    const allRecs = mergeRecommendations(heuristicRecs, aiRecs).slice(0, maxRecommendations);

    // Step 5: Persist recommendations
    console.info(`[H03 Orchestrator] Storing ${allRecs.length} recommendations`);

    let createdCount = 0;

    for (const rec of allRecs) {
      const { error } = await supabase.from('guardian_correlation_recommendations').insert({
        tenant_id: tenantId,
        status: 'new',
        source: aiRecs.includes(rec) ? 'ai' : 'heuristic',
        title: rec.title,
        rationale: rec.rationale,
        confidence: rec.confidence,
        recommendation_type: rec.recommendation_type,
        target: rec.target,
        signals: rec.signals,
        recommendation: rec.recommendation,
        metadata: {
          generated_at: new Date().toISOString(),
          window_days: windowDays,
        },
      });

      if (error) {
        warnings.push(`Failed to store recommendation "${rec.title}": ${error.message}`);
      } else {
        createdCount++;
      }
    }

    // Step 6: Log audit event
    try {
      await logMetaAuditEvent({
        tenantId,
        actor,
        source: 'correlation_refinement_advisor',
        action: 'generate',
        entityType: 'correlation_recommendations',
        entityId: tenantId,
        summary: `Generated ${createdCount} correlation refinement recommendations (AI: ${aiUsed})`,
        details: {
          created: createdCount,
          ai_used: aiUsed,
          window_days: windowDays,
          heuristic_count: heuristicRecs.length,
          ai_count: aiRecs.length,
        },
      });
    } catch (error) {
      console.warn('[H03 Orchestrator] Failed to log audit event:', error);
    }

    return {
      created: createdCount,
      aiUsed,
      warnings,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[H03 Orchestrator] Fatal error:', msg);
    throw error;
  }
}

/**
 * Get latest recommendations for a tenant
 */
export async function getRecommendationsForTenant(
  tenantId: string,
  options: { status?: string; source?: string; limit?: number } = {}
): Promise<any[]> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_correlation_recommendations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.source) {
    query = query.eq('source', options.source);
  }

  const limit = options.limit || 50;
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('[H03 Orchestrator] Failed to fetch recommendations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Update recommendation status
 */
export async function updateRecommendationStatus(
  tenantId: string,
  recommendationId: string,
  newStatus: string,
  actor?: string
): Promise<any> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_correlation_recommendations')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(newStatus === 'applied' && { applied_at: new Date().toISOString(), applied_by: actor }),
    })
    .eq('id', recommendationId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Log feedback
  try {
    await supabase.from('guardian_correlation_recommendation_feedback').insert({
      tenant_id: tenantId,
      recommendation_id: recommendationId,
      action: newStatus === 'applied' ? 'applied' : 'accepted',
      actor,
      metadata: { updated_status: newStatus },
    });
  } catch (err) {
    console.warn('[H03 Orchestrator] Failed to log feedback:', err);
  }

  return data;
}

/**
 * Add annotation to a cluster
 */
export async function addClusterAnnotation(
  tenantId: string,
  clusterId: string,
  label: string,
  options: { category?: string; notes?: string; tags?: string[] } = {}
): Promise<any> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_correlation_cluster_annotations')
    .insert({
      tenant_id: tenantId,
      cluster_id: clusterId,
      label,
      category: options.category || 'general',
      notes: options.notes,
      tags: options.tags || [],
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get annotations for a cluster
 */
export async function getClusterAnnotations(
  tenantId: string,
  clusterId: string
): Promise<any[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_correlation_cluster_annotations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('cluster_id', clusterId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Delete annotation
 */
export async function deleteClusterAnnotation(
  tenantId: string,
  annotationId: string
): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_correlation_cluster_annotations')
    .delete()
    .eq('id', annotationId)
    .eq('tenant_id', tenantId);

  if (error) {
    throw error;
  }
}

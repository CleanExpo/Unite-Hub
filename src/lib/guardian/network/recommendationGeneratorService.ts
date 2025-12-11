/**
 * Guardian X06: Recommendation Generator Service
 *
 * Consumes X01-X05 network intelligence to generate tenant-scoped recommendations.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  GuardianNetworkInsightContext,
  GuardianNetworkRecommendationDraft,
  mapInsightToRecommendation,
} from './recommendationModel';
import { logLifecycleAudit } from './lifecycleAuditLogger';

/**
 * Options for recommendation generation
 */
export interface GuardianRecommendationGenerationOptions {
  bucketDate?: Date;
  minSeverity?: 'low' | 'medium' | 'high' | 'critical';
  limit?: number;
}

/**
 * Load network insight contexts for a tenant from X01-X05 sources
 */
export async function loadNetworkInsightContextForTenant(
  tenantId: string,
  bucketDate: Date = new Date()
): Promise<GuardianNetworkInsightContext[]> {
  const supabase = getSupabaseServer();
  const contexts: GuardianNetworkInsightContext[] = [];

  // Window: last 7 days
  const windowStart = new Date(bucketDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Load anomalies from X02 with benchmark positions
    const { data: anomalies, error: anomError } = await supabase
      .from('guardian_network_anomaly_signals')
      .select('*')
      .eq('workspace_id', tenantId)
      .gte('detected_at', windowStart.toISOString());

    if (anomError) {
      console.warn('Failed to load anomalies for X06:', anomError);
    } else if (anomalies) {
      for (const anom of anomalies) {
        // Get benchmark snapshot for cohort position
        const { data: benchmarks } = await supabase
          .from('guardian_network_benchmark_snapshots')
          .select('*')
          .eq('workspace_id', tenantId)
          .eq('metric_family', anom.metric_family)
          .eq('metric_key', anom.metric_key)
          .order('created_at', { ascending: false })
          .limit(1);

        let cohortPosition: string | undefined;
        if (benchmarks && benchmarks.length > 0) {
          const bench = benchmarks[0];
          const percentileRank = (bench.percentile_rank ?? 0.5) * 100;
          if (percentileRank > 90) {
cohortPosition = 'above_p90';
} else if (percentileRank > 75) {
cohortPosition = 'above_p75';
} else if (percentileRank > 50) {
cohortPosition = 'above_median';
} else if (percentileRank > 25) {
cohortPosition = 'below_median';
} else {
cohortPosition = 'below_p25';
}
        }

        contexts.push({
          source: 'anomaly',
          metricFamily: anom.metric_family,
          metricKey: anom.metric_key,
          severity: anom.severity,
          deltaRatio: anom.delta_ratio,
          zScore: anom.z_score,
          cohortPosition,
        });
      }
    }

    // Load early warnings from X03 with patterns
    const { data: warnings, error: warnError } = await supabase
      .from('guardian_network_early_warnings')
      .select('*')
      .eq('workspace_id', tenantId)
      .gte('created_at', windowStart.toISOString());

    if (warnError) {
      console.warn('Failed to load early warnings for X06:', warnError);
    } else if (warnings) {
      for (const warn of warnings) {
        contexts.push({
          source: 'early_warning',
          metricFamily: 'alerts', // Infer from warning context
          metricKey: warn.pattern_key,
          severity: warn.severity,
          patterns: [warn.pattern_key],
          deltaRatio: warn.match_score,
        });
      }
    }

    // Optionally load QA coverage (I08 / X02 fusion)
    // For now, stub this: in production, integrate with I08 coverage score service
    const { data: coverageItems, error: coverageError } = await supabase
      .from('guardian_qa_coverage_items')
      .select('*')
      .eq('workspace_id', tenantId)
      .limit(10);

    if (coverageError) {
      console.warn('Failed to load coverage items for X06:', coverageError);
    } else if (coverageItems) {
      for (const item of coverageItems) {
        const coverageScore = (item.test_count ?? 0) / Math.max((item.scenario_count ?? 1), 1);
        if (coverageScore < 0.8) {
          contexts.push({
            source: 'coverage',
            metricFamily: 'qa',
            metricKey: `coverage.${item.rule_id}`,
            severity: coverageScore < 0.6 ? 'high' : 'medium',
            coverageScore,
            coverageGap: true,
          });
        }
      }
    }

    return contexts;
  } catch (err) {
    console.error(`Failed to load insight context for tenant ${tenantId}:`, err);
    return [];
  }
}

/**
 * Generate recommendations for a specific tenant
 */
export async function generateRecommendationsForTenant(
  tenantId: string,
  options: GuardianRecommendationGenerationOptions = {}
): Promise<void> {
  const { bucketDate = new Date(), minSeverity = 'low', limit = 50 } = options;

  const supabase = getSupabaseServer();

  try {
    // Load contexts
    const contexts = await loadNetworkInsightContextForTenant(tenantId, bucketDate);

    if (contexts.length === 0) {
      console.log(`No insight contexts for tenant ${tenantId}; skipping recommendation generation`);
      return;
    }

    // Generate drafts
    const draftsByKey = new Map<string, GuardianNetworkRecommendationDraft>();
    for (const ctx of contexts) {
      const drafts = mapInsightToRecommendation(tenantId, ctx);
      for (const draft of drafts) {
        // Deduplicate by key: recommendation_type + suggestion_theme + metric_key
        const key = `${draft.recommendationType}:${draft.suggestionTheme}:${ctx.metricKey}`;
        if (!draftsByKey.has(key)) {
          draftsByKey.set(key, draft);
        }
      }
    }

    // Filter by minSeverity and limit
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const minSeverityLevel = severityOrder[minSeverity];

    const filteredDrafts = Array.from(draftsByKey.values())
      .filter((draft) => severityOrder[draft.severity] >= minSeverityLevel)
      .slice(0, limit);

    // Insert or update recommendations
    for (const draft of filteredDrafts) {
      // Check for existing recommendation (deduplication)
      const { data: existing } = await supabase
        .from('guardian_network_recommendations')
        .select('id')
        .eq('workspace_id', tenantId)
        .eq('recommendation_type', draft.recommendationType)
        .eq('suggestion_theme', draft.suggestionTheme)
        .eq('metric_key', (draft.relatedEntities as any)?.metricKey || '')
        .in('status', ['open', 'in_progress'])
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing
        await supabase
          .from('guardian_network_recommendations')
          .update({
            updated_at: new Date().toISOString(),
            severity: draft.severity,
            summary: draft.summary,
            rationale: draft.rationale,
          })
          .eq('id', existing[0].id);
      } else {
        // Insert new
        const { data: inserted, error } = await supabase
          .from('guardian_network_recommendations')
          .insert({
            workspace_id: tenantId,
            tenant_id: tenantId,
            source: 'network_anomaly', // Simplified; could be more specific
            metric_family: (draft.relatedEntities as any)?.metricFamily || 'alerts',
            metric_key: (draft.relatedEntities as any)?.metricKey || 'general',
            severity: draft.severity,
            status: 'open',
            recommendation_type: draft.recommendationType,
            suggestion_theme: draft.suggestionTheme,
            title: draft.title,
            summary: draft.summary,
            rationale: draft.rationale,
            related_entities: draft.relatedEntities,
          })
          .select('id')
          .single();

        if (error) {
          console.error(`Failed to insert recommendation for tenant ${tenantId}:`, error);
          continue;
        }

        // Link back to source entities (simplified; link to most recent anomalies)
        if (inserted) {
          // In production, enumerate and link all contributing sources
          // For now, just log
          console.log(`Created recommendation ${inserted.id} for tenant ${tenantId}`);
        }
      }
    }

    // Log operation
    await logLifecycleAudit({
      scope: 'recommendations',
      action: 'generate',
      tenantId,
      itemsAffected: filteredDrafts.length,
      detail: `Generated ${filteredDrafts.length} recommendations for tenant ${tenantId}`,
      metadata: {
        contextCount: contexts.length,
        draftCount: filteredDrafts.length,
      },
    });
  } catch (err) {
    console.error(`Recommendation generation failed for tenant ${tenantId}:`, err);
    throw err;
  }
}

/**
 * Generate recommendations for all tenants (batch operation)
 */
export async function generateRecommendationsForAllTenants(
  bucketDate: Date = new Date()
): Promise<void> {
  const supabase = getSupabaseServer();

  try {
    // Get list of active workspaces (simplified; in production, use your tenant listing logic)
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch workspaces for batch recommendation generation:', error);
      return;
    }

    if (!workspaces || workspaces.length === 0) {
      console.log('No workspaces found for recommendation generation');
      return;
    }

    console.log(`Starting batch recommendation generation for ${workspaces.length} tenants`);

    for (const workspace of workspaces) {
      try {
        await generateRecommendationsForTenant(workspace.id, { bucketDate });
      } catch (err) {
        console.error(`Failed to generate recommendations for workspace ${workspace.id}:`, err);
        // Continue with next workspace
      }
    }

    console.log('Batch recommendation generation completed');
  } catch (err) {
    console.error('Batch recommendation generation failed:', err);
    throw err;
  }
}

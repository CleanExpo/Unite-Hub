import { createMessage, parseJSONResponse } from '@/lib/claude/client';
import { createClient } from '@/lib/supabase/server';
import { assertAiFeatureEnabled, checkDailyQuota } from '@/lib/guardian/ai/aiConfig';

/**
 * Guardian AI Correlation Refinement Service (H03)
 *
 * Uses Claude Sonnet 4.5 to analyze existing correlation clusters and suggest improvements.
 * Provides advisory recommendations: merge, split, relabel, rank.
 *
 * Design Principles:
 * - Privacy-friendly: Only aggregated cluster metrics (no raw event data)
 * - Advisory only: Humans retain final control (no auto-mutations)
 * - Type-safe: Validated JSON responses
 * - Graceful degradation: Returns error if AI unavailable
 */

export interface GuardianClusterSummary {
  clusterId: string;
  severity: string | null;
  status: string;
  alertCount: number;
  incidentCount: number;
  firstSeen: string;
  lastSeen: string;
}

export interface GuardianCorrelationRecommendation {
  action: 'merge' | 'split' | 'relabel' | 'rank';
  targetClusterIds: string[];
  score: number; // 0-1 relevance score
  confidence: number; // 0-1 AI confidence
  rationale: string;
}

export interface GuardianCorrelationRefinementInput {
  tenantId: string;
  windowHours?: number; // Default: 72
  limitClusters?: number; // Default: 50
}

export interface GuardianCorrelationRefinementOutput {
  recommendations: GuardianCorrelationRecommendation[];
  clustersSummary: GuardianClusterSummary[];
}

/**
 * Fetch recent correlation clusters (privacy-friendly aggregation)
 */
async function fetchRecentCorrelationClusters(
  tenantId: string,
  windowHours: number,
  limit: number
): Promise<GuardianClusterSummary[]> {
  const supabase = await createClient();

  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  // Fetch clusters
  const { data: clusters, error: clustersError } = await supabase
    .from('guardian_correlation_clusters')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('last_seen', windowStart.toISOString())
    .order('last_seen', { ascending: false })
    .limit(limit);

  if (clustersError) throw clustersError;

  // For each cluster, count linked alerts and incidents
  const clusterSummaries: GuardianClusterSummary[] = [];

  for (const cluster of clusters ?? []) {
    const { data: links, error: linksError } = await supabase
      .from('guardian_correlation_links')
      .select('kind')
      .eq('cluster_id', cluster.id);

    if (linksError) {
      console.error('[Guardian H03] Failed to fetch cluster links:', linksError);
      continue;
    }

    const alertCount = links?.filter((l: any) => l.kind === 'alert').length ?? 0;
    const incidentCount = links?.filter((l: any) => l.kind === 'incident').length ?? 0;

    clusterSummaries.push({
      clusterId: cluster.id,
      severity: cluster.severity,
      status: cluster.status,
      alertCount,
      incidentCount,
      firstSeen: cluster.first_seen,
      lastSeen: cluster.last_seen,
    });
  }

  return clusterSummaries;
}

/**
 * Generate AI-powered correlation refinement suggestions
 */
export async function generateCorrelationRecommendations(
  input: GuardianCorrelationRefinementInput
): Promise<GuardianCorrelationRefinementOutput> {
  const windowHours = input.windowHours ?? 72;
  const limitClusters = input.limitClusters ?? 50;

  const startTime = Date.now();

  try {
    // H05: Check if correlation refinement feature is enabled
    await assertAiFeatureEnabled(input.tenantId, 'correlation_refinement');

    // H05: Check daily quota
    const quota = await checkDailyQuota(input.tenantId);
    if (quota.exceeded) {
      throw new Error(
        `QUOTA_EXCEEDED: Daily AI call limit reached (${quota.current}/${quota.limit})`
      );
    }
    // Fetch recent clusters (privacy-friendly aggregation)
    const clustersSummary = await fetchRecentCorrelationClusters(
      input.tenantId,
      windowHours,
      limitClusters
    );

    if (clustersSummary.length === 0) {
      // No clusters to analyze
      return {
        recommendations: [],
        clustersSummary: [],
      };
    }

    // Build AI prompt (aggregated metrics only)
    const prompt = buildCorrelationRefinementPrompt(clustersSummary, windowHours);

    // Call Claude Sonnet 4.5
    const message = await createMessage(
      [{ role: 'user', content: prompt }],
      buildCorrelationSystemPrompt(),
      {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        temperature: 0.3, // Moderate temperature for structured suggestions
      }
    );

    // Parse and validate JSON response
    const response = parseJSONResponse<{ recommendations: GuardianCorrelationRecommendation[] }>(
      message
    );

    // Validate response structure
    if (!response.recommendations || !Array.isArray(response.recommendations)) {
      throw new Error('Invalid AI response: missing recommendations array');
    }

    // Validate each recommendation
    for (const rec of response.recommendations) {
      if (!rec.action || !rec.targetClusterIds || !rec.rationale) {
        throw new Error('Invalid recommendation structure');
      }
      if (!['merge', 'split', 'relabel', 'rank'].includes(rec.action)) {
        throw new Error(`Invalid action: ${rec.action}`);
      }
    }

    const latency = Date.now() - startTime;

    console.log('[Guardian H03] Correlation refinement generated:', {
      tenantId: input.tenantId,
      recommendations: response.recommendations.length,
      latencyMs: latency,
    });

    return {
      recommendations: response.recommendations,
      clustersSummary,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('[Guardian H03] Correlation refinement failed:', error);
    throw error;
  }
}

/**
 * Build system prompt for correlation refinement
 */
function buildCorrelationSystemPrompt(): string {
  return `You are a Guardian correlation refinement expert for SaaS observability platforms.

Guardian clusters related alerts and incidents by time window + severity.

Your task: Analyze existing correlation clusters and suggest improvements.

Available actions:
- merge: Combine related clusters that should be grouped
- split: Separate unrelated events that were wrongly clustered
- relabel: Improve cluster severity or status classification
- rank: Adjust cluster priority/importance

Respond ONLY with valid JSON:
{
  "recommendations": [
    {
      "action": "merge",
      "targetClusterIds": ["cluster-1", "cluster-2"],
      "score": 0.85,
      "confidence": 0.90,
      "rationale": "Both clusters have critical severity in same time window"
    }
  ]
}

Guidelines:
- score: 0-1 (relevance of suggestion)
- confidence: 0-1 (how confident you are)
- rationale: 1 sentence explaining suggestion
- Limit recommendations to top 5 most valuable

No markdown, no extra text outside JSON.`;
}

/**
 * Build prompt from cluster summaries (privacy-friendly)
 */
function buildCorrelationRefinementPrompt(
  clusters: GuardianClusterSummary[],
  windowHours: number
): string {
  const parts = [`Analyze Guardian correlation clusters (last ${windowHours} hours):\n`];

  for (const cluster of clusters.slice(0, 10)) {
    // Limit to 10 for prompt size
    parts.push(
      `Cluster ${cluster.clusterId.substring(0, 8)}: severity=${cluster.severity}, status=${cluster.status}, alerts=${cluster.alertCount}, incidents=${cluster.incidentCount}`
    );
  }

  parts.push(
    `\nTotal clusters: ${clusters.length}\n\nSuggest up to 5 refinements (merge, split, relabel, rank).\nRespond with JSON only.`
  );

  return parts.join('\n');
}

/**
 * H03: Heuristic Correlation Refinement Recommender
 * Generates deterministic recommendations for splitting/merging and tuning correlation parameters
 * No AI involved; uses only aggregate signals to derive heuristics
 */

import { CorrelationSignalsResult, ClusterSignal } from './correlationSignals';

export interface CorrelationRecommendation {
  title: string;
  rationale: string;
  confidence: number; // 0..1
  recommendation_type: 'merge_split' | 'threshold_tune' | 'link_weight' | 'time_window' | 'noise_filter';
  target: {
    cluster_ids?: string[];
    scope: 'single' | 'multiple' | 'global';
  };
  recommendation: Record<string, unknown>; // param deltas
  signals: Record<string, unknown>; // relevant signal metrics
}

/**
 * Derive heuristic correlation recommendations from aggregate signals
 */
export function deriveHeuristicCorrelationRecommendations(
  signals: CorrelationSignalsResult
): CorrelationRecommendation[] {
  const recommendations: CorrelationRecommendation[] = [];

  // Extract commonly used metrics
  const summary = signals.summary;
  const clusters = signals.clusters;

  if (clusters.length === 0) {
    return [];
  }

  // Heuristic 1: Split oversized clusters
  // If cluster size > p95 and duration very long, recommend tightening time window or adding noise filter
  const oversizedClusters = clusters.filter((c) => c.link_count > summary.p95_cluster_size);

  if (oversizedClusters.length > 0) {
    const largeCluster = oversizedClusters[0]; // Target the largest
    const avgDuration = summary.median_duration_minutes;
    const isVeryLong = largeCluster.duration_minutes > avgDuration * 3;

    if (isVeryLong) {
      recommendations.push({
        title: 'Split Oversized Long-Duration Cluster',
        rationale: `Cluster ${largeCluster.cluster_id} has ${largeCluster.link_count} links (p95=${summary.p95_cluster_size}) and ${largeCluster.duration_minutes} minutes duration. Consider tightening time window or adding noise filter to prevent over-grouping.`,
        confidence: 0.7,
        recommendation_type: 'time_window',
        target: {
          cluster_ids: [largeCluster.cluster_id],
          scope: 'single',
        },
        recommendation: {
          time_window_minutes_delta: -25, // suggest reducing by 25%
          reason: 'reduce over-grouping of unrelated events',
        },
        signals: {
          cluster_size: largeCluster.link_count,
          p95_size: summary.p95_cluster_size,
          duration_minutes: largeCluster.duration_minutes,
          avg_duration_minutes: summary.median_duration_minutes,
        },
      });
    }
  }

  // Heuristic 2: Merge tiny noisy clusters
  // If many clusters of size 2-3 with low incident linkage, suggest raising minimum link threshold
  const tinyNoisyClusters = clusters.filter(
    (c) => c.link_count <= 3 && c.incident_link_rate < 0.1 && c.duration_minutes < 60
  );

  if (tinyNoisyClusters.length > Math.max(clusters.length * 0.2, 3)) {
    // More than 20% of clusters are tiny noisy
    recommendations.push({
      title: 'Raise Minimum Link Threshold to Filter Noise',
      rationale: `${tinyNoisyClusters.length} clusters (${((tinyNoisyClusters.length / clusters.length) * 100).toFixed(0)}%) have 2-3 links, low incident linkage, and short duration. These are likely noise. Consider raising min_links threshold from default 2 to 3 or 4.`,
      confidence: 0.65,
      recommendation_type: 'noise_filter',
      target: {
        scope: 'global',
      },
      recommendation: {
        min_links_delta: 1, // suggest increasing by 1
        reason: 'filter out tiny transient clusters with low incident impact',
      },
      signals: {
        tiny_noisy_cluster_count: tinyNoisyClusters.length,
        total_clusters: clusters.length,
        percent_tiny: ((tinyNoisyClusters.length / clusters.length) * 100).toFixed(1),
      },
    });
  }

  // Heuristic 3: Tune time window based on overlap
  // If many clusters have similar rule co-occurrences, they might be better merged
  const ruleOverlapCounts = new Map<string, number>();
  clusters.forEach((c) => {
    const ruleKey = JSON.stringify(c.unique_rule_count);
    ruleOverlapCounts.set(ruleKey, (ruleOverlapCounts.get(ruleKey) || 0) + 1);
  });

  const maxRuleOverlap = Math.max(...Array.from(ruleOverlapCounts.values()));
  const isHighOverlap = maxRuleOverlap / clusters.length > 0.3;

  if (isHighOverlap && summary.median_duration_minutes > 30) {
    recommendations.push({
      title: 'Relax Time Window to Better Correlate Related Events',
      rationale: `High rule overlap detected: ${maxRuleOverlap} clusters share similar rule sets. Median cluster duration is ${summary.median_duration_minutes} minutes. Consider relaxing time window to better group related events.`,
      confidence: 0.6,
      recommendation_type: 'time_window',
      target: {
        scope: 'global',
      },
      recommendation: {
        time_window_minutes_delta: 10, // suggest increasing by 10 minutes
        reason: 'improve correlation of related high-frequency patterns',
      },
      signals: {
        rule_overlap_ratio: (maxRuleOverlap / clusters.length).toFixed(2),
        median_duration_minutes: summary.median_duration_minutes,
        total_clusters_affected: maxRuleOverlap,
      },
    });
  }

  // Heuristic 4: Link weight tuning
  // If density is very low, consider lowering link weight threshold to catch more connections
  if (summary.avg_density < 0.5) {
    recommendations.push({
      title: 'Adjust Link Weight Threshold for Sparse Clusters',
      rationale: `Average cluster density is ${summary.avg_density.toFixed(2)} (links/entities), indicating sparse correlations. Consider lowering link weight threshold to capture more distant correlations, or verify link weighting is working as intended.`,
      confidence: 0.65,
      recommendation_type: 'link_weight',
      target: {
        scope: 'global',
      },
      recommendation: {
        link_weight_min_delta: -0.1, // suggest lowering minimum weight by 0.1
        reason: 'capture more distant correlations in sparse patterns',
      },
      signals: {
        avg_density: summary.avg_density.toFixed(2),
        median_size: summary.median_cluster_size,
        interpretation: 'sparse cluster connections suggest room for lower weight threshold',
      },
    });
  }

  // Heuristic 5: Max cluster duration tuning
  // If many clusters hit the duration limit, suggest increasing max_cluster_duration
  const veryLongClusters = clusters.filter((c) => c.duration_minutes > summary.p95_duration_minutes);
  if (veryLongClusters.length > clusters.length * 0.15) {
    recommendations.push({
      title: 'Increase Max Cluster Duration Limit',
      rationale: `${veryLongClusters.length} clusters (${((veryLongClusters.length / clusters.length) * 100).toFixed(0)}%) exceed p95 duration (${summary.p95_duration_minutes} minutes). May be hitting duration limit. Consider increasing max_cluster_duration to better capture long-running incident patterns.`,
      confidence: 0.6,
      recommendation_type: 'threshold_tune',
      target: {
        scope: 'global',
      },
      recommendation: {
        max_cluster_duration_minutes_delta: 120, // suggest adding 2 hours
        reason: 'allow longer-running incidents to remain clustered',
      },
      signals: {
        very_long_cluster_count: veryLongClusters.length,
        p95_duration_minutes: summary.p95_duration_minutes,
        percent_exceeding: ((veryLongClusters.length / clusters.length) * 100).toFixed(1),
      },
    });
  }

  // Sort by confidence descending
  recommendations.sort((a, b) => b.confidence - a.confidence);

  // Cap at reasonable max (don't overwhelm with recommendations)
  return recommendations.slice(0, 5);
}

/**
 * Validate a recommendation's structure and safety
 */
export function validateCorrelationRecommendation(rec: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!rec.title || typeof rec.title !== 'string') {
    errors.push('title must be a non-empty string');
  }

  if (!rec.rationale || typeof rec.rationale !== 'string') {
    errors.push('rationale must be a non-empty string');
  }

  if (typeof rec.confidence !== 'number' || rec.confidence < 0 || rec.confidence > 1) {
    errors.push('confidence must be a number between 0 and 1');
  }

  // Check recommendation_type is safe
  const validTypes = ['merge_split', 'threshold_tune', 'link_weight', 'time_window', 'noise_filter'];
  if (!validTypes.includes(rec.recommendation_type)) {
    errors.push(`recommendation_type must be one of: ${validTypes.join(', ')}`);
  }

  // Check target structure
  if (!rec.target || typeof rec.target !== 'object') {
    errors.push('target must be an object');
  } else {
    const validScopes = ['single', 'multiple', 'global'];
    if (!validScopes.includes(rec.target.scope)) {
      errors.push(`target.scope must be one of: ${validScopes.join(', ')}`);
    }

    // If cluster_ids present, validate as UUIDs
    if (rec.target.cluster_ids && Array.isArray(rec.target.cluster_ids)) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      for (const id of rec.target.cluster_ids) {
        if (!uuidRegex.test(id)) {
          errors.push(`target.cluster_ids contains invalid UUID: ${id}`);
        }
      }
    }
  }

  // Check recommendation contains only safe parameter names
  const safeParamNames = [
    'time_window_minutes_delta',
    'min_links_delta',
    'max_cluster_duration_minutes_delta',
    'link_weight_min_delta',
    'noise_filter_rules',
    'reason',
  ];

  if (rec.recommendation && typeof rec.recommendation === 'object') {
    const paramKeys = Object.keys(rec.recommendation);
    for (const param of paramKeys) {
      if (!safeParamNames.includes(param)) {
        // Allow 'reason' and similar explanatory fields, but flag unknown params
        if (!/^(reason|explanation|note|comment)/.test(param)) {
          errors.push(`recommendation contains disallowed parameter: ${param}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

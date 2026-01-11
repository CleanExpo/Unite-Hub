/**
 * Guardian X03: Pattern Mining Service
 *
 * Derives coarse pattern signatures from feature vectors and persists them globally.
 * No tenant identifiers in patterns.
 */

import { getSupabaseServer } from '@/lib/supabase';
import type {
  GuardianAnomalyFeature,
  GuardianPatternFeatureVector,
} from './patternFeatureExtractor';
import {
  buildPatternFeatureVectors,
  normalizeFeatureVector,
} from './patternFeatureExtractor';

export interface GuardianPatternCandidate {
  patternKey: string;
  cohortKey: string;
  metricFamily: string;
  metricKeys: string[];
  windowDays: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  featureVector: Record<string, unknown>;
  evidenceStats: {
    support: number;
    avgDeltaRatio?: number;
    avgZScore?: number;
  };
}

/**
 * Derive pattern candidates from feature vectors using heuristic rules
 */
export function derivePatternCandidates(
  vectors: GuardianPatternFeatureVector[]
): GuardianPatternCandidate[] {
  const candidates: GuardianPatternCandidate[] = [];

  for (const vector of vectors) {
    // Pattern 1: Alert bursts followed by incidents
    if (
      (vector.metricFamilies['alerts'] ?? 0) >= 2 &&
      (vector.metricFamilies['incidents'] ?? 0) >= 1
    ) {
      candidates.push({
        patternKey: 'alerts_burst_followed_by_incidents',
        cohortKey: vector.cohortKey,
        metricFamily: 'alerts',
        metricKeys: ['alerts.total', 'incidents.critical'],
        windowDays: vector.windowDays,
        severity: 'high',
        description:
          'Cohort exhibits frequent alert bursts followed by incident escalation. Consider reviewing alert thresholds and incident routing.',
        featureVector: normalizeFeatureVector(vector),
        evidenceStats: {
          support: 1,
        },
      });
    }

    // Pattern 2: High risk with notification lag
    if (
      (vector.metricFamilies['risk'] ?? 0) >= 1 &&
      (vector.metricFamilies['performance'] ?? 0) >= 1
    ) {
      candidates.push({
        patternKey: 'high_risk_and_notifications_lag',
        cohortKey: vector.cohortKey,
        metricFamily: 'risk',
        metricKeys: ['risk.avg_score', 'performance.notification_latency'],
        windowDays: vector.windowDays,
        severity: 'medium',
        description:
          'Risk elevation often coincides with performance degradation in notification systems. Check notification pipeline health.',
        featureVector: normalizeFeatureVector(vector),
        evidenceStats: {
          support: 1,
        },
      });
    }

    // Pattern 3: QA/performance anomalies clustering
    if (
      (vector.metricFamilies['qa'] ?? 0) >= 2 &&
      (vector.metricFamilies['performance'] ?? 0) >= 1
    ) {
      candidates.push({
        patternKey: 'qa_and_performance_clustering',
        cohortKey: vector.cohortKey,
        metricFamily: 'qa',
        metricKeys: ['qa.coverage', 'performance.p95_ms'],
        windowDays: vector.windowDays,
        severity: 'medium',
        description:
          'Quality metrics and performance anomalies frequently cluster together. Investigate shared root causes.',
        featureVector: normalizeFeatureVector(vector),
        evidenceStats: {
          support: 1,
        },
      });
    }
  }

  return candidates;
}

/**
 * Upsert pattern signatures into the database
 */
export async function upsertPatternSignatures(
  candidates: GuardianPatternCandidate[]
): Promise<void> {
  if (candidates.length === 0) {
return;
}

  const supabase = getSupabaseServer();

  for (const candidate of candidates) {
    const { error } = await supabase
      .from('guardian_network_pattern_signatures')
      .upsert(
        {
          pattern_key: candidate.patternKey,
          cohort_key: candidate.cohortKey,
          metric_family: candidate.metricFamily,
          metric_keys: candidate.metricKeys,
          window_days: candidate.windowDays,
          severity: candidate.severity,
          description: candidate.description,
          feature_vector: candidate.featureVector,
          evidence_stats: candidate.evidenceStats,
        },
        {
          onConflict: 'pattern_key,cohort_key',
        }
      );

    if (error) {
      console.error(
        `Failed to upsert pattern ${candidate.patternKey}:`,
        error
      );
    }
  }
}

/**
 * Full refresh of network pattern signatures
 */
export async function refreshNetworkPatternSignatures(params: {
  features: GuardianAnomalyFeature[];
  windowDays: number;
}): Promise<void> {
  const { features, windowDays } = params;

  // Build feature vectors from anomalies
  const vectors = buildPatternFeatureVectors(features, windowDays);

  // Derive pattern candidates
  const candidates = derivePatternCandidates(vectors);

  // Upsert to database
  await upsertPatternSignatures(candidates);
}

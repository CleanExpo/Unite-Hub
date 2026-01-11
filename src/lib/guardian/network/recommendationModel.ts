/**
 * Guardian X06: Recommendation Model & Mapping Catalog
 *
 * Deterministic mapping from network insights (benchmarks, anomalies, early warnings)
 * to actionable recommendation types and themes.
 */

/**
 * Recommendation types
 */
export type GuardianNetworkRecommendationType =
  | 'rule_tuning'
  | 'playbook_drill'
  | 'qa_focus'
  | 'performance_tuning'
  | 'coverage_gap';

/**
 * Suggestion themes
 */
export type GuardianNetworkSuggestionTheme =
  | 'tighten_alert_thresholds'
  | 'relax_alert_thresholds'
  | 'prioritise_critical_incidents'
  | 'exercise_playbooks'
  | 'expand_qa_regressions'
  | 'improve_performance_profiles'
  | 'increase_coverage_for_critical_rules'
  | 'review_notification_channels'
  | 'general_readiness_review';

/**
 * Severity levels
 */
export type GuardianNetworkSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Network insight context from X01-X05
 */
export interface GuardianNetworkInsightContext {
  source: 'benchmark' | 'anomaly' | 'early_warning' | 'coverage';
  metricFamily: string; // e.g., 'alerts', 'incidents', 'risk', 'perf', 'notifications'
  metricKey: string; // e.g., 'alerts.total', 'incidents.critical', 'perf.p95_ms'
  severity: GuardianNetworkSeverity;
  deltaRatio?: number; // (current - baseline) / baseline; positive = above baseline
  zScore?: number; // Standard deviations from baseline
  cohortPosition?: string; // e.g., 'above_p90', 'below_p10', 'at_median'
  patterns?: string[]; // Pattern keys from X03 early warnings
  coverageScore?: number; // 0-1 range for QA coverage
  coverageGap?: boolean; // True if coverage below threshold
}

/**
 * Draft recommendation (before persistence)
 */
export interface GuardianNetworkRecommendationDraft {
  recommendationType: GuardianNetworkRecommendationType;
  suggestionTheme: GuardianNetworkSuggestionTheme;
  title: string;
  summary: string;
  severity: GuardianNetworkSeverity;
  rationale: Record<string, unknown>; // Aggregate stats, no PII
  relatedEntities: Record<string, unknown>; // IDs and labels only
}

/**
 * Alert metric heuristics: elevated/suppressed/shifted alert volume
 */
function mapAlertMetricsToRecommendation(
  ctx: GuardianNetworkInsightContext
): GuardianNetworkRecommendationDraft[] {
  const recs: GuardianNetworkRecommendationDraft[] = [];

  if (ctx.metricKey === 'alerts.total' && ctx.severity === 'critical') {
    if ((ctx.deltaRatio ?? 0) > 0.5 && (ctx.cohortPosition?.includes('above_p90') ?? false)) {
      // Alert volume significantly above cohort
      recs.push({
        recommendationType: 'rule_tuning',
        suggestionTheme: 'tighten_alert_thresholds',
        title: 'High alert volume relative to peers',
        summary:
          'Alert volume is significantly elevated relative to similar tenants. Consider reviewing and tightening alert thresholds to reduce noise.',
        severity: ctx.severity,
        rationale: {
          deltaRatio: ctx.deltaRatio,
          cohortPosition: ctx.cohortPosition,
          zScore: ctx.zScore,
        },
        relatedEntities: {
          metricFamily: ctx.metricFamily,
          metricKey: ctx.metricKey,
        },
      });
    } else if ((ctx.deltaRatio ?? 0) < -0.5 && (ctx.cohortPosition?.includes('below_p10') ?? false)) {
      // Alert volume suppressed relative to cohort
      recs.push({
        recommendationType: 'rule_tuning',
        suggestionTheme: 'relax_alert_thresholds',
        title: 'Low alert volume relative to peers',
        summary:
          'Alert volume is significantly suppressed relative to similar tenants. You may be missing important events; consider reviewing thresholds.',
        severity: 'medium',
        rationale: {
          deltaRatio: ctx.deltaRatio,
          cohortPosition: ctx.cohortPosition,
          zScore: ctx.zScore,
        },
        relatedEntities: {
          metricFamily: ctx.metricFamily,
          metricKey: ctx.metricKey,
        },
      });
    }
  }

  return recs;
}

/**
 * Incident metric heuristics: critical incidents, incident frequency
 */
function mapIncidentMetricsToRecommendation(
  ctx: GuardianNetworkInsightContext
): GuardianNetworkRecommendationDraft[] {
  const recs: GuardianNetworkRecommendationDraft[] = [];

  if (ctx.metricKey === 'incidents.critical' && ctx.severity === 'critical') {
    recs.push({
      recommendationType: 'playbook_drill',
      suggestionTheme: 'prioritise_critical_incidents',
      title: 'Critical incidents trending upward',
      summary:
        'Critical incident rate is elevated. Review and exercise incident response playbooks to ensure readiness.',
      severity: ctx.severity,
      rationale: {
        deltaRatio: ctx.deltaRatio,
        cohortPosition: ctx.cohortPosition,
        zScore: ctx.zScore,
      },
      relatedEntities: {
        metricFamily: ctx.metricFamily,
        metricKey: ctx.metricKey,
      },
    });

    if ((ctx.patterns?.length ?? 0) > 0) {
      recs.push({
        recommendationType: 'playbook_drill',
        suggestionTheme: 'exercise_playbooks',
        title: 'Exercise playbooks for detected patterns',
        summary: `Early warning patterns detected (${ctx.patterns?.join(', ')}). Run simulation drills for relevant playbooks.`,
        severity: 'high',
        rationale: {
          patterns: ctx.patterns,
          patternCount: ctx.patterns?.length ?? 0,
        },
        relatedEntities: {
          metricFamily: ctx.metricFamily,
          patterns: ctx.patterns,
        },
      });
    }
  }

  return recs;
}

/**
 * Performance metric heuristics: latency, throughput degradation
 */
function mapPerformanceMetricsToRecommendation(
  ctx: GuardianNetworkInsightContext
): GuardianNetworkRecommendationDraft[] {
  const recs: GuardianNetworkRecommendationDraft[] = [];

  if (ctx.metricFamily === 'perf' && ctx.severity !== 'low') {
    if ((ctx.deltaRatio ?? 0) > 0.3) {
      // Performance degradation above baseline
      recs.push({
        recommendationType: 'performance_tuning',
        suggestionTheme: 'improve_performance_profiles',
        title: 'Performance degradation detected',
        summary: `Performance metric (${ctx.metricKey}) is degraded relative to baseline. Investigate optimization opportunities.`,
        severity: ctx.severity,
        rationale: {
          metricKey: ctx.metricKey,
          deltaRatio: ctx.deltaRatio,
          zScore: ctx.zScore,
        },
        relatedEntities: {
          metricFamily: ctx.metricFamily,
          metricKey: ctx.metricKey,
        },
      });
    }
  }

  return recs;
}

/**
 * QA coverage heuristics: coverage gaps for critical rules
 */
function mapCoverageMetricsToRecommendation(
  ctx: GuardianNetworkInsightContext
): GuardianNetworkRecommendationDraft[] {
  const recs: GuardianNetworkRecommendationDraft[] = [];

  if (ctx.source === 'coverage' && ctx.coverageGap) {
    if ((ctx.coverageScore ?? 0) < 0.7) {
      recs.push({
        recommendationType: 'coverage_gap',
        suggestionTheme: 'increase_coverage_for_critical_rules',
        title: 'QA coverage gap identified',
        summary: `Coverage for critical rules is below threshold (${((ctx.coverageScore ?? 0) * 100).toFixed(0)}%). Expand test scenarios.`,
        severity: 'high',
        rationale: {
          coverageScore: ctx.coverageScore,
          threshold: 0.7,
        },
        relatedEntities: {
          metricFamily: ctx.metricFamily,
          coverageScore: ctx.coverageScore,
        },
      });
    }
  }

  return recs;
}

/**
 * Notification channel heuristics
 */
function mapNotificationMetricsToRecommendation(
  ctx: GuardianNetworkInsightContext
): GuardianNetworkRecommendationDraft[] {
  const recs: GuardianNetworkRecommendationDraft[] = [];

  if (ctx.metricFamily === 'notifications' && ctx.severity === 'high') {
    if ((ctx.deltaRatio ?? 0) > 0.5) {
      recs.push({
        recommendationType: 'rule_tuning',
        suggestionTheme: 'review_notification_channels',
        title: 'Notification volume elevated',
        summary:
          'Notification volume is high. Review notification channels and routing rules to ensure critical alerts reach appropriate teams.',
        severity: 'high',
        rationale: {
          deltaRatio: ctx.deltaRatio,
          cohortPosition: ctx.cohortPosition,
        },
        relatedEntities: {
          metricFamily: ctx.metricFamily,
          metricKey: ctx.metricKey,
        },
      });
    }
  }

  return recs;
}

/**
 * Map insight context to zero or more recommendation drafts
 */
export function mapInsightToRecommendation(
  _tenantId: string,
  ctx: GuardianNetworkInsightContext
): GuardianNetworkRecommendationDraft[] {
  // Delegate to specialized mappers based on metric family
  const allRecs: GuardianNetworkRecommendationDraft[] = [];

  if (ctx.metricFamily === 'alerts') {
    allRecs.push(...mapAlertMetricsToRecommendation(ctx));
  } else if (ctx.metricFamily === 'incidents') {
    allRecs.push(...mapIncidentMetricsToRecommendation(ctx));
  } else if (ctx.metricFamily === 'perf') {
    allRecs.push(...mapPerformanceMetricsToRecommendation(ctx));
  } else if (ctx.source === 'coverage') {
    allRecs.push(...mapCoverageMetricsToRecommendation(ctx));
  } else if (ctx.metricFamily === 'notifications') {
    allRecs.push(...mapNotificationMetricsToRecommendation(ctx));
  }

  // General readiness review for critical early warnings
  if ((ctx.patterns?.length ?? 0) > 2 && ctx.severity === 'critical') {
    allRecs.push({
      recommendationType: 'rule_tuning',
      suggestionTheme: 'general_readiness_review',
      title: 'General readiness review recommended',
      summary:
        'Multiple network patterns detected. Consider a comprehensive review of rules, thresholds, and incident procedures.',
      severity: 'critical',
      rationale: {
        patternCount: ctx.patterns?.length,
        patterns: ctx.patterns,
      },
      relatedEntities: {
        metricFamily: ctx.metricFamily,
        patterns: ctx.patterns,
      },
    });
  }

  return allRecs;
}

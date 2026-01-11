import { createClient } from '@/lib/supabase/server';

// ===== TYPES =====

export type GuardianPlaybookTagDomain =
  | 'readiness'
  | 'uplift'
  | 'editions'
  | 'adoption'
  | 'executive'
  | 'goals_okrs'
  | 'network_meta';

export interface GuardianMetaPattern {
  domain: GuardianPlaybookTagDomain;
  key: string;  // e.g., 'low_readiness_core', 'weak_network_fit'
  label: string;  // Human-readable (e.g., 'Low Core Readiness')
  severity: 'info' | 'moderate' | 'high';
  details?: Record<string, unknown>;  // Optional metadata (scores, status)
}

export interface GuardianPlaybookSummary {
  id: string;
  key: string;
  title: string;
  summary: string;
  complexity: 'intro' | 'medium' | 'advanced';
  category: string;
  isGlobal: boolean;
  tags: string[];
}

// ===== PATTERN DERIVATION FUNCTIONS =====

/**
 * Derive patterns from Z01 readiness scores
 */
export function deriveReadinessPatterns(
  readinessSnapshot: { overall_guardian_score: number; status: string; details: Record<string, unknown> }
): GuardianMetaPattern[] {
  const patterns: GuardianMetaPattern[] = [];

  // Overall readiness check
  if (readinessSnapshot.overall_guardian_score < 50) {
    patterns.push({
      domain: 'readiness',
      key: 'low_readiness_overall',
      label: 'Low Overall Readiness',
      severity: 'high',
      details: { score: readinessSnapshot.overall_guardian_score },
    });
  } else if (readinessSnapshot.overall_guardian_score < 70) {
    patterns.push({
      domain: 'readiness',
      key: 'moderate_readiness',
      label: 'Moderate Readiness',
      severity: 'moderate',
      details: { score: readinessSnapshot.overall_guardian_score },
    });
  }

  // Check capability-specific weaknesses from details
  const capabilityScores = readinessSnapshot.details?.capabilities as Record<string, number> | undefined;
  if (capabilityScores) {
    Object.entries(capabilityScores).forEach(([capability, score]) => {
      if (score < 40) {
        patterns.push({
          domain: 'readiness',
          key: `low_readiness_${capability}`,
          label: `Low ${capability} Readiness`,
          severity: 'moderate',
          details: { capability, score },
        });
      }
    });
  }

  return patterns;
}

/**
 * Derive patterns from Z05 adoption scores
 */
export function deriveAdoptionPatterns(
  adoptionScores: Array<{ dimension: string; sub_dimension: string; status: string; score: number }>
): GuardianMetaPattern[] {
  const patterns: GuardianMetaPattern[] = [];

  adoptionScores.forEach(({ dimension, sub_dimension, status, score }) => {
    if (status === 'inactive' || status === 'light') {
      patterns.push({
        domain: 'adoption',
        key: `low_adoption_${dimension}_${sub_dimension}`.toLowerCase().replace(/\s+/g, '_'),
        label: `Low Adoption: ${dimension} / ${sub_dimension}`,
        severity: status === 'inactive' ? 'high' : 'moderate',
        details: { dimension, sub_dimension, status, score },
      });
    }
  });

  return patterns;
}

/**
 * Derive patterns from Z03 editions fit scores
 */
export function deriveEditionPatterns(
  editionFit: Array<{ edition_key: string; fit_score: number; status: string }>
): GuardianMetaPattern[] {
  const patterns: GuardianMetaPattern[] = [];

  editionFit.forEach(({ edition_key, fit_score, status }) => {
    if (fit_score < 50 || status === 'weak_fit') {
      patterns.push({
        domain: 'editions',
        key: `weak_edition_fit_${edition_key}`.toLowerCase(),
        label: `Weak Fit for ${edition_key} Edition`,
        severity: 'moderate',
        details: { edition_key, fit_score, status },
      });
    }
  });

  return patterns;
}

/**
 * Derive patterns from Z02 uplift plans
 */
export function deriveUpliftPatterns(
  upliftOverview: { activePlans: number; tasksDone: number; tasksTotal: number }
): GuardianMetaPattern[] {
  const patterns: GuardianMetaPattern[] = [];

  if (upliftOverview.activePlans === 0) {
    patterns.push({
      domain: 'uplift',
      key: 'no_active_uplift_plans',
      label: 'No Active Uplift Plans',
      severity: 'info',
      details: { activePlans: 0 },
    });
  }

  const completionRate = upliftOverview.tasksTotal > 0
    ? (upliftOverview.tasksDone / upliftOverview.tasksTotal) * 100
    : 0;

  if (completionRate < 30 && upliftOverview.activePlans > 0) {
    patterns.push({
      domain: 'uplift',
      key: 'low_uplift_progress',
      label: 'Low Uplift Progress',
      severity: 'moderate',
      details: { completionRate, tasksDone: upliftOverview.tasksDone, tasksTotal: upliftOverview.tasksTotal },
    });
  }

  return patterns;
}

/**
 * Derive patterns from Z04 executive reports
 */
export function deriveExecutivePatterns(
  executiveOverview: { reportsLast90d: number }
): GuardianMetaPattern[] {
  const patterns: GuardianMetaPattern[] = [];

  if (executiveOverview.reportsLast90d === 0) {
    patterns.push({
      domain: 'executive',
      key: 'no_executive_reports',
      label: 'No Executive Reports Generated',
      severity: 'moderate',
      details: { reportsLast90d: 0 },
    });
  } else if (executiveOverview.reportsLast90d < 2) {
    patterns.push({
      domain: 'executive',
      key: 'low_executive_reporting',
      label: 'Low Executive Reporting Frequency',
      severity: 'info',
      details: { reportsLast90d: executiveOverview.reportsLast90d },
    });
  }

  return patterns;
}

/**
 * Derive patterns from Z08 goals/OKRs KPI snapshots
 */
export function deriveGoalsOkrsPatterns(
  kpiSnapshots: Array<{ kpi_key: string; status: string; target_value: number; current_value: number }>
): GuardianMetaPattern[] {
  const patterns: GuardianMetaPattern[] = [];

  const behind = kpiSnapshots.filter((k) => k.status === 'behind');
  const onTrack = kpiSnapshots.filter((k) => k.status === 'on_track');

  if (behind.length > 0) {
    patterns.push({
      domain: 'goals_okrs',
      key: 'kpis_behind_target',
      label: `${behind.length} KPI${behind.length > 1 ? 's' : ''} Behind Target`,
      severity: behind.length > 2 ? 'high' : 'moderate',
      details: {
        behindCount: behind.length,
        examples: behind.slice(0, 2).map((k) => ({
          key: k.kpi_key,
          current: k.current_value,
          target: k.target_value,
        })),
      },
    });
  } else if (onTrack.length > 0) {
    patterns.push({
      domain: 'goals_okrs',
      key: 'kpis_on_track',
      label: 'All KPIs On Track',
      severity: 'info',
      details: { onTrackCount: onTrack.length },
    });
  }

  return patterns;
}

// ===== PLAYBOOK LOADING & MATCHING =====

/**
 * Load candidate playbooks for a specific domain
 */
export async function loadCandidatePlaybooksForDomain(
  tenantId: string,
  domain: GuardianPlaybookTagDomain
): Promise<GuardianPlaybookSummary[]> {
  const supabase = await createClient();

  const { data: playbooks, error } = await supabase
    .from('guardian_playbooks')
    .select(`
      id,
      key,
      title,
      summary,
      complexity,
      category,
      is_global,
      guardian_playbook_tags (tag_key, source_domain)
    `)
    .eq('category', domain)
    .eq('is_active', true);

  if (error) {
throw error;
}

  return (playbooks || []).map((p: any) => ({
    id: p.id,
    key: p.key,
    title: p.title,
    summary: p.summary,
    complexity: p.complexity,
    category: p.category,
    isGlobal: p.is_global,
    tags: (p.guardian_playbook_tags || []).map((t: any) => t.tag_key),
  }));
}

/**
 * Match patterns to playbooks via tag-based matching
 */
export async function matchPatternsToPlaybooks(
  tenantId: string,
  patterns: GuardianMetaPattern[]
): Promise<Array<{ pattern: GuardianMetaPattern; playbooks: GuardianPlaybookSummary[] }>> {
  const results = await Promise.all(
    patterns.map(async (pattern) => {
      // Load playbooks for this pattern's domain
      const playbooks = await loadCandidatePlaybooksForDomain(tenantId, pattern.domain);

      // Match playbooks with tag_key === pattern.key
      const matchedPlaybooks = playbooks.filter((pb) => pb.tags.includes(pattern.key));

      return { pattern, playbooks: matchedPlaybooks };
    })
  );

  return results;
}

/**
 * Get all unique domains from patterns
 */
export function getDomains(patterns: GuardianMetaPattern[]): GuardianPlaybookTagDomain[] {
  const seen = new Set<GuardianPlaybookTagDomain>();
  patterns.forEach((p) => seen.add(p.domain));
  return Array.from(seen);
}

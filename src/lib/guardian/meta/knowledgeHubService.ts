import { getSupabaseServer } from '@/lib/supabase/server';
import {
  GuardianMetaPattern,
  GuardianPlaybookSummary,
  deriveReadinessPatterns,
  deriveAdoptionPatterns,
  deriveEditionPatterns,
  deriveUpliftPatterns,
  deriveExecutivePatterns,
  deriveGoalsOkrsPatterns,
  matchPatternsToPlaybooks,
} from './playbookMappingService';

// ===== TYPES =====

export interface GuardianKnowledgeHubContext {
  tenantId: string;
  now: Date;
}

export interface GuardianKnowledgeHubState {
  readiness: { score: number; status: string; details: Record<string, unknown> } | null;
  editions: Array<{ edition_key: string; fit_score: number; status: string }>;
  uplift: { activePlans: number; tasksDone: number; tasksTotal: number } | null;
  adoption: Array<{ dimension: string; sub_dimension: string; status: string; score: number }>;
  executive: { reportsLast90d: number } | null;
  goalsOkrs: Array<{ kpi_key: string; status: string; target_value: number; current_value: number }>;
}

export interface GuardianKnowledgeHubSummary {
  patterns: GuardianMetaPattern[];
  suggestedPlaybooks: Array<{
    id: string;
    key: string;
    title: string;
    summary: string;
    domains: string[];
    matchedPatterns: string[];
  }>;
  patternCount: number;
  playbookCount: number;
}

// ===== STATE LOADING =====

/**
 * Load Z-series meta state for tenant
 */
export async function loadKnowledgeStateForTenant(
  ctx: GuardianKnowledgeHubContext
): Promise<GuardianKnowledgeHubState> {
  const supabase = getSupabaseServer();

  // Load latest readiness (Z01)
  const readinessList = await supabase
    .from('guardian_tenant_readiness_scores')
    .select('overall_guardian_score, status, details')
    .eq('tenant_id', ctx.tenantId)
    .order('computed_at', { ascending: false })
    .limit(1);

  const readiness = readinessList.data?.[0]
    ? {
        score: readinessList.data[0].overall_guardian_score,
        status: readinessList.data[0].status,
        details: readinessList.data[0].details || {},
      }
    : null;

  // Load latest edition fit (Z03)
  const editionsList = await supabase
    .from('guardian_edition_fit_scores')
    .select('edition_key, fit_score, status')
    .eq('tenant_id', ctx.tenantId)
    .order('computed_at', { ascending: false })
    .limit(10);

  const editions = editionsList.data || [];

  // Load latest uplift status (Z02)
  const upliftList = await supabase
    .from('guardian_tenant_uplift_plans')
    .select('id')
    .eq('tenant_id', ctx.tenantId)
    .eq('status', 'active')
    .limit(1);

  const tasksList = await supabase
    .from('guardian_tenant_uplift_tasks')
    .select('status')
    .eq('tenant_id', ctx.tenantId);

  const uplift = {
    activePlans: upliftList.data?.length || 0,
    tasksDone: tasksList.data?.filter((t: any) => t.status === 'completed').length || 0,
    tasksTotal: tasksList.data?.length || 0,
  };

  // Load latest adoption scores (Z05)
  const adoptionList = await supabase
    .from('guardian_adoption_scores')
    .select('dimension, sub_dimension, status, score')
    .eq('tenant_id', ctx.tenantId)
    .order('computed_at', { ascending: false })
    .limit(20);

  const adoption = adoptionList.data || [];

  // Load executive reports (Z04)
  const reportsList = await supabase
    .from('guardian_executive_reports')
    .select('id, created_at')
    .eq('tenant_id', ctx.tenantId)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  const executive = {
    reportsLast90d: reportsList.data?.length || 0,
  };

  // Load latest goal KPIs (Z08)
  const kpisList = await supabase
    .from('guardian_program_kpi_snapshots')
    .select('kpi_id, status, target_value, current_value')
    .eq('tenant_id', ctx.tenantId)
    .order('evaluated_at', { ascending: false })
    .limit(20);

  const goalsOkrs = (kpisList.data || []).map((k: any) => ({
    kpi_key: k.kpi_id,
    status: k.status,
    target_value: k.target_value,
    current_value: k.current_value,
  }));

  return {
    readiness,
    editions,
    uplift,
    adoption,
    executive,
    goalsOkrs,
  };
}

// ===== PATTERN DERIVATION =====

/**
 * Derive all patterns for tenant from Z-series state
 */
export async function derivePatternsForTenant(
  ctx: GuardianKnowledgeHubContext
): Promise<GuardianMetaPattern[]> {
  const state = await loadKnowledgeStateForTenant(ctx);

  const patterns: GuardianMetaPattern[] = [];

  if (state.readiness) {
    patterns.push(...deriveReadinessPatterns(state.readiness as any));
  }

  patterns.push(...deriveAdoptionPatterns(state.adoption));
  patterns.push(...deriveEditionPatterns(state.editions));
  patterns.push(...deriveUpliftPatterns(state.uplift || { activePlans: 0, tasksDone: 0, tasksTotal: 0 }));

  if (state.executive) {
    patterns.push(...deriveExecutivePatterns(state.executive));
  }

  if (state.goalsOkrs.length > 0) {
    patterns.push(...deriveGoalsOkrsPatterns(state.goalsOkrs));
  }

  // Sort by severity: high, moderate, info
  const severityOrder = { high: 0, moderate: 1, info: 2 };
  patterns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return patterns;
}

// ===== KNOWLEDGE HUB ASSEMBLY =====

/**
 * Build complete Knowledge Hub summary with patterns and suggested playbooks
 */
export async function buildKnowledgeHubSummary(
  ctx: GuardianKnowledgeHubContext
): Promise<GuardianKnowledgeHubSummary> {
  const patterns = await derivePatternsForTenant(ctx);
  const matchResults = await matchPatternsToPlaybooks(ctx.tenantId, patterns);

  // De-duplicate playbooks across patterns
  const playbookMap = new Map<string, GuardianPlaybookSummary>();
  const playbookToPatterns = new Map<string, string[]>();

  matchResults.forEach(({ pattern, playbooks }) => {
    playbooks.forEach((pb) => {
      if (!playbookMap.has(pb.id)) {
        playbookMap.set(pb.id, pb);
        playbookToPatterns.set(pb.id, []);
      }
      playbookToPatterns.get(pb.id)!.push(pattern.key);
    });
  });

  const suggestedPlaybooks = Array.from(playbookMap.values()).map((pb) => ({
    id: pb.id,
    key: pb.key,
    title: pb.title,
    summary: pb.summary,
    domains: [pb.category],
    matchedPatterns: playbookToPatterns.get(pb.id) || [],
  }));

  return {
    patterns,
    suggestedPlaybooks,
    patternCount: patterns.length,
    playbookCount: suggestedPlaybooks.length,
  };
}

/**
 * Get patterns by severity level
 */
export function getPatternsBySeverity(
  patterns: GuardianMetaPattern[],
  severity: 'info' | 'moderate' | 'high'
): GuardianMetaPattern[] {
  return patterns.filter((p) => p.severity === severity);
}

/**
 * Get patterns by domain
 */
export function getPatternsByDomain(
  patterns: GuardianMetaPattern[],
  domain: string
): GuardianMetaPattern[] {
  return patterns.filter((p) => p.domain === domain);
}

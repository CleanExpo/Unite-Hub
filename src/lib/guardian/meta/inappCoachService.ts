import { getSupabaseServer } from '@/lib/supabase';
import { loadLatestAdoptionScoresForTenant } from '@/lib/guardian/meta/adoptionScoringService';
import { GuardianAdoptionScore } from '@/lib/guardian/meta/adoptionScoringService';
import { GuardianAdoptionStatus } from '@/lib/guardian/meta/adoptionModel';

/**
 * In-app coach nudge definition
 */
export interface GuardianNudgeDefinition {
  nudgeKey: string;
  title: string;
  bodyTemplate: string;
  category: 'onboarding' | 'activation' | 'expansion' | 'habit' | 'health';
  severity: 'info' | 'tip' | 'important';
  priority: 'low' | 'medium' | 'high';
  dimension: string;
  subDimension: string;
  trigger: {
    minScore?: number;
    maxScore?: number;
    statusEquals?: GuardianAdoptionStatus;
    requiresCapabilityKey?: string;
    requiresEditionKey?: string;
    requiresOpenRecommendations?: boolean;
    requiresOpenUpliftTasks?: boolean;
  };
  cta?: string; // Call-to-action text
  ctaTarget?: string; // Target route
  defaultExpiryDays?: number;
}

/**
 * Canonical nudge definitions
 * Declarative triggers for adoption coaching
 */
export const NUDGE_DEFINITIONS: GuardianNudgeDefinition[] = [
  {
    nudgeKey: 'run_first_simulation',
    title: 'Try Your First Simulation',
    bodyTemplate: 'Test your rules and alert configurations with Guardian simulations. No production impact — just safe, rapid validation.',
    category: 'onboarding',
    severity: 'tip',
    priority: 'high',
    dimension: 'qa_chaos',
    subDimension: 'simulation_runs',
    trigger: {
      statusEquals: 'inactive',
      maxScore: 10,
    },
    cta: 'Open Simulation Studio',
    ctaTarget: '/app/guardian/qa/simulations',
    defaultExpiryDays: 30,
  },

  {
    nudgeKey: 'enable_network_intelligence',
    title: 'Join the Guardian Network',
    bodyTemplate: 'Enable network intelligence to benchmark your Guardian health against peer organizations and receive early warnings of emerging issues.',
    category: 'activation',
    severity: 'important',
    priority: 'high',
    dimension: 'network_intelligence',
    subDimension: 'network_console',
    trigger: {
      maxScore: 20,
      statusEquals: 'inactive',
    },
    cta: 'Enable Network Features',
    ctaTarget: '/app/guardian/settings/network',
    defaultExpiryDays: 30,
  },

  {
    nudgeKey: 'action_open_recommendations',
    title: 'Review Network Recommendations',
    bodyTemplate: 'You have open recommendations from the Guardian network. Implementing these can improve your alert coverage and reduce blind spots.',
    category: 'expansion',
    severity: 'tip',
    priority: 'medium',
    dimension: 'network_intelligence',
    subDimension: 'recommendations',
    trigger: {
      maxScore: 50,
      requiresOpenRecommendations: true,
    },
    cta: 'View Recommendations',
    ctaTarget: '/app/guardian/network/recommendations',
    defaultExpiryDays: 14,
  },

  {
    nudgeKey: 'close_uplift_tasks',
    title: 'Complete Your Adoption Plan',
    bodyTemplate: 'You have an active adoption plan with pending tasks. Completing these will unlock new Guardian capabilities and improve your readiness.',
    category: 'habit',
    severity: 'tip',
    priority: 'medium',
    dimension: 'meta',
    subDimension: 'uplift_tasks',
    trigger: {
      statusEquals: 'light',
      requiresOpenUpliftTasks: true,
    },
    cta: 'View Uplift Plan',
    ctaTarget: '/app/guardian/admin/readiness',
    defaultExpiryDays: 21,
  },

  {
    nudgeKey: 'generate_executive_report',
    title: 'Generate Your Monthly Report',
    bodyTemplate: 'It's time to check in on your Guardian health. A monthly executive report will show your progress and highlight next steps.',
    category: 'habit',
    severity: 'info',
    priority: 'low',
    dimension: 'meta',
    subDimension: 'executive_reports',
    trigger: {
      maxScore: 50,
    },
    cta: 'Generate Report',
    ctaTarget: '/app/guardian/admin/executive',
    defaultExpiryDays: 30,
  },

  {
    nudgeKey: 'improve_qa_coverage',
    title: 'Improve Your QA Coverage',
    bodyTemplate: 'Your QA coverage has critical blind spots. Running more simulation scenarios will help identify and fix these gaps.',
    category: 'habit',
    severity: 'important',
    priority: 'high',
    dimension: 'qa_chaos',
    subDimension: 'qa_coverage',
    trigger: {
      maxScore: 60,
    },
    cta: 'View Coverage Map',
    ctaTarget: '/app/guardian/qa/coverage',
    defaultExpiryDays: 30,
  },
];

/**
 * Check if a nudge trigger condition is met
 */
function checkNudgeTrigger(
  trigger: GuardianNudgeDefinition['trigger'],
  score: GuardianAdoptionScore,
  context?: { hasOpenRecommendations?: boolean; hasOpenUpliftTasks?: boolean }
): boolean {
  if (trigger.minScore !== undefined && score.score < trigger.minScore) return false;
  if (trigger.maxScore !== undefined && score.score > trigger.maxScore) return false;
  if (trigger.statusEquals && score.status !== trigger.statusEquals) return false;
  if (trigger.requiresOpenRecommendations && !context?.hasOpenRecommendations) return false;
  if (trigger.requiresOpenUpliftTasks && !context?.hasOpenUpliftTasks) return false;
  return true;
}

/**
 * Generate relevant nudges for a tenant (no DB writes)
 */
export async function generateNudgesForTenant(
  tenantId: string
): Promise<GuardianNudgeDefinition[]> {
  const supabase = getSupabaseServer();

  try {
    // Load latest adoption scores
    const scores = await loadLatestAdoptionScoresForTenant(tenantId);
    if (!scores.length) return [];

    // Load context data
    const { count: openRecsCount } = await supabase
      .from('guardian_network_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'open');

    const { count: openTasksCount } = await supabase
      .from('guardian_tenant_uplift_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'in_progress', 'blocked']);

    const context = {
      hasOpenRecommendations: (openRecsCount || 0) > 0,
      hasOpenUpliftTasks: (openTasksCount || 0) > 0,
    };

    // Match nudges against scores and context
    const relevantNudges: GuardianNudgeDefinition[] = [];
    const seenKeys = new Set<string>();

    NUDGE_DEFINITIONS.forEach((nudgeDef) => {
      // Deduplication
      if (seenKeys.has(nudgeDef.nudgeKey)) return;

      // Find matching score
      const matchingScore = scores.find(
        (s) =>
          s.dimension === nudgeDef.dimension &&
          s.subDimension === nudgeDef.subDimension
      );

      if (!matchingScore) return;

      // Check trigger conditions
      if (checkNudgeTrigger(nudgeDef.trigger, matchingScore, context)) {
        relevantNudges.push(nudgeDef);
        seenKeys.add(nudgeDef.nudgeKey);
      }
    });

    // Sort by priority
    return relevantNudges.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  } catch (error) {
    console.error('Failed to generate nudges:', error);
    return [];
  }
}

/**
 * Upsert nudges: create new, update existing, expire old
 */
export async function upsertInappNudgesForTenant(tenantId: string): Promise<void> {
  const supabase = getSupabaseServer();
  const now = new Date();

  try {
    // Generate current nudges
    const relevantNudges = await generateNudgesForTenant(tenantId);

    // Load existing nudges (pending or shown)
    const { data: existingNudges } = await supabase
      .from('guardian_inapp_coach_nudges')
      .select('nudge_key, id')
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'shown']);

    const existingKeys = new Set((existingNudges || []).map((n: any) => n.nudge_key));

    // Insert new nudges
    const newNudges = relevantNudges
      .filter((n) => !existingKeys.has(n.nudgeKey))
      .map((n) => ({
        tenant_id: tenantId,
        nudge_key: n.nudgeKey,
        title: n.title,
        body: n.bodyTemplate,
        category: n.category,
        severity: n.severity,
        priority: n.priority,
        status: 'pending',
        context: {
          dimension: n.dimension,
          subDimension: n.subDimension,
          ctaTarget: n.ctaTarget,
        },
        expiry_at: n.defaultExpiryDays
          ? new Date(now.getTime() + n.defaultExpiryDays * 24 * 60 * 60 * 1000).toISOString()
          : null,
        metadata: {},
      }));

    if (newNudges.length > 0) {
      const { error: insertError } = await supabase
        .from('guardian_inapp_coach_nudges')
        .insert(newNudges);
      if (insertError) throw insertError;
    }

    // Auto-dismiss expired nudges
    const { error: expireError } = await supabase
      .from('guardian_inapp_coach_nudges')
      .update({ status: 'dismissed' })
      .eq('tenant_id', tenantId)
      .lt('expiry_at', now.toISOString())
      .in('status', ['pending', 'shown']);

    if (expireError) throw expireError;
  } catch (error) {
    console.error('Failed to upsert nudges:', error);
  }
}

/**
 * Load active nudges for a tenant
 */
export async function loadActiveNudgesForTenant(
  tenantId: string,
  limit: number = 10
): Promise<any[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_inapp_coach_nudges')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'shown'])
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data || [];
}

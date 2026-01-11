/**
 * Guardian Z02: Uplift Plan Generation Service
 *
 * Generates tenant-scoped uplift plans from readiness (Z01) and
 * network recommendations (X06). Advisory-only; never modifies configuration.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { GuardianCapabilityReadinessResult } from './readinessComputationService';
import { matchPlaybooksForReadiness, matchPlaybooksForRecommendations } from './upliftPlaybookModel';

/**
 * Options for plan generation
 */
export interface GuardianUpliftPlanGenerationOptions {
  now?: Date;
  includeRecommendations?: boolean;
  nameOverride?: string;
  descriptionOverride?: string;
}

/**
 * Uplift plan draft
 */
export interface GuardianUpliftPlanDraft {
  name: string;
  description?: string;
  status: 'draft';
  targetOverallScore?: number;
  targetOverallStatus?: string;
  readinessSnapshotAt: Date;
  source: 'manual' | 'auto_from_readiness' | 'mixed';
  metadata: Record<string, unknown>;
}

/**
 * Uplift task draft
 */
export interface GuardianUpliftTaskDraft {
  capabilityKey?: string;
  recommendationId?: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: 'todo';
  effortEstimate?: string;
  dueDate?: string;
  owner?: string;
  hints: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

/**
 * Load latest readiness snapshot for a tenant
 */
async function loadLatestReadinessSnapshotForTenant(
  tenantId: string
): Promise<{
  computedAt: Date;
  overallScore: number;
  overallStatus: string;
  capabilities: GuardianCapabilityReadinessResult[];
} | null> {
  const supabase = getSupabaseServer();

  const { data: latestScores } = await supabase
    .from('guardian_tenant_readiness_scores')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('computed_at', { ascending: false })
    .limit(50);

  if (!latestScores || latestScores.length === 0) {
    return null;
  }

  const latestComputedAt = latestScores[0].computed_at;
  const snapshot = latestScores.filter((s) => s.computed_at === latestComputedAt);

  return {
    computedAt: new Date(latestComputedAt),
    overallScore: snapshot[0].overall_guardian_score ?? 0,
    overallStatus: snapshot[0].overall_status ?? 'baseline',
    capabilities: snapshot.map((s) => ({
      capabilityKey: s.capability_key,
      score: s.score,
      status: s.status,
      details: s.details,
    })),
  };
}

/**
 * Load recent recommendations for a tenant
 */
async function loadRecentRecommendationSummaryForTenant(
  tenantId: string
): Promise<Array<{ recommendationType: string; suggestionTheme?: string }>> {
  const supabase = getSupabaseServer();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recs } = await supabase
    .from('guardian_network_recommendations')
    .select('recommendation_type, suggestion_theme')
    .eq('workspace_id', tenantId)
    .eq('status', 'open')
    .gte('created_at', sevenDaysAgo);

  return (recs || []).map((r) => ({
    recommendationType: r.recommendation_type,
    suggestionTheme: r.suggestion_theme,
  }));
}

/**
 * Calculate target score and status for uplift
 */
function calculateUpliftTarget(
  currentScore: number,
  currentStatus: string
): { targetScore: number; targetStatus: string } {
  const statusProgression = ['baseline', 'operational', 'mature', 'network_intelligent'];
  const currentIndex = statusProgression.indexOf(currentStatus);

  if (currentIndex < 0) {
    return { targetScore: Math.min(currentScore + 15, 100), targetStatus: 'baseline' };
  }

  // Move to next maturity level, or increase score within current level
  const nextIndex = Math.min(currentIndex + 1, statusProgression.length - 1);
  const nextStatus = statusProgression[nextIndex];

  // Calculate score increase: move towards next bracket
  const scoreIncrement = nextIndex > currentIndex ? 20 : 10;
  const targetScore = Math.min(currentScore + scoreIncrement, 100);

  return { targetScore, targetStatus: nextStatus };
}

/**
 * Generate uplift plan draft
 */
export async function generateUpliftPlanDraft(
  tenantId: string,
  options: GuardianUpliftPlanGenerationOptions = {}
): Promise<{
  plan: GuardianUpliftPlanDraft;
  tasks: GuardianUpliftTaskDraft[];
}> {
  const now = options.now ?? new Date();

  // Load readiness snapshot
  const readiness = await loadLatestReadinessSnapshotForTenant(tenantId);

  if (!readiness) {
    // No readiness data yet; return minimal plan
    return {
      plan: {
        name: options.nameOverride ?? 'Get Started with Guardian',
        description:
          options.descriptionOverride ?? 'No readiness data yet. Compute readiness first to generate uplift suggestions.',
        status: 'draft',
        readinessSnapshotAt: now,
        source: 'manual',
        metadata: {},
      },
      tasks: [],
    };
  }

  // Match playbooks
  const readinessPlaybooks = matchPlaybooksForReadiness(readiness.capabilities, readiness.overallScore);

  let recPlaybooks = [];
  if (options.includeRecommendations) {
    const recs = await loadRecentRecommendationSummaryForTenant(tenantId);
    recPlaybooks = matchPlaybooksForRecommendations(recs);
  }

  // Combine and deduplicate playbooks
  const allPlaybookIds = new Set<string>();
  const selectedPlaybooks = [];
  for (const pb of [...readinessPlaybooks, ...recPlaybooks]) {
    if (!allPlaybookIds.has(pb.id)) {
      allPlaybookIds.add(pb.id);
      selectedPlaybooks.push(pb);
    }
  }

  // Collect tasks from playbooks, deduplicate by title
  const taskMap = new Map<string, GuardianUpliftTaskDraft>();
  for (const playbook of selectedPlaybooks) {
    for (const taskTemplate of playbook.tasks) {
      const key = taskTemplate.title;
      if (!taskMap.has(key)) {
        taskMap.set(key, {
          capabilityKey: taskTemplate.capabilityKey,
          title: taskTemplate.title,
          description: taskTemplate.description,
          category: taskTemplate.category,
          priority: taskTemplate.priority,
          status: 'todo',
          effortEstimate: taskTemplate.effortEstimate,
          hints: {
            ...taskTemplate.hints,
            linkTargets: taskTemplate.linkTargets,
          },
          metadata: {},
        });
      }
    }
  }

  const tasks = Array.from(taskMap.values());

  // Calculate uplift target
  const { targetScore, targetStatus } = calculateUpliftTarget(readiness.overallScore, readiness.overallStatus);

  // Build plan draft
  const plan: GuardianUpliftPlanDraft = {
    name:
      options.nameOverride ??
      `Uplift Plan: ${readiness.overallStatus} → ${targetStatus} (Target ${targetScore}/100)`,
    description:
      options.descriptionOverride ??
      `Guided adoption plan to move from ${readiness.overallStatus} (${readiness.overallScore}/100) to ${targetStatus} (${targetScore}/100) maturity.`,
    status: 'draft',
    targetOverallScore: targetScore,
    targetOverallStatus: targetStatus,
    readinessSnapshotAt: readiness.computedAt,
    source: selectedPlaybooks.length > 0 ? 'auto_from_readiness' : 'manual',
    metadata: {
      playbooks_matched: selectedPlaybooks.map((p) => p.id),
      recommendations_included: options.includeRecommendations ?? false,
    },
  };

  return { plan, tasks };
}

/**
 * Persist generated uplift plan
 */
export async function persistGeneratedUpliftPlan(
  tenantId: string,
  planDraft: GuardianUpliftPlanDraft,
  taskDrafts: GuardianUpliftTaskDraft[]
): Promise<{ planId: string }> {
  const supabase = getSupabaseServer();

  // Insert plan
  const { data: planRows, error: planError } = await supabase
    .from('guardian_tenant_uplift_plans')
    .insert({
      tenant_id: tenantId,
      name: planDraft.name,
      description: planDraft.description,
      status: planDraft.status,
      target_overall_score: planDraft.targetOverallScore,
      target_overall_status: planDraft.targetOverallStatus,
      readiness_snapshot_at: planDraft.readinessSnapshotAt,
      source: planDraft.source,
      metadata: planDraft.metadata,
    })
    .select('id');

  if (planError || !planRows || planRows.length === 0) {
    throw planError ?? new Error('Failed to insert plan');
  }

  const planId = planRows[0].id;

  // Insert tasks
  if (taskDrafts.length > 0) {
    const { error: tasksError } = await supabase.from('guardian_tenant_uplift_tasks').insert(
      taskDrafts.map((task) => ({
        tenant_id: tenantId,
        plan_id: planId,
        capability_key: task.capabilityKey,
        recommendation_id: task.recommendationId,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        effort_estimate: task.effortEstimate,
        due_date: task.dueDate,
        owner: task.owner,
        hints: task.hints,
        metadata: task.metadata,
      }))
    );

    if (tasksError) {
      throw tasksError;
    }
  }

  console.log(`✓ Persisted uplift plan ${planId} with ${taskDrafts.length} tasks for tenant ${tenantId}`);

  return { planId };
}

/**
 * Full workflow: generate and persist
 */
export async function generateAndPersistUpliftPlanForTenant(
  tenantId: string,
  options: GuardianUpliftPlanGenerationOptions = {}
): Promise<{ planId: string }> {
  const draft = await generateUpliftPlanDraft(tenantId, options);
  return persistGeneratedUpliftPlan(tenantId, draft.plan, draft.tasks);
}

export async function loadLatestUpliftPlanForTenant(
  tenantId: string
): Promise<{ id: string; title: string; status: string; createdAt: Date } | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("guardian_tenant_uplift_plans")
    .select("id, name, status, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
throw error;
}
  if (!data) {
return null;
}

  return {
    id: data.id,
    title: data.name,
    status: data.status,
    createdAt: new Date(data.created_at),
  };
}

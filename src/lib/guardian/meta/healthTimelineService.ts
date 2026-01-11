import { getSupabaseServer } from '@/lib/supabase';
import {
  GuardianReadinessSnapshot,
  GuardianCapabilitySnapshot,
  GuardianCapabilityStatus,
} from '@/lib/guardian/readiness/readinessModel';
import {
  GuardianEditionFitResult,
} from '@/lib/guardian/meta/editionFitService';
import {
  GuardianUpliftPlan,
  GuardianUpliftTask,
} from '@/lib/guardian/meta/upliftPlanModel';

/**
 * Timeline event types with standardized structure
 */
export interface HealthTimelinePoint {
  id?: string;
  tenantId: string;
  occurredAt: Date;
  source: string; // 'readiness', 'edition_fit', 'uplift', 'network', 'qa', 'governance', 'meta'
  label: string; // Human-readable event name
  category: string; // 'core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance', 'meta'
  metricKey?: string | null; // e.g., 'readiness_overall_score', 'edition_fit_core'
  metricValue?: number | null; // e.g., 75, 60
  narrativeSnippet?: string | null; // Human-readable summary, no PII
  relatedIds: Record<string, string | number>; // { readiness_snapshot_id, edition_fit_id, etc. }
  metadata?: Record<string, any>;
  createdAt?: Date;
}

/**
 * Compute timeline events from readiness snapshots
 * Detects status changes, score deltas, and capability milestones
 */
export function generateTimelinePointsFromReadiness(
  tenantId: string,
  currentSnapshot: GuardianReadinessSnapshot,
  previousSnapshot: GuardianReadinessSnapshot | null
): HealthTimelinePoint[] {
  const points: HealthTimelinePoint[] = [];
  const now = new Date();

  // 1. Overall readiness score delta
  if (previousSnapshot) {
    const scoreDelta = currentSnapshot.overallScore - previousSnapshot.overallScore;
    if (Math.abs(scoreDelta) >= 5) {
      // Only record if delta >= 5 points
      points.push({
        tenantId,
        occurredAt: now,
        source: 'readiness',
        label: `Readiness ${scoreDelta > 0 ? 'improved' : 'declined'}`,
        category: 'core',
        metricKey: 'readiness_overall_score',
        metricValue: currentSnapshot.overallScore,
        narrativeSnippet: `Readiness score moved from ${previousSnapshot.overallScore} to ${currentSnapshot.overallScore} (${scoreDelta > 0 ? '+' : ''}${scoreDelta})`,
        relatedIds: {
          current_snapshot_id: currentSnapshot.id || 'unknown',
          previous_snapshot_id: previousSnapshot.id || 'unknown',
        },
        metadata: {
          current_status: currentSnapshot.overallStatus,
          previous_status: previousSnapshot.overallStatus,
          score_delta: scoreDelta,
          percentage_change: ((scoreDelta / previousSnapshot.overallScore) * 100).toFixed(1),
        },
      });
    }

    // 2. Status transition (baseline → operational → mature → network_intelligent)
    if (currentSnapshot.overallStatus !== previousSnapshot.overallStatus) {
      points.push({
        tenantId,
        occurredAt: now,
        source: 'readiness',
        label: `Status transitioned to ${currentSnapshot.overallStatus}`,
        category: 'core',
        narrativeSnippet: `Guardian status changed from ${previousSnapshot.overallStatus} to ${currentSnapshot.overallStatus}`,
        relatedIds: {
          snapshot_id: currentSnapshot.id || 'unknown',
        },
        metadata: {
          from_status: previousSnapshot.overallStatus,
          to_status: currentSnapshot.overallStatus,
        },
      });
    }
  }

  // 3. Individual capability milestones (reaching "ready" or "mature" status)
  currentSnapshot.capabilities.forEach((cap) => {
    const prevCap = previousSnapshot?.capabilities.find(
      (c) => c.capabilityKey === cap.capabilityKey
    );

    // Check if capability just reached "ready" status
    if (
      cap.status === 'ready' &&
      prevCap &&
      prevCap.status !== 'ready' &&
      prevCap.status !== 'mature'
    ) {
      points.push({
        tenantId,
        occurredAt: now,
        source: 'readiness',
        label: `${cap.capabilityKey} reached ready status`,
        category: 'core',
        metricKey: `capability_${cap.capabilityKey}_score`,
        metricValue: cap.score,
        narrativeSnippet: `${cap.capabilityKey} is now ready (score: ${cap.score})`,
        relatedIds: {
          snapshot_id: currentSnapshot.id || 'unknown',
          capability_key: cap.capabilityKey,
        },
      });
    }

    // Check if capability reached "mature" status
    if (cap.status === 'mature' && prevCap && prevCap.status !== 'mature') {
      points.push({
        tenantId,
        occurredAt: now,
        source: 'readiness',
        label: `${cap.capabilityKey} reached mature status`,
        category: 'core',
        metricKey: `capability_${cap.capabilityKey}_score`,
        metricValue: cap.score,
        narrativeSnippet: `${cap.capabilityKey} is now mature (score: ${cap.score})`,
        relatedIds: {
          snapshot_id: currentSnapshot.id || 'unknown',
          capability_key: cap.capabilityKey,
        },
      });
    }
  });

  return points;
}

/**
 * Generate timeline events from edition fit snapshots
 * Detects edition alignment changes and fit transitions
 */
export function generateTimelinePointsFromEditionFit(
  tenantId: string,
  currentFits: GuardianEditionFitResult[],
  previousFits: GuardianEditionFitResult[] | null
): HealthTimelinePoint[] {
  const points: HealthTimelinePoint[] = [];
  const now = new Date();

  currentFits.forEach((fit) => {
    const prevFit = previousFits?.find((f) => f.editionKey === fit.editionKey);

    // Overall fit score change
    if (prevFit && Math.abs(fit.overallFitScore - prevFit.overallFitScore) >= 5) {
      const scoreDelta = fit.overallFitScore - prevFit.overallFitScore;
      points.push({
        tenantId,
        occurredAt: now,
        source: 'edition_fit',
        label: `${fit.editionKey} fit ${scoreDelta > 0 ? 'improved' : 'declined'}`,
        category: 'meta',
        metricKey: `edition_fit_${fit.editionKey}`,
        metricValue: fit.overallFitScore,
        narrativeSnippet: `${fit.editionKey} fit moved from ${prevFit.overallFitScore} to ${fit.overallFitScore} (${scoreDelta > 0 ? '+' : ''}${scoreDelta})`,
        relatedIds: {
          edition_key: fit.editionKey,
        },
        metadata: {
          current_status: fit.status,
          previous_status: prevFit.status,
          score_delta: scoreDelta,
        },
      });
    }

    // Status transition (not_started → emerging → aligned → exceeds)
    if (prevFit && fit.status !== prevFit.status) {
      points.push({
        tenantId,
        occurredAt: now,
        source: 'edition_fit',
        label: `${fit.editionKey} fit status changed to ${fit.status}`,
        category: 'meta',
        narrativeSnippet: `${fit.editionKey} alignment moved from ${prevFit.status} to ${fit.status}`,
        relatedIds: {
          edition_key: fit.editionKey,
        },
        metadata: {
          from_status: prevFit.status,
          to_status: fit.status,
        },
      });
    }

    // Gap closure (capability gaps resolved)
    if (prevFit && prevFit.gaps.length > fit.gaps.length) {
      const closedCount = prevFit.gaps.length - fit.gaps.length;
      points.push({
        tenantId,
        occurredAt: now,
        source: 'edition_fit',
        label: `${fit.editionKey}: ${closedCount} gap(s) closed`,
        category: 'meta',
        metricKey: `edition_${fit.editionKey}_gaps_closed`,
        metricValue: closedCount,
        narrativeSnippet: `${fit.editionKey} edition closed ${closedCount} gap(s); remaining: ${fit.gaps.length}`,
        relatedIds: {
          edition_key: fit.editionKey,
        },
        metadata: {
          closed_count: closedCount,
          remaining_gaps: fit.gaps.length,
          resolved_gaps: prevFit.gaps
            .filter((g) => !fit.gaps.some((ng) => ng.capabilityKey === g.capabilityKey))
            .map((g) => g.capabilityKey),
        },
      });
    }
  });

  return points;
}

/**
 * Generate timeline events from uplift plan progress
 * Detects task completions, plan status changes, and adoption milestones
 */
export function generateTimelinePointsFromUplift(
  tenantId: string,
  currentPlan: GuardianUpliftPlan,
  previousPlan: GuardianUpliftPlan | null,
  currentTasks: GuardianUpliftTask[],
  previousTasks: GuardianUpliftTask[] | null
): HealthTimelinePoint[] {
  const points: HealthTimelinePoint[] = [];
  const now = new Date();

  // 1. Plan status change
  if (previousPlan && currentPlan.status !== previousPlan.status) {
    points.push({
      tenantId,
      occurredAt: now,
      source: 'uplift',
      label: `Uplift plan status changed to ${currentPlan.status}`,
      category: 'core',
      narrativeSnippet: `Uplift plan "${currentPlan.title}" moved from ${previousPlan.status} to ${currentPlan.status}`,
      relatedIds: {
        uplift_plan_id: currentPlan.id,
      },
      metadata: {
        plan_title: currentPlan.title,
        from_status: previousPlan.status,
        to_status: currentPlan.status,
      },
    });
  }

  // 2. Task completion milestone
  const completedCount = currentTasks.filter((t) => t.status === 'completed').length;
  const prevCompletedCount = previousTasks
    ? previousTasks.filter((t) => t.status === 'completed').length
    : 0;

  if (completedCount > prevCompletedCount) {
    const newCompleted = completedCount - prevCompletedCount;
    const completionPct = ((completedCount / currentTasks.length) * 100).toFixed(0);
    points.push({
      tenantId,
      occurredAt: now,
      source: 'uplift',
      label: `${newCompleted} uplift task(s) completed`,
      category: 'core',
      metricKey: 'uplift_tasks_completed',
      metricValue: completedCount,
      narrativeSnippet: `${currentPlan.title}: Completed ${newCompleted} task(s); overall progress: ${completionPct}%`,
      relatedIds: {
        uplift_plan_id: currentPlan.id,
      },
      metadata: {
        plan_title: currentPlan.title,
        new_completed: newCompleted,
        total_completed: completedCount,
        total_tasks: currentTasks.length,
        completion_percentage: parseFloat(completionPct),
      },
    });
  }

  // 3. Plan completion
  if (completedCount === currentTasks.length && completedCount > 0) {
    points.push({
      tenantId,
      occurredAt: now,
      source: 'uplift',
      label: `Uplift plan "${currentPlan.title}" fully completed`,
      category: 'core',
      narrativeSnippet: `All tasks in "${currentPlan.title}" have been completed`,
      relatedIds: {
        uplift_plan_id: currentPlan.id,
      },
      metadata: {
        plan_title: currentPlan.title,
        total_tasks: currentTasks.length,
      },
    });
  }

  return points;
}

/**
 * Persist timeline points to database (append-only)
 */
export async function persistTimelinePoints(
  tenantId: string,
  points: HealthTimelinePoint[]
): Promise<void> {
  if (points.length === 0) return;

  const supabase = getSupabaseServer();

  const { error } = await supabase.from('guardian_health_timeline_points').insert(
    points.map((p) => ({
      tenant_id: p.tenantId,
      occurred_at: p.occurredAt.toISOString(),
      source: p.source,
      label: p.label,
      category: p.category,
      metric_key: p.metricKey || null,
      metric_value: p.metricValue || null,
      narrative_snippet: p.narrativeSnippet || null,
      related_ids: p.relatedIds,
      metadata: p.metadata || {},
    }))
  );

  if (error) throw error;
}

/**
 * Load recent timeline for a tenant (last N days)
 */
export async function loadRecentTimeline(
  tenantId: string,
  daysPast: number = 90
): Promise<HealthTimelinePoint[]> {
  const supabase = getSupabaseServer();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysPast);

  const { data, error } = await supabase
    .from('guardian_health_timeline_points')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('occurred_at', cutoff.toISOString())
    .order('occurred_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    tenantId: row.tenant_id,
    occurredAt: new Date(row.occurred_at),
    source: row.source,
    label: row.label,
    category: row.category,
    metricKey: row.metric_key,
    metricValue: row.metric_value,
    narrativeSnippet: row.narrative_snippet,
    relatedIds: row.related_ids,
    metadata: row.metadata,
    createdAt: new Date(row.created_at),
  }));
}

/**
 * Load timeline by category (for filtering/visualization)
 */
export async function loadTimelineByCategory(
  tenantId: string,
  category: string,
  daysPast: number = 90
): Promise<HealthTimelinePoint[]> {
  const supabase = getSupabaseServer();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysPast);

  const { data, error } = await supabase
    .from('guardian_health_timeline_points')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('category', category)
    .gte('occurred_at', cutoff.toISOString())
    .order('occurred_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    tenantId: row.tenant_id,
    occurredAt: new Date(row.occurred_at),
    source: row.source,
    label: row.label,
    category: row.category,
    metricKey: row.metric_key,
    metricValue: row.metric_value,
    narrativeSnippet: row.narrative_snippet,
    relatedIds: row.related_ids,
    metadata: row.metadata,
    createdAt: new Date(row.created_at),
  }));
}

/**
 * Project timeline forward (forecast next period based on trends)
 * Returns potential future milestone dates
 */
export function projectTimelineForward(
  tenantId: string,
  recentTimeline: HealthTimelinePoint[],
  daysForward: number = 30
): Array<{
  projectedDate: Date;
  label: string;
  category: string;
  confidence: number; // 0-1
  narrativeSnippet: string;
}> {
  const projections: Array<{
    projectedDate: Date;
    label: string;
    category: string;
    confidence: number;
    narrativeSnippet: string;
  }> = [];

  // 1. Readiness score trend
  const readinessEvents = recentTimeline.filter(
    (p) => p.source === 'readiness' && p.metricKey === 'readiness_overall_score'
  );

  if (readinessEvents.length >= 2) {
    const scores = readinessEvents.map((e) => ({ date: e.occurredAt, score: e.metricValue || 0 }));
    const velocityPerDay = (scores[0].score - scores[scores.length - 1].score) / daysForward;

    if (velocityPerDay > 0) {
      const currentScore = scores[0].score || 0;
      const projectedScore = Math.min(100, currentScore + velocityPerDay * daysForward);

      // Predict when readiness will hit 80 (mature target)
      if (currentScore < 80 && projectedScore >= 80) {
        const daysToTarget = (80 - currentScore) / velocityPerDay;
        projections.push({
          projectedDate: new Date(Date.now() + daysToTarget * 24 * 60 * 60 * 1000),
          label: 'Readiness target (80 - mature)',
          category: 'core',
          confidence: 0.6,
          narrativeSnippet: `Based on current trends, readiness should reach mature level (80+)`,
        });
      }
    }
  }

  // 2. Edition fit trend
  const editionFitEvents = recentTimeline.filter((p) => p.source === 'edition_fit');
  if (editionFitEvents.length > 0) {
    const statusCounts = {
      not_started: editionFitEvents.filter((e) => e.metadata?.to_status === 'not_started').length,
      emerging: editionFitEvents.filter((e) => e.metadata?.to_status === 'emerging').length,
      aligned: editionFitEvents.filter((e) => e.metadata?.to_status === 'aligned').length,
      exceeds: editionFitEvents.filter((e) => e.metadata?.to_status === 'exceeds').length,
    };

    // If multiple editions moving to aligned/exceeds, predict cohesion milestone
    if (statusCounts.aligned + statusCounts.exceeds >= 2) {
      projections.push({
        projectedDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        label: 'Possible full edition ecosystem alignment',
        category: 'meta',
        confidence: 0.5,
        narrativeSnippet: `Multiple editions are aligning; cohesion milestone may be approaching`,
      });
    }
  }

  // 3. Uplift velocity
  const upliftEvents = recentTimeline.filter(
    (p) => p.source === 'uplift' && p.metricKey === 'uplift_tasks_completed'
  );

  if (upliftEvents.length >= 2) {
    const tasksCompleted = upliftEvents.slice(0, 2);
    const timeDiffDays =
      (tasksCompleted[0].occurredAt.getTime() - tasksCompleted[1].occurredAt.getTime()) /
      (24 * 60 * 60 * 1000);
    const tasksPerDay = (tasksCompleted[0].metricValue || 0) / timeDiffDays;

    if (tasksPerDay > 0) {
      projections.push({
        projectedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        label: 'Expected completion of current uplift plan',
        category: 'core',
        confidence: 0.4,
        narrativeSnippet: `At current pace, uplift plan completion expected in ~30 days`,
      });
    }
  }

  return projections.sort((a, b) => a.projectedDate.getTime() - b.projectedDate.getTime());
}

/**
 * Self-Healing Service
 *
 * Core service for managing self-healing jobs and patches.
 * Integrates with observability layer and Founder OS approval engine.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { classifyError, ClassifiedError, ErrorCategory, ErrorSeverity, isProductionCritical } from './errorClassifier';

// ============================================
// TYPES
// ============================================

export interface SelfHealingJob {
  id: string;
  route: string;
  error_signature: string;
  error_category: ErrorCategory;
  severity: ErrorSeverity;
  status: JobStatus;
  occurrences: number;
  last_seen_at: string;
  first_seen_at: string;
  related_observability_log_ids: string[];
  related_anomaly_ids: string[];
  ai_summary: string | null;
  ai_recommended_actions: string | null;
  created_at: string;
  updated_at: string;
}

export interface SelfHealingPatch {
  id: string;
  job_id: string;
  patch_type: PatchType;
  description: string;
  files_changed: string[];
  sql_migration_path: string | null;
  sandbox_branch: string;
  ai_diff_proposal: string | null;
  ai_patch_payload: unknown;
  confidence_score: number;
  status: PatchStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SelfHealingDecision {
  id: string;
  job_id: string;
  patch_id: string | null;
  decision: DecisionType;
  decision_by: string | null;
  decision_reason: string | null;
  created_at: string;
}

export type JobStatus =
  | 'PENDING'
  | 'ANALYSING'
  | 'PATCH_GENERATED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'APPLIED_SANDBOX'
  | 'APPLIED_MAIN'
  | 'REJECTED'
  | 'FAILED';

export type PatchType = 'FILE_EDIT' | 'SQL_MIGRATION' | 'CONFIG_CHANGE' | 'TEST_FIX';

export type PatchStatus =
  | 'PROPOSED'
  | 'VALIDATED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'APPLIED_SANDBOX'
  | 'APPLIED_MAIN'
  | 'REJECTED'
  | 'FAILED';

export type DecisionType = 'APPROVED' | 'REJECTED' | 'APPLY_SANDBOX' | 'APPLY_MAIN' | 'DEFERRED';

// ============================================
// SERVICE CLASS
// ============================================

export class SelfHealingService {
  /**
   * Record an error and create/update a self-healing job
   */
  async recordErrorAndCreateJob(input: {
    route: string;
    method?: string;
    statusCode?: number;
    errorMessage?: string;
    stack?: string;
    observabilityLogId?: string;
  }): Promise<SelfHealingJob | null> {
    const classified = classifyError({
      route: input.route,
      method: input.method,
      statusCode: input.statusCode,
      errorMessage: input.errorMessage,
      stack: input.stack,
    });

    try {
      const supabase = await getSupabaseServer();

      // Use upsert function for deduplication
      const { data: jobId, error: rpcError } = await supabase.rpc('upsert_self_healing_job', {
        p_route: input.route,
        p_error_signature: classified.signature,
        p_error_category: classified.category,
        p_severity: classified.severity,
        p_ai_summary: classified.summary,
        p_observability_log_id: input.observabilityLogId ?? null,
      });

      if (rpcError) {
        console.error('[SelfHealingService] RPC error:', rpcError);
        return null;
      }

      // Fetch the job
      const { data: job, error: fetchError } = await supabase
        .from('self_healing_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError) {
        console.error('[SelfHealingService] Fetch error:', fetchError);
        return null;
      }

      // Log critical errors immediately
      if (isProductionCritical(classified)) {
        console.warn(`[SelfHealingService] CRITICAL error detected: ${classified.category} at ${input.route}`);
      }

      return job as SelfHealingJob;
    } catch (err) {
      console.error('[SelfHealingService] Error creating job:', err);
      return null;
    }
  }

  /**
   * Attach a patch proposal to a job
   */
  async attachPatch(
    jobId: string,
    patch: {
      patchType: PatchType;
      description: string;
      filesChanged: string[];
      sqlMigrationPath?: string;
      aiDiffProposal?: string;
      aiPatchPayload?: unknown;
      confidenceScore?: number;
    }
  ): Promise<SelfHealingPatch | null> {
    try {
      const supabase = await getSupabaseServer();

      const { data, error } = await supabase
        .from('self_healing_patches')
        .insert({
          job_id: jobId,
          patch_type: patch.patchType,
          description: patch.description,
          files_changed: patch.filesChanged,
          sql_migration_path: patch.sqlMigrationPath ?? null,
          ai_diff_proposal: patch.aiDiffProposal ?? null,
          ai_patch_payload: patch.aiPatchPayload ?? null,
          confidence_score: patch.confidenceScore ?? 0.7,
          status: 'PROPOSED',
        })
        .select('*')
        .single();

      if (error) {
        console.error('[SelfHealingService] Attach patch error:', error);
        return null;
      }

      // Update job status
      await this.markStatus(jobId, 'PATCH_GENERATED');

      return data as SelfHealingPatch;
    } catch (err) {
      console.error('[SelfHealingService] Error attaching patch:', err);
      return null;
    }
  }

  /**
   * Update job status
   */
  async markStatus(jobId: string, status: JobStatus): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      const { error } = await supabase
        .from('self_healing_jobs')
        .update({ status })
        .eq('id', jobId);

      if (error) {
        console.error('[SelfHealingService] Mark status error:', error);
      }
    } catch (err) {
      console.error('[SelfHealingService] Error marking status:', err);
    }
  }

  /**
   * Update patch status
   */
  async markPatchStatus(patchId: string, status: PatchStatus): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      const { error } = await supabase
        .from('self_healing_patches')
        .update({ status })
        .eq('id', patchId);

      if (error) {
        console.error('[SelfHealingService] Mark patch status error:', error);
      }
    } catch (err) {
      console.error('[SelfHealingService] Error marking patch status:', err);
    }
  }

  /**
   * Record a founder decision
   */
  async recordDecision(
    jobId: string,
    decision: DecisionType,
    userId?: string,
    reason?: string,
    patchId?: string
  ): Promise<SelfHealingDecision | null> {
    try {
      const supabase = await getSupabaseServer();

      const { data, error } = await supabase
        .from('self_healing_decisions')
        .insert({
          job_id: jobId,
          patch_id: patchId ?? null,
          decision,
          decision_by: userId ?? null,
          decision_reason: reason ?? null,
        })
        .select('*')
        .single();

      if (error) {
        console.error('[SelfHealingService] Record decision error:', error);
        return null;
      }

      // Update job/patch status based on decision
      switch (decision) {
        case 'APPROVED':
          await this.markStatus(jobId, 'APPROVED');
          if (patchId) {
await this.markPatchStatus(patchId, 'APPROVED');
}
          break;
        case 'REJECTED':
          await this.markStatus(jobId, 'REJECTED');
          if (patchId) {
await this.markPatchStatus(patchId, 'REJECTED');
}
          break;
        case 'APPLY_SANDBOX':
          if (patchId) {
await this.markPatchStatus(patchId, 'APPLIED_SANDBOX');
}
          await this.markStatus(jobId, 'APPLIED_SANDBOX');
          break;
        case 'APPLY_MAIN':
          if (patchId) {
await this.markPatchStatus(patchId, 'APPLIED_MAIN');
}
          await this.markStatus(jobId, 'APPLIED_MAIN');
          break;
      }

      return data as SelfHealingDecision;
    } catch (err) {
      console.error('[SelfHealingService] Error recording decision:', err);
      return null;
    }
  }

  /**
   * List open (pending) jobs
   */
  async listOpenJobs(): Promise<SelfHealingJob[]> {
    try {
      const supabase = await getSupabaseServer();

      const { data, error } = await supabase
        .from('self_healing_jobs')
        .select('*')
        .in('status', ['PENDING', 'ANALYSING', 'PATCH_GENERATED', 'AWAITING_APPROVAL'])
        .order('severity', { ascending: false })
        .order('last_seen_at', { ascending: false });

      if (error) {
        console.error('[SelfHealingService] List jobs error:', error);
        return [];
      }

      return (data ?? []) as SelfHealingJob[];
    } catch (err) {
      console.error('[SelfHealingService] Error listing jobs:', err);
      return [];
    }
  }

  /**
   * Get job by ID with patches
   */
  async getJobWithPatches(jobId: string): Promise<{
    job: SelfHealingJob | null;
    patches: SelfHealingPatch[];
    decisions: SelfHealingDecision[];
  }> {
    try {
      const supabase = await getSupabaseServer();

      const [jobResult, patchesResult, decisionsResult] = await Promise.all([
        supabase.from('self_healing_jobs').select('*').eq('id', jobId).single(),
        supabase.from('self_healing_patches').select('*').eq('job_id', jobId).order('created_at', { ascending: false }),
        supabase.from('self_healing_decisions').select('*').eq('job_id', jobId).order('created_at', { ascending: false }),
      ]);

      return {
        job: jobResult.data as SelfHealingJob | null,
        patches: (patchesResult.data ?? []) as SelfHealingPatch[],
        decisions: (decisionsResult.data ?? []) as SelfHealingDecision[],
      };
    } catch (err) {
      console.error('[SelfHealingService] Error getting job:', err);
      return { job: null, patches: [], decisions: [] };
    }
  }

  /**
   * Get system health summary
   */
  async getHealthSummary(): Promise<{
    openJobs: number;
    criticalCount: number;
    highCount: number;
    pendingPatches: number;
    recentResolutions: number;
  }> {
    try {
      const supabase = await getSupabaseServer();

      const [openJobsResult, resolvedResult, patchesResult] = await Promise.all([
        supabase
          .from('self_healing_jobs')
          .select('severity', { count: 'exact' })
          .in('status', ['PENDING', 'ANALYSING', 'PATCH_GENERATED', 'AWAITING_APPROVAL']),
        supabase
          .from('self_healing_jobs')
          .select('id', { count: 'exact' })
          .in('status', ['APPLIED_MAIN', 'REJECTED'])
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('self_healing_patches')
          .select('id', { count: 'exact' })
          .in('status', ['PROPOSED', 'VALIDATED', 'AWAITING_APPROVAL']),
      ]);

      const openJobs = openJobsResult.data ?? [];
      const criticalCount = openJobs.filter((j: { severity: string }) => j.severity === 'CRITICAL').length;
      const highCount = openJobs.filter((j: { severity: string }) => j.severity === 'HIGH').length;

      return {
        openJobs: openJobsResult.count ?? 0,
        criticalCount,
        highCount,
        pendingPatches: patchesResult.count ?? 0,
        recentResolutions: resolvedResult.count ?? 0,
      };
    } catch (err) {
      console.error('[SelfHealingService] Error getting health summary:', err);
      return {
        openJobs: 0,
        criticalCount: 0,
        highCount: 0,
        pendingPatches: 0,
        recentResolutions: 0,
      };
    }
  }

  /**
   * Get jobs by category for analysis
   */
  async getJobsByCategory(): Promise<Record<ErrorCategory, number>> {
    try {
      const supabase = await getSupabaseServer();

      const { data, error } = await supabase
        .from('self_healing_jobs')
        .select('error_category')
        .in('status', ['PENDING', 'ANALYSING', 'PATCH_GENERATED', 'AWAITING_APPROVAL']);

      if (error || !data) {
        return {} as Record<ErrorCategory, number>;
      }

      const counts: Record<string, number> = {};
      for (const job of data) {
        const cat = job.error_category;
        counts[cat] = (counts[cat] || 0) + 1;
      }

      return counts as Record<ErrorCategory, number>;
    } catch (err) {
      console.error('[SelfHealingService] Error getting jobs by category:', err);
      return {} as Record<ErrorCategory, number>;
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const selfHealingService = new SelfHealingService();

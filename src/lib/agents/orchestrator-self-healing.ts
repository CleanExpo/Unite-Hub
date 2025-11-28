/**
 * Self-Healing Orchestrator Agent
 *
 * Integrates self-healing capabilities into AI Phill and the main orchestrator.
 * Allows natural language interaction about system health and proposed patches.
 */

import { selfHealingService, SelfHealingJob, SelfHealingPatch } from '@/lib/selfHealing';
import { classifyError, ClassifiedError, isProductionCritical } from '@/lib/selfHealing/errorClassifier';

// ============================================
// TYPES
// ============================================

export type SelfHealingIntent =
  | 'diagnose_system_issue'
  | 'list_self_healing_jobs'
  | 'get_job_details'
  | 'get_health_summary'
  | 'classify_error'
  | 'propose_patch';

export interface SelfHealingAgentInput {
  intent: SelfHealingIntent;
  params?: Record<string, unknown>;
}

export interface SelfHealingAgentOutput {
  success: boolean;
  intent: SelfHealingIntent;
  data?: unknown;
  message: string;
  actionRequired?: boolean;
}

// ============================================
// AGENT CLASS
// ============================================

export class SelfHealingOrchestratorAgent {
  /**
   * Handle a self-healing intent
   */
  async handle(input: SelfHealingAgentInput): Promise<SelfHealingAgentOutput> {
    switch (input.intent) {
      case 'diagnose_system_issue':
        return this.handleDiagnoseIssue(input.params);

      case 'list_self_healing_jobs':
        return this.handleListJobs();

      case 'get_job_details':
        return this.handleGetJobDetails(input.params?.jobId as string);

      case 'get_health_summary':
        return this.handleHealthSummary();

      case 'classify_error':
        return this.handleClassifyError(input.params);

      case 'propose_patch':
        return this.handleProposePatch(input.params);

      default:
        return {
          success: false,
          intent: input.intent,
          message: `Unknown self-healing intent: ${input.intent}`,
        };
    }
  }

  /**
   * Diagnose a system issue and create a job
   */
  private async handleDiagnoseIssue(
    params?: Record<string, unknown>
  ): Promise<SelfHealingAgentOutput> {
    if (!params?.route) {
      return {
        success: false,
        intent: 'diagnose_system_issue',
        message: 'Route is required to diagnose an issue',
      };
    }

    const job = await selfHealingService.recordErrorAndCreateJob({
      route: params.route as string,
      method: params.method as string | undefined,
      statusCode: params.statusCode as number | undefined,
      errorMessage: params.errorMessage as string | undefined,
      stack: params.stack as string | undefined,
      observabilityLogId: params.observabilityLogId as string | undefined,
    });

    if (!job) {
      return {
        success: false,
        intent: 'diagnose_system_issue',
        message: 'Failed to create self-healing job',
      };
    }

    const isCritical = job.severity === 'CRITICAL' || job.severity === 'HIGH';

    return {
      success: true,
      intent: 'diagnose_system_issue',
      data: job,
      message: isCritical
        ? `Created ${job.severity} priority self-healing job for ${job.route}. Category: ${job.error_category}. Immediate attention recommended.`
        : `Created self-healing job for ${job.route}. Category: ${job.error_category}. Severity: ${job.severity}.`,
      actionRequired: isCritical,
    };
  }

  /**
   * List open self-healing jobs
   */
  private async handleListJobs(): Promise<SelfHealingAgentOutput> {
    const jobs = await selfHealingService.listOpenJobs();

    if (jobs.length === 0) {
      return {
        success: true,
        intent: 'list_self_healing_jobs',
        data: { jobs: [], count: 0 },
        message: 'No open self-healing jobs. System appears healthy.',
      };
    }

    const criticalCount = jobs.filter((j) => j.severity === 'CRITICAL').length;
    const highCount = jobs.filter((j) => j.severity === 'HIGH').length;

    let summary = `Found ${jobs.length} open self-healing job${jobs.length > 1 ? 's' : ''}.`;
    if (criticalCount > 0) {
      summary += ` ${criticalCount} CRITICAL.`;
    }
    if (highCount > 0) {
      summary += ` ${highCount} HIGH.`;
    }

    // Group by category for summary
    const byCategory: Record<string, number> = {};
    for (const job of jobs) {
      byCategory[job.error_category] = (byCategory[job.error_category] || 0) + 1;
    }

    const categoryBreakdown = Object.entries(byCategory)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');

    return {
      success: true,
      intent: 'list_self_healing_jobs',
      data: { jobs, count: jobs.length, byCategory },
      message: `${summary} Categories: ${categoryBreakdown}`,
      actionRequired: criticalCount > 0,
    };
  }

  /**
   * Get job details with patches
   */
  private async handleGetJobDetails(jobId: string): Promise<SelfHealingAgentOutput> {
    if (!jobId) {
      return {
        success: false,
        intent: 'get_job_details',
        message: 'Job ID is required',
      };
    }

    const { job, patches, decisions } = await selfHealingService.getJobWithPatches(jobId);

    if (!job) {
      return {
        success: false,
        intent: 'get_job_details',
        message: `Job not found: ${jobId}`,
      };
    }

    const patchSummary =
      patches.length > 0
        ? `${patches.length} patch(es) proposed. Highest confidence: ${Math.max(...patches.map((p) => p.confidence_score)) * 100}%.`
        : 'No patches proposed yet.';

    return {
      success: true,
      intent: 'get_job_details',
      data: { job, patches, decisions },
      message: `Job: ${job.error_category} at ${job.route}. Status: ${job.status}. Occurrences: ${job.occurrences}. ${patchSummary}`,
    };
  }

  /**
   * Get overall health summary
   */
  private async handleHealthSummary(): Promise<SelfHealingAgentOutput> {
    const summary = await selfHealingService.getHealthSummary();
    const byCategory = await selfHealingService.getJobsByCategory();

    const isHealthy = summary.openJobs === 0;
    const hasCritical = summary.criticalCount > 0;

    let message: string;
    if (isHealthy) {
      message = `System is healthy. No open issues. ${summary.recentResolutions} issues resolved in the last 7 days.`;
    } else if (hasCritical) {
      message = `ATTENTION: ${summary.criticalCount} CRITICAL and ${summary.highCount} HIGH priority issues require review. ${summary.pendingPatches} patches awaiting approval.`;
    } else {
      message = `${summary.openJobs} open issues (${summary.highCount} high priority). ${summary.pendingPatches} pending patches. ${summary.recentResolutions} resolved recently.`;
    }

    return {
      success: true,
      intent: 'get_health_summary',
      data: { summary, byCategory },
      message,
      actionRequired: hasCritical,
    };
  }

  /**
   * Classify an error pattern
   */
  private async handleClassifyError(
    params?: Record<string, unknown>
  ): Promise<SelfHealingAgentOutput> {
    const classified = classifyError(params);

    return {
      success: true,
      intent: 'classify_error',
      data: classified,
      message: `Classified as ${classified.category} (${classified.severity}). ${classified.suggestedAction || ''}`,
      actionRequired: isProductionCritical(classified),
    };
  }

  /**
   * Propose a patch for a job
   */
  private async handleProposePatch(
    params?: Record<string, unknown>
  ): Promise<SelfHealingAgentOutput> {
    if (!params?.jobId || !params?.patchType || !params?.description) {
      return {
        success: false,
        intent: 'propose_patch',
        message: 'jobId, patchType, and description are required',
      };
    }

    const patch = await selfHealingService.attachPatch(params.jobId as string, {
      patchType: params.patchType as any,
      description: params.description as string,
      filesChanged: (params.filesChanged as string[]) || [],
      sqlMigrationPath: params.sqlMigrationPath as string | undefined,
      aiDiffProposal: params.aiDiffProposal as string | undefined,
      aiPatchPayload: params.aiPatchPayload,
      confidenceScore: params.confidenceScore as number | undefined,
    });

    if (!patch) {
      return {
        success: false,
        intent: 'propose_patch',
        message: 'Failed to create patch',
      };
    }

    return {
      success: true,
      intent: 'propose_patch',
      data: patch,
      message: `Proposed ${patch.patch_type} patch with ${Math.round(patch.confidence_score * 100)}% confidence. Awaiting founder approval.`,
    };
  }

  /**
   * Natural language query handler for AI Phill
   */
  async handleNaturalLanguageQuery(query: string): Promise<SelfHealingAgentOutput> {
    const lowerQuery = query.toLowerCase();

    // Intent detection from natural language
    if (lowerQuery.includes('what is broken') || lowerQuery.includes("what's broken")) {
      return this.handleListJobs();
    }

    if (lowerQuery.includes('system health') || lowerQuery.includes('health status')) {
      return this.handleHealthSummary();
    }

    if (lowerQuery.includes('open issues') || lowerQuery.includes('pending issues')) {
      return this.handleListJobs();
    }

    if (lowerQuery.includes('critical') && lowerQuery.includes('issues')) {
      const result = await this.handleListJobs();
      if (result.data && typeof result.data === 'object' && 'jobs' in result.data) {
        const jobs = (result.data as { jobs: SelfHealingJob[] }).jobs.filter(
          (j) => j.severity === 'CRITICAL'
        );
        return {
          ...result,
          data: { ...result.data, jobs },
          message:
            jobs.length > 0
              ? `Found ${jobs.length} CRITICAL issue(s) requiring immediate attention.`
              : 'No critical issues found.',
        };
      }
      return result;
    }

    // Default: return health summary
    return this.handleHealthSummary();
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const selfHealingAgent = new SelfHealingOrchestratorAgent();

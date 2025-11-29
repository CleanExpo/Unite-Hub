/**
 * Boost Bump Agent
 *
 * HUMAN_GOVERNED agent for coordinating organic search enhancement jobs.
 * All boost jobs require explicit human approval before execution.
 *
 * @module agents/boostBumpAgent
 */

import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { db } from '@/lib/db';
import {
  createBoostJob,
  getBoostJob,
  getBoostJobs,
  approveBoostJob,
  rejectBoostJob,
  scheduleBoost,
  startBoostJob,
  recordBoostResult,
  cancelBoostJob,
  getPerformanceSummary,
  getPendingApprovalJobs,
  getReadyToExecuteJobs,
  type BoostJob,
  type BoostType,
  type CreateBoostJobParams,
  type BoostMetrics,
  type PerformanceSummary,
} from '@/lib/boostBump/boostCoordinatorService';

// ============================================================================
// Types & Interfaces
// ============================================================================

// Use centralized lazy-initialized client
import { anthropic } from '@/lib/anthropic/client';

export interface BoostJobAnalysis {
  recommendedBoostType: BoostType;
  expectedImpact: 'high' | 'medium' | 'low';
  estimatedTimeframe: string;
  riskAssessment: string;
  keyOpportunities: string[];
  potentialChallenges: string[];
  strategicNotes: string;
}

export interface PerformanceInsights {
  summary: PerformanceSummary;
  topPerformingBoostTypes: Array<{
    boostType: BoostType;
    avgImprovement: number;
    successRate: number;
  }>;
  recommendations: string[];
  trendsAnalysis: string;
}

// ============================================================================
// Agent Functions
// ============================================================================

/**
 * Analyze a URL and keyword to recommend optimal boost strategy
 * ADVISORY ONLY - Does not execute anything
 */
export async function analyzeBoostOpportunity(
  url: string,
  keyword: string,
  geoTarget: string,
  currentRank?: number
): Promise<BoostJobAnalysis> {
  const systemPrompt = `You are an SEO strategist analyzing organic search optimization opportunities.
Analyze the provided website URL, target keyword, and current ranking to recommend a boost strategy.

Focus on legitimate, white-hat optimization techniques:
- Content quality improvements (E-E-A-T, depth, relevance)
- Technical SEO enhancements (speed, mobile, schema)
- User experience optimization (UX, engagement signals)
- Local visibility improvements (GMB, citations, reviews)
- Organic engagement growth (natural backlinks, social signals)

NEVER recommend manipulation, fake engagement, or black-hat techniques.

Return ONLY valid JSON with this structure:
{
  "recommendedBoostType": "organic_engagement" | "content_quality" | "user_experience" | "technical_seo" | "local_visibility",
  "expectedImpact": "high" | "medium" | "low",
  "estimatedTimeframe": "1-2 weeks" | "2-4 weeks" | "1-2 months" | "2-3 months",
  "riskAssessment": "<assessment of potential risks>",
  "keyOpportunities": ["<opportunity 1>", "<opportunity 2>"],
  "potentialChallenges": ["<challenge 1>", "<challenge 2>"],
  "strategicNotes": "<detailed strategic recommendations>"
}`;

  const userPrompt = `Analyze this SEO opportunity:

URL: ${url}
Target Keyword: ${keyword}
Geographic Target: ${geoTarget}
Current Rank: ${currentRank || 'Not ranking'}

Provide a strategic analysis and boost recommendation.`;

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    const responseText =
      result.data.content[0].type === 'text' ? result.data.content[0].text : '';

    // Parse JSON response
    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[BoostBumpAgent] Analysis error:', error);
    throw new Error(`Failed to analyze boost opportunity: ${error}`);
  }
}

/**
 * Create a new boost job (HUMAN_GOVERNED - requires approval)
 */
export async function createBoostJobWithAnalysis(
  businessId: string,
  url: string,
  keyword: string,
  geoTarget: { country: string; region?: string; city?: string },
  userId: string,
  options?: {
    priority?: number;
    description?: string;
    currentRank?: number;
  }
): Promise<{ job: BoostJob; analysis: BoostJobAnalysis }> {
  // First, analyze the opportunity
  const geoString = [geoTarget.city, geoTarget.region, geoTarget.country]
    .filter(Boolean)
    .join(', ');

  const analysis = await analyzeBoostOpportunity(
    url,
    keyword,
    geoString,
    options?.currentRank
  );

  // Create the boost job with AI-generated strategy notes
  const job = await createBoostJob({
    businessId,
    url,
    keyword,
    geoTarget,
    boostType: analysis.recommendedBoostType,
    description: options?.description,
    strategyNotes: analysis.strategicNotes,
    priority: options?.priority,
    createdBy: userId,
  });

  // Log to audit
  await db.auditLogs.create({
    workspace_id: businessId,
    action: 'boost_job_created',
    details: {
      jobId: job.id,
      url,
      keyword,
      boostType: analysis.recommendedBoostType,
      expectedImpact: analysis.expectedImpact,
      requiresApproval: true,
    },
  });

  return { job, analysis };
}

/**
 * Get pending approval jobs for human review
 */
export async function getPendingJobsForReview(
  businessId: string
): Promise<BoostJob[]> {
  return await getPendingApprovalJobs(businessId);
}

/**
 * Approve a boost job (HUMAN_GOVERNED)
 */
export async function approveJob(
  jobId: string,
  userId: string,
  approvalNotes?: string
): Promise<BoostJob> {
  const job = await approveBoostJob(jobId, userId, approvalNotes);

  await db.auditLogs.create({
    workspace_id: job.business_id,
    action: 'boost_job_approved',
    details: {
      jobId,
      approvedBy: userId,
      approvalNotes,
    },
  });

  return job;
}

/**
 * Reject a boost job (HUMAN_GOVERNED)
 */
export async function rejectJob(
  jobId: string,
  userId: string,
  reason: string
): Promise<BoostJob> {
  const job = await rejectBoostJob(jobId, userId, reason);

  await db.auditLogs.create({
    workspace_id: job.business_id,
    action: 'boost_job_rejected',
    details: {
      jobId,
      rejectedBy: userId,
      reason,
    },
  });

  return job;
}

/**
 * Schedule an approved boost job
 */
export async function scheduleJobExecution(
  jobId: string,
  scheduledDate: Date,
  userId: string
): Promise<BoostJob> {
  const job = await scheduleBoost(jobId, scheduledDate, userId);

  await db.auditLogs.create({
    workspace_id: job.business_id,
    action: 'boost_job_scheduled',
    details: {
      jobId,
      scheduledDate: scheduledDate.toISOString(),
      scheduledBy: userId,
    },
  });

  return job;
}

/**
 * Execute an approved boost job (HUMAN_GOVERNED - must be approved first)
 */
export async function executeApprovedBoost(
  jobId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const job = await getBoostJob(jobId);

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    if (job.status !== 'approved' && job.status !== 'scheduled') {
      return {
        success: false,
        error: `Cannot execute job with status: ${job.status}`,
      };
    }

    // Mark as in progress
    await startBoostJob(jobId, userId);

    // In a real implementation, this would trigger browser automation
    // or other boost execution logic. For now, we just mark it as started.

    await db.auditLogs.create({
      workspace_id: job.business_id,
      action: 'boost_job_started',
      details: {
        jobId,
        startedBy: userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[BoostBumpAgent] Execute error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Record boost job results
 */
export async function recordJobResults(
  jobId: string,
  beforeRank: number | null,
  afterRank: number | null,
  metrics: Partial<BoostMetrics>,
  userId: string
): Promise<BoostJob> {
  const job = await recordBoostResult(jobId, beforeRank, afterRank, metrics, userId);

  await db.auditLogs.create({
    workspace_id: job.business_id,
    action: 'boost_job_completed',
    details: {
      jobId,
      beforeRank,
      afterRank,
      rankImprovement: beforeRank && afterRank ? beforeRank - afterRank : null,
      completedBy: userId,
    },
  });

  return job;
}

/**
 * Cancel a boost job
 */
export async function cancelJob(
  jobId: string,
  userId: string,
  reason: string
): Promise<BoostJob> {
  const job = await cancelBoostJob(jobId, userId, reason);

  await db.auditLogs.create({
    workspace_id: job.business_id,
    action: 'boost_job_cancelled',
    details: {
      jobId,
      cancelledBy: userId,
      reason,
    },
  });

  return job;
}

/**
 * Analyze boost performance and generate insights
 */
export async function analyzeBoostResults(
  businessId: string
): Promise<PerformanceInsights> {
  const summary = await getPerformanceSummary(businessId);

  // Rank boost types by performance
  const topPerformingBoostTypes = Object.entries(summary.byBoostType)
    .map(([boostType, stats]) => ({
      boostType: boostType as BoostType,
      avgImprovement: stats.avgImprovement,
      successRate: stats.successRate,
    }))
    .sort((a, b) => b.avgImprovement - a.avgImprovement)
    .slice(0, 3);

  // Generate AI-powered recommendations
  const systemPrompt = `You are an SEO performance analyst. Analyze boost job performance data and provide strategic recommendations.

Return ONLY an array of 3-5 actionable recommendations as JSON:
["<recommendation 1>", "<recommendation 2>", ...]`;

  const userPrompt = `Performance Summary:
- Total Jobs: ${summary.totalJobs}
- Completed: ${summary.completedJobs}
- Success Rate: ${summary.successfulJobs}/${summary.completedJobs}
- Avg Rank Improvement: ${summary.avgRankImprovement.toFixed(1)}
- Trend: ${summary.recentTrend}

Top Performing Boost Types:
${topPerformingBoostTypes
  .map(
    (bt) =>
      `- ${bt.boostType}: ${bt.avgImprovement.toFixed(1)} avg improvement, ${bt.successRate.toFixed(1)}% success rate`
  )
  .join('\n')}

Provide 3-5 strategic recommendations for optimization.`;

  let recommendations: string[] = [];
  let trendsAnalysis = 'Performance data analysis in progress.';

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    const responseText =
      result.data.content[0].type === 'text' ? result.data.content[0].text : '';

    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/(\[[\s\S]*\])/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    recommendations = JSON.parse(cleanJson);
    trendsAnalysis = `Current trend: ${summary.recentTrend}. Average rank improvement: ${summary.avgRankImprovement.toFixed(1)} positions.`;
  } catch (error) {
    console.error('[BoostBumpAgent] Insights generation error:', error);
    recommendations = [
      'Continue monitoring boost job performance',
      'Focus on high-performing boost types',
      'Review failed jobs for improvement opportunities',
    ];
  }

  return {
    summary,
    topPerformingBoostTypes,
    recommendations,
    trendsAnalysis,
  };
}

/**
 * Get jobs ready to execute
 */
export async function getJobsReadyForExecution(
  businessId?: string
): Promise<BoostJob[]> {
  return await getReadyToExecuteJobs(businessId);
}

// Export singleton instance
export const boostBumpAgent = {
  analyzeBoostOpportunity,
  createBoostJobWithAnalysis,
  getPendingJobsForReview,
  approveJob,
  rejectJob,
  scheduleJobExecution,
  executeApprovedBoost,
  recordJobResults,
  cancelJob,
  analyzeBoostResults,
  getJobsReadyForExecution,
};

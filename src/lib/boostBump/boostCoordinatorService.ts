/**
 * Boost Coordinator Service - HUMAN_GOVERNED
 *
 * Coordinates Boost Bump jobs for organic search enhancement.
 * All jobs require human approval before execution.
 *
 * WARNING: This service coordinates legitimate organic engagement
 * optimization. All actions must be approved by humans and comply
 * with search engine guidelines.
 *
 * @module boostBump/boostCoordinatorService
 */

import { getSupabaseServer } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type BoostType =
  | 'organic_engagement'
  | 'content_quality'
  | 'user_experience'
  | 'technical_seo'
  | 'local_visibility';

export type BoostJobStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rejected';

export type GeoTarget = {
  country: string;
  region?: string;
  city?: string;
  radius_km?: number;
};

export interface BoostJob {
  id: string;
  business_id: string;
  url: string;
  keyword: string;
  geo_target: GeoTarget;
  boost_type: BoostType;
  status: BoostJobStatus;
  priority: number;
  description?: string;
  strategy_notes?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  before_rank?: number;
  after_rank?: number;
  metrics?: BoostMetrics;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BoostMetrics {
  impressions_before?: number;
  impressions_after?: number;
  clicks_before?: number;
  clicks_after?: number;
  ctr_before?: number;
  ctr_after?: number;
  avg_position_before?: number;
  avg_position_after?: number;
  organic_traffic_before?: number;
  organic_traffic_after?: number;
  bounce_rate_before?: number;
  bounce_rate_after?: number;
  time_on_page_before?: number;
  time_on_page_after?: number;
  pages_per_session_before?: number;
  pages_per_session_after?: number;
}

export interface CreateBoostJobParams {
  businessId: string;
  url: string;
  keyword: string;
  geoTarget: GeoTarget;
  boostType: BoostType;
  description?: string;
  strategyNotes?: string;
  priority?: number;
  createdBy: string;
}

export interface BoostJobFilters {
  status?: BoostJobStatus[];
  boost_type?: BoostType[];
  keyword?: string;
  url?: string;
  since?: string;
  until?: string;
}

export interface PerformanceSummary {
  totalJobs: number;
  completedJobs: number;
  successfulJobs: number;
  avgRankImprovement: number;
  avgCtrImprovement: number;
  avgTrafficImprovement: number;
  byBoostType: Record<BoostType, {
    count: number;
    avgImprovement: number;
    successRate: number;
  }>;
  byGeoTarget: Record<string, {
    count: number;
    avgImprovement: number;
  }>;
  recentTrend: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// Anthropic Client Setup
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

// ============================================================================
// Boost Coordinator Service
// ============================================================================

/**
 * Create a new boost job (HUMAN_GOVERNED - requires approval)
 */
export async function createBoostJob(params: CreateBoostJobParams): Promise<BoostJob> {
  const supabase = await getSupabaseServer();

  // Validate URL
  try {
    new URL(params.url);
  } catch {
    throw new Error('Invalid URL provided');
  }

  // Generate AI-powered strategy recommendations
  let strategyNotes = params.strategyNotes;
  if (!strategyNotes) {
    strategyNotes = await generateStrategyRecommendations(
      params.url,
      params.keyword,
      params.boostType,
      params.geoTarget
    );
  }

  const { data, error } = await supabase
    .from('boost_jobs')
    .insert({
      business_id: params.businessId,
      url: params.url,
      keyword: params.keyword,
      geo_target: params.geoTarget,
      boost_type: params.boostType,
      status: 'pending_approval', // Always requires approval
      priority: params.priority || 5,
      description: params.description,
      strategy_notes: strategyNotes,
      approval_required: true, // HUMAN_GOVERNED
      created_by: params.createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create boost job: ${error.message}`);

  // Log creation for audit
  await logBoostAction(data.id, 'created', params.createdBy, {
    url: params.url,
    keyword: params.keyword,
    boostType: params.boostType,
  });

  return mapJobFromDb(data);
}

/**
 * Get boost jobs for a business with optional filters
 */
export async function getBoostJobs(
  businessId: string,
  status?: BoostJobStatus | BoostJobStatus[],
  filters?: BoostJobFilters
): Promise<BoostJob[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('boost_jobs')
    .select('*')
    .eq('business_id', businessId);

  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    query = query.in('status', statuses);
  }

  if (filters?.boost_type?.length) {
    query = query.in('boost_type', filters.boost_type);
  }

  if (filters?.keyword) {
    query = query.ilike('keyword', `%${filters.keyword}%`);
  }

  if (filters?.url) {
    query = query.ilike('url', `%${filters.url}%`);
  }

  if (filters?.since) {
    query = query.gte('created_at', filters.since);
  }

  if (filters?.until) {
    query = query.lte('created_at', filters.until);
  }

  query = query.order('priority', { ascending: false })
               .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch boost jobs: ${error.message}`);
  return (data || []).map(mapJobFromDb);
}

/**
 * Get a single boost job by ID
 */
export async function getBoostJob(jobId: string): Promise<BoostJob | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('boost_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch boost job: ${error.message}`);
  }

  return mapJobFromDb(data);
}

/**
 * Schedule a boost job for execution (HUMAN_GOVERNED - requires prior approval)
 */
export async function scheduleBoost(
  jobId: string,
  scheduledAt: Date,
  userId: string
): Promise<BoostJob> {
  const supabase = await getSupabaseServer();

  // Verify job is approved
  const job = await getBoostJob(jobId);
  if (!job) throw new Error('Boost job not found');
  if (job.status !== 'approved') {
    throw new Error(`Cannot schedule job with status: ${job.status}. Job must be approved first.`);
  }

  const { data, error } = await supabase
    .from('boost_jobs')
    .update({
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw new Error(`Failed to schedule boost job: ${error.message}`);

  await logBoostAction(jobId, 'scheduled', userId, { scheduledAt: scheduledAt.toISOString() });

  return mapJobFromDb(data);
}

/**
 * Approve a boost job (HUMAN_GOVERNED)
 */
export async function approveBoostJob(
  jobId: string,
  userId: string,
  notes?: string
): Promise<BoostJob> {
  const supabase = await getSupabaseServer();

  const job = await getBoostJob(jobId);
  if (!job) throw new Error('Boost job not found');
  if (job.status !== 'pending_approval') {
    throw new Error(`Cannot approve job with status: ${job.status}`);
  }

  const { data, error } = await supabase
    .from('boost_jobs')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      strategy_notes: notes ? `${job.strategy_notes || ''}\n\nApproval Notes: ${notes}` : job.strategy_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw new Error(`Failed to approve boost job: ${error.message}`);

  await logBoostAction(jobId, 'approved', userId, { notes });

  return mapJobFromDb(data);
}

/**
 * Reject a boost job (HUMAN_GOVERNED)
 */
export async function rejectBoostJob(
  jobId: string,
  userId: string,
  reason: string
): Promise<BoostJob> {
  const supabase = await getSupabaseServer();

  const job = await getBoostJob(jobId);
  if (!job) throw new Error('Boost job not found');
  if (job.status !== 'pending_approval') {
    throw new Error(`Cannot reject job with status: ${job.status}`);
  }

  const { data, error } = await supabase
    .from('boost_jobs')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw new Error(`Failed to reject boost job: ${error.message}`);

  await logBoostAction(jobId, 'rejected', userId, { reason });

  return mapJobFromDb(data);
}

/**
 * Record boost job results
 */
export async function recordBoostResult(
  jobId: string,
  beforeRank: number | null,
  afterRank: number | null,
  metrics: Partial<BoostMetrics>,
  userId: string
): Promise<BoostJob> {
  const supabase = await getSupabaseServer();

  const job = await getBoostJob(jobId);
  if (!job) throw new Error('Boost job not found');

  // Determine success based on rank improvement
  const isSuccess = afterRank !== null && beforeRank !== null && afterRank < beforeRank;

  const { data, error } = await supabase
    .from('boost_jobs')
    .update({
      status: 'completed',
      before_rank: beforeRank,
      after_rank: afterRank,
      metrics: {
        ...job.metrics,
        ...metrics,
      },
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw new Error(`Failed to record boost result: ${error.message}`);

  await logBoostAction(jobId, 'completed', userId, {
    beforeRank,
    afterRank,
    rankImprovement: beforeRank && afterRank ? beforeRank - afterRank : null,
    isSuccess,
    metrics,
  });

  return mapJobFromDb(data);
}

/**
 * Mark job as in progress
 */
export async function startBoostJob(jobId: string, userId: string): Promise<BoostJob> {
  const supabase = await getSupabaseServer();

  const job = await getBoostJob(jobId);
  if (!job) throw new Error('Boost job not found');
  if (!['approved', 'scheduled'].includes(job.status)) {
    throw new Error(`Cannot start job with status: ${job.status}`);
  }

  const { data, error } = await supabase
    .from('boost_jobs')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw new Error(`Failed to start boost job: ${error.message}`);

  await logBoostAction(jobId, 'started', userId, {});

  return mapJobFromDb(data);
}

/**
 * Cancel a boost job
 */
export async function cancelBoostJob(jobId: string, userId: string, reason: string): Promise<BoostJob> {
  const supabase = await getSupabaseServer();

  const job = await getBoostJob(jobId);
  if (!job) throw new Error('Boost job not found');
  if (['completed', 'cancelled', 'rejected'].includes(job.status)) {
    throw new Error(`Cannot cancel job with status: ${job.status}`);
  }

  const { data, error } = await supabase
    .from('boost_jobs')
    .update({
      status: 'cancelled',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw new Error(`Failed to cancel boost job: ${error.message}`);

  await logBoostAction(jobId, 'cancelled', userId, { reason });

  return mapJobFromDb(data);
}

/**
 * Get performance summary for a business
 */
export async function getPerformanceSummary(businessId: string): Promise<PerformanceSummary> {
  const supabase = await getSupabaseServer();

  const { data: jobs } = await supabase
    .from('boost_jobs')
    .select('*')
    .eq('business_id', businessId);

  if (!jobs || jobs.length === 0) {
    return {
      totalJobs: 0,
      completedJobs: 0,
      successfulJobs: 0,
      avgRankImprovement: 0,
      avgCtrImprovement: 0,
      avgTrafficImprovement: 0,
      byBoostType: {} as Record<BoostType, { count: number; avgImprovement: number; successRate: number }>,
      byGeoTarget: {},
      recentTrend: 'stable',
    };
  }

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const successfulJobs = completedJobs.filter(j =>
    j.before_rank && j.after_rank && j.after_rank < j.before_rank
  );

  // Calculate averages
  let totalRankImprovement = 0;
  let totalCtrImprovement = 0;
  let totalTrafficImprovement = 0;
  let rankCount = 0;
  let ctrCount = 0;
  let trafficCount = 0;

  const byBoostType: Record<string, { count: number; improvements: number[]; successes: number }> = {};
  const byGeoTarget: Record<string, { count: number; improvements: number[] }> = {};

  for (const job of completedJobs) {
    // Rank improvement
    if (job.before_rank && job.after_rank) {
      const improvement = job.before_rank - job.after_rank;
      totalRankImprovement += improvement;
      rankCount++;

      // By boost type
      if (!byBoostType[job.boost_type]) {
        byBoostType[job.boost_type] = { count: 0, improvements: [], successes: 0 };
      }
      byBoostType[job.boost_type].count++;
      byBoostType[job.boost_type].improvements.push(improvement);
      if (improvement > 0) byBoostType[job.boost_type].successes++;

      // By geo target
      const geoKey = job.geo_target?.country || 'unknown';
      if (!byGeoTarget[geoKey]) {
        byGeoTarget[geoKey] = { count: 0, improvements: [] };
      }
      byGeoTarget[geoKey].count++;
      byGeoTarget[geoKey].improvements.push(improvement);
    }

    // CTR improvement
    if (job.metrics?.ctr_before && job.metrics?.ctr_after) {
      totalCtrImprovement += job.metrics.ctr_after - job.metrics.ctr_before;
      ctrCount++;
    }

    // Traffic improvement
    if (job.metrics?.organic_traffic_before && job.metrics?.organic_traffic_after) {
      const improvement = ((job.metrics.organic_traffic_after - job.metrics.organic_traffic_before) /
                          job.metrics.organic_traffic_before) * 100;
      totalTrafficImprovement += improvement;
      trafficCount++;
    }
  }

  // Calculate recent trend (last 10 jobs vs previous 10)
  const recentJobs = completedJobs.slice(0, 10);
  const olderJobs = completedJobs.slice(10, 20);
  let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';

  if (recentJobs.length >= 5 && olderJobs.length >= 5) {
    const recentAvg = recentJobs.reduce((sum, j) =>
      sum + ((j.before_rank || 0) - (j.after_rank || 0)), 0) / recentJobs.length;
    const olderAvg = olderJobs.reduce((sum, j) =>
      sum + ((j.before_rank || 0) - (j.after_rank || 0)), 0) / olderJobs.length;

    if (recentAvg > olderAvg + 1) recentTrend = 'improving';
    else if (recentAvg < olderAvg - 1) recentTrend = 'declining';
  }

  // Format by boost type
  const formattedByBoostType: Record<string, { count: number; avgImprovement: number; successRate: number }> = {};
  for (const [type, data] of Object.entries(byBoostType)) {
    formattedByBoostType[type] = {
      count: data.count,
      avgImprovement: data.improvements.length > 0
        ? data.improvements.reduce((a, b) => a + b, 0) / data.improvements.length
        : 0,
      successRate: data.count > 0 ? (data.successes / data.count) * 100 : 0,
    };
  }

  // Format by geo target
  const formattedByGeoTarget: Record<string, { count: number; avgImprovement: number }> = {};
  for (const [geo, data] of Object.entries(byGeoTarget)) {
    formattedByGeoTarget[geo] = {
      count: data.count,
      avgImprovement: data.improvements.length > 0
        ? data.improvements.reduce((a, b) => a + b, 0) / data.improvements.length
        : 0,
    };
  }

  return {
    totalJobs: jobs.length,
    completedJobs: completedJobs.length,
    successfulJobs: successfulJobs.length,
    avgRankImprovement: rankCount > 0 ? totalRankImprovement / rankCount : 0,
    avgCtrImprovement: ctrCount > 0 ? totalCtrImprovement / ctrCount : 0,
    avgTrafficImprovement: trafficCount > 0 ? totalTrafficImprovement / trafficCount : 0,
    byBoostType: formattedByBoostType as Record<BoostType, { count: number; avgImprovement: number; successRate: number }>,
    byGeoTarget: formattedByGeoTarget,
    recentTrend,
  };
}

/**
 * Get pending approval jobs for a business
 */
export async function getPendingApprovalJobs(businessId: string): Promise<BoostJob[]> {
  return getBoostJobs(businessId, 'pending_approval');
}

/**
 * Get scheduled jobs that are ready to execute
 */
export async function getReadyToExecuteJobs(businessId?: string): Promise<BoostJob[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('boost_jobs')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString());

  if (businessId) {
    query = query.eq('business_id', businessId);
  }

  query = query.order('scheduled_at', { ascending: true });

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch ready jobs: ${error.message}`);
  return (data || []).map(mapJobFromDb);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate AI-powered strategy recommendations for a boost job
 */
async function generateStrategyRecommendations(
  url: string,
  keyword: string,
  boostType: BoostType,
  geoTarget: GeoTarget
): Promise<string> {
  const systemPrompt = `You are an SEO strategist specializing in legitimate organic search optimization.
Generate actionable recommendations for improving search visibility through white-hat techniques.

Focus areas based on boost type:
- organic_engagement: Improve content quality, user engagement signals, dwell time
- content_quality: Content optimization, E-E-A-T signals, comprehensive coverage
- user_experience: Page speed, mobile optimization, accessibility
- technical_seo: Schema markup, crawlability, indexation
- local_visibility: Google Business Profile, local citations, reviews

Always recommend ethical, sustainable strategies that comply with search engine guidelines.
Never suggest manipulation, fake engagement, or any black-hat techniques.`;

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
            content: `Generate a strategy for improving organic visibility:

URL: ${url}
Target Keyword: ${keyword}
Boost Type: ${boostType}
Geographic Target: ${geoTarget.city || geoTarget.region || geoTarget.country}

Provide:
1. Current state assessment approach
2. Recommended optimization steps (prioritized)
3. Expected timeline for results
4. KPIs to track
5. Risk factors and mitigation`,
          },
        ],
      });
    });

    const responseText = result.data.content[0].type === 'text'
      ? result.data.content[0].text
      : '';

    return responseText;
  } catch (error) {
    console.error('Strategy generation error:', error);
    return 'Strategy recommendations unavailable. Please add manual notes.';
  }
}

/**
 * Log boost action for audit trail
 */
async function logBoostAction(
  jobId: string,
  action: string,
  userId: string,
  details: Record<string, unknown>
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase
    .from('boost_audit_logs')
    .insert({
      boost_job_id: jobId,
      action,
      performed_by: userId,
      details,
      created_at: new Date().toISOString(),
    })
    .then(({ error }) => {
      if (error) {
        console.error('Failed to log boost action:', error);
      }
    });
}

/**
 * Map database record to BoostJob interface
 */
function mapJobFromDb(data: Record<string, unknown>): BoostJob {
  return {
    id: data.id as string,
    business_id: data.business_id as string,
    url: data.url as string,
    keyword: data.keyword as string,
    geo_target: data.geo_target as GeoTarget,
    boost_type: data.boost_type as BoostType,
    status: data.status as BoostJobStatus,
    priority: data.priority as number,
    description: data.description as string | undefined,
    strategy_notes: data.strategy_notes as string | undefined,
    scheduled_at: data.scheduled_at as string | undefined,
    started_at: data.started_at as string | undefined,
    completed_at: data.completed_at as string | undefined,
    before_rank: data.before_rank as number | undefined,
    after_rank: data.after_rank as number | undefined,
    metrics: data.metrics as BoostMetrics | undefined,
    approval_required: data.approval_required as boolean,
    approved_by: data.approved_by as string | undefined,
    approved_at: data.approved_at as string | undefined,
    rejection_reason: data.rejection_reason as string | undefined,
    created_by: data.created_by as string,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

export default {
  createBoostJob,
  getBoostJobs,
  getBoostJob,
  scheduleBoost,
  approveBoostJob,
  rejectBoostJob,
  recordBoostResult,
  startBoostJob,
  cancelBoostJob,
  getPerformanceSummary,
  getPendingApprovalJobs,
  getReadyToExecuteJobs,
};

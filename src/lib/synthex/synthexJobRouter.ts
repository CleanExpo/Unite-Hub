/**
 * Synthex Job Router
 *
 * Routes synthex_project_jobs to appropriate AGI agents based on job_type.
 * Handles job creation, queueing, and status management.
 *
 * Supported job types:
 * - initial_launch_pack: First-time setup (website, social, email foundation)
 * - content_batch: Bulk content generation
 * - seo_launch: SEO research and page generation
 * - geo_pages: Location-based pages
 * - review_campaign: Google/Trustpilot review campaign
 * - monthly_report: Analytics and performance report
 * - email_sequence: Email campaign sequence
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase.types';

type SynthexProjectJob = Database['public']['Tables']['synthex_project_jobs']['Row'];
type SynthexJobResults = Database['public']['Tables']['synthex_job_results']['Row'];

// ============================================================================
// JOB TYPE DEFINITIONS
// ============================================================================

export interface JobTypeDefinition {
  jobType: string;
  label: string;
  description: string;
  assignedAgent: string;
  estimatedDurationMinutes: number;
  requiredFields: string[];
  resultTypes: string[];
}

export const JOB_TYPES: Record<string, JobTypeDefinition> = {
  initial_launch_pack: {
    jobType: 'initial_launch_pack',
    label: 'Initial Launch Pack',
    description: 'Complete first-time setup with website foundation, social templates, and email starter',
    assignedAgent: 'coordination_agent',
    estimatedDurationMinutes: 120,
    requiredFields: ['brand_name', 'industry', 'primary_domain'],
    resultTypes: ['content_generated', 'social_posts', 'email_sequence'],
  },
  content_batch: {
    jobType: 'content_batch',
    label: 'Content Batch Generation',
    description: 'Generate 5-10 pieces of marketing content',
    assignedAgent: 'content_agent',
    estimatedDurationMinutes: 30,
    requiredFields: ['brand_name', 'content_types', 'count'],
    resultTypes: ['content_generated'],
  },
  seo_launch: {
    jobType: 'seo_launch',
    label: 'SEO Launch Campaign',
    description: 'Research SEO keywords, create optimized pages',
    assignedAgent: 'research_agent',
    estimatedDurationMinutes: 60,
    requiredFields: ['primary_domain', 'target_keywords'],
    resultTypes: ['seo_pages', 'content_generated'],
  },
  geo_pages: {
    jobType: 'geo_pages',
    label: 'Location Pages',
    description: 'Generate location-specific landing pages',
    assignedAgent: 'content_agent',
    estimatedDurationMinutes: 45,
    requiredFields: ['locations', 'service_name'],
    resultTypes: ['seo_pages'],
  },
  review_campaign: {
    jobType: 'review_campaign',
    label: 'Review Campaign',
    description: 'Create email/SMS sequence requesting customer reviews',
    assignedAgent: 'content_agent',
    estimatedDurationMinutes: 20,
    requiredFields: ['review_platforms'],
    resultTypes: ['email_sequence', 'review_campaigns'],
  },
  monthly_report: {
    jobType: 'monthly_report',
    label: 'Monthly Report',
    description: 'Generate analytics summary and optimization recommendations',
    assignedAgent: 'analysis_agent',
    estimatedDurationMinutes: 40,
    requiredFields: ['month'],
    resultTypes: ['analysis_report'],
  },
  email_sequence: {
    jobType: 'email_sequence',
    label: 'Email Sequence',
    description: 'Create multi-email campaign sequence',
    assignedAgent: 'content_agent',
    estimatedDurationMinutes: 25,
    requiredFields: ['email_type', 'email_count'],
    resultTypes: ['email_sequence'],
  },
};

// ============================================================================
// JOB CREATION & VALIDATION
// ============================================================================

/**
 * Create a new job for a tenant
 */
export async function createJob(input: {
  tenantId: string;
  brandId?: string;
  jobType: string;
  payload: Record<string, any>;
}): Promise<{ jobId: string; error?: string }> {
  const jobDef = JOB_TYPES[input.jobType];

  if (!jobDef) {
    return { jobId: '', error: `Unknown job type: ${input.jobType}` };
  }

  // Validate required fields
  const missingFields = jobDef.requiredFields.filter((field) => !(field in input.payload));
  if (missingFields.length > 0) {
    return {
      jobId: '',
      error: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }

  const { data: job, error } = await supabaseAdmin
    .from('synthex_project_jobs')
    .insert({
      tenant_id: input.tenantId,
      brand_id: input.brandId,
      job_type: input.jobType,
      payload_json: input.payload,
      status: 'pending',
      assigned_agent: jobDef.assignedAgent,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    return { jobId: '', error: error.message };
  }

  return { jobId: job.id };
}

/**
 * Get job definition
 */
export function getJobDefinition(jobType: string): JobTypeDefinition | null {
  return JOB_TYPES[jobType] || null;
}

/**
 * Get all available job types
 */
export function getAllJobTypes(): JobTypeDefinition[] {
  return Object.values(JOB_TYPES);
}

// ============================================================================
// JOB STATUS & RETRIEVAL
// ============================================================================

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<SynthexProjectJob | null> {
  const { data: job } = await supabaseAdmin
    .from('synthex_project_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  return job || null;
}

/**
 * Get jobs for a tenant with filters
 */
export async function getJobsForTenant(
  tenantId: string,
  filters?: {
    status?: string;
    jobType?: string;
    limit?: number;
  }
): Promise<SynthexProjectJob[]> {
  let query = supabaseAdmin.from('synthex_project_jobs').select('*').eq('tenant_id', tenantId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.jobType) {
    query = query.eq('job_type', filters.jobType);
  }

  const { data: jobs } = await query
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 50);

  return jobs || [];
}

/**
 * Get jobs pending processing
 */
export async function getPendingJobs(limit: number = 10): Promise<SynthexProjectJob[]> {
  const { data: jobs } = await supabaseAdmin
    .from('synthex_project_jobs')
    .select('*')
    .in('status', ['pending', 'queued'])
    .order('created_at', { ascending: true })
    .limit(limit);

  return jobs || [];
}

// ============================================================================
// JOB STATUS UPDATES
// ============================================================================

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled',
  errorMessage?: string
): Promise<boolean> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'running') {
    updates.started_at = new Date().toISOString();
  }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { error } = await supabaseAdmin
    .from('synthex_project_jobs')
    .update(updates)
    .eq('id', jobId);

  return !error;
}

// ============================================================================
// JOB RESULT STORAGE
// ============================================================================

/**
 * Store job result
 */
export async function storeJobResult(
  jobId: string,
  resultType: string,
  resultData: Record<string, any>,
  error?: Record<string, any>
): Promise<boolean> {
  const { error: dbError } = await supabaseAdmin.from('synthex_job_results').insert({
    job_id: jobId,
    result_type: resultType,
    result_json: resultData,
    error_json: error,
    created_at: new Date().toISOString(),
  });

  return !dbError;
}

/**
 * Get job results
 */
export async function getJobResults(jobId: string): Promise<SynthexJobResults[]> {
  const { data: results } = await supabaseAdmin
    .from('synthex_job_results')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  return results || [];
}

/**
 * Get latest result of a specific type
 */
export async function getLatestResultByType(
  jobId: string,
  resultType: string
): Promise<SynthexJobResults | null> {
  const { data: result } = await supabaseAdmin
    .from('synthex_job_results')
    .select('*')
    .eq('job_id', jobId)
    .eq('result_type', resultType)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return result || null;
}

// ============================================================================
// JOB ROUTING LOGIC (Interface for AGI agents)
// ============================================================================

/**
 * Process a job by routing to the appropriate agent
 * This is called by the background job processor/cron
 * Returns the agent payload to be sent to the AGI layer
 */
export async function routeJobToAgent(jobId: string): Promise<{
  agentName: string;
  agentPayload: Record<string, any>;
  error?: string;
}> {
  const job = await getJob(jobId);
  if (!job) {
    return { agentName: '', agentPayload: {}, error: 'Job not found' };
  }

  const jobDef = JOB_TYPES[job.job_type];
  if (!jobDef) {
    return { agentName: '', agentPayload: {}, error: `Unknown job type: ${job.job_type}` };
  }

  // Get tenant and brand info for context
  const { data: tenant } = await supabaseAdmin
    .from('synthex_tenants')
    .select('*')
    .eq('id', job.tenant_id)
    .single();

  const { data: brand } = job.brand_id
    ? await supabaseAdmin.from('synthex_brands').select('*').eq('id', job.brand_id).single()
    : { data: null };

  if (!tenant) {
    return { agentName: '', agentPayload: {}, error: 'Tenant not found' };
  }

  // Build agent payload with brand context
  const agentPayload: Record<string, any> = {
    jobId,
    jobType: job.job_type,
    tenantId: job.tenant_id,
    tenant: {
      businessName: tenant.business_name,
      industry: tenant.industry,
      region: tenant.region,
    },
    ...job.payload_json,
  };

  if (brand) {
    agentPayload.brand = {
      brandName: brand.brand_name,
      primaryDomain: brand.primary_domain,
      primaryPlatform: brand.primary_platform,
      tagline: brand.tagline,
      valueProposition: brand.value_proposition,
      targetAudience: brand.target_audience,
      toneVoice: brand.tone_voice,
    };
  }

  return {
    agentName: jobDef.assignedAgent,
    agentPayload,
  };
}

// ============================================================================
// JOB STATISTICS & ANALYTICS
// ============================================================================

/**
 * Get job statistics for a tenant
 */
export async function getJobStatistics(tenantId: string): Promise<{
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  averageCompletionTimeMinutes: number;
  jobsByType: Record<string, number>;
}> {
  const { data: jobs } = await supabaseAdmin
    .from('synthex_project_jobs')
    .select('job_type, status, created_at, completed_at')
    .eq('tenant_id', tenantId);

  if (!jobs || jobs.length === 0) {
    return {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      pendingJobs: 0,
      averageCompletionTimeMinutes: 0,
      jobsByType: {},
    };
  }

  const stats = {
    totalJobs: jobs.length,
    completedJobs: jobs.filter((j) => j.status === 'completed').length,
    failedJobs: jobs.filter((j) => j.status === 'failed').length,
    pendingJobs: jobs.filter((j) => j.status === 'pending' || j.status === 'queued').length,
    averageCompletionTimeMinutes: 0,
    jobsByType: {} as Record<string, number>,
  };

  // Calculate average completion time
  const completedWithTime = jobs.filter((j) => j.status === 'completed' && j.completed_at);
  if (completedWithTime.length > 0) {
    const totalTime = completedWithTime.reduce((sum, j) => {
      const created = new Date(j.created_at).getTime();
      const completed = new Date(j.completed_at!).getTime();
      return sum + (completed - created);
    }, 0);
    stats.averageCompletionTimeMinutes = Math.round(totalTime / completedWithTime.length / 60000);
  }

  // Count jobs by type
  for (const job of jobs) {
    stats.jobsByType[job.job_type] = (stats.jobsByType[job.job_type] || 0) + 1;
  }

  return stats;
}

/**
 * Get system-wide job statistics
 */
export async function getGlobalJobStatistics(): Promise<{
  totalJobsAllTenants: number;
  totalCompletedJobs: number;
  totalFailedJobs: number;
  totalPendingJobs: number;
  jobsLastHour: number;
  jobsLast24Hours: number;
  completionRate: number; // percentage
}> {
  const { data: jobs } = await supabaseAdmin
    .from('synthex_project_jobs')
    .select('status, created_at');

  if (!jobs) {
    return {
      totalJobsAllTenants: 0,
      totalCompletedJobs: 0,
      totalFailedJobs: 0,
      totalPendingJobs: 0,
      jobsLastHour: 0,
      jobsLast24Hours: 0,
      completionRate: 0,
    };
  }

  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  return {
    totalJobsAllTenants: jobs.length,
    totalCompletedJobs: jobs.filter((j) => j.status === 'completed').length,
    totalFailedJobs: jobs.filter((j) => j.status === 'failed').length,
    totalPendingJobs: jobs.filter((j) => j.status === 'pending' || j.status === 'queued').length,
    jobsLastHour: jobs.filter((j) => new Date(j.created_at).getTime() > oneHourAgo).length,
    jobsLast24Hours: jobs.filter((j) => new Date(j.created_at).getTime() > oneDayAgo).length,
    completionRate:
      jobs.length > 0
        ? Math.round((jobs.filter((j) => j.status === 'completed').length / jobs.length) * 100)
        : 0,
  };
}

// ============================================================================
// RETRY & ERROR HANDLING
// ============================================================================

/**
 * Retry a failed job
 */
export async function retryFailedJob(jobId: string): Promise<boolean> {
  const job = await getJob(jobId);
  if (!job || job.status !== 'failed') {
    return false;
  }

  return updateJobStatus(jobId, 'pending');
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  return updateJobStatus(jobId, 'cancelled');
}

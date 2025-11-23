/**
 * Job Queue Manager
 * Phase 50: Queue management for production jobs
 */

import { getSupabaseServer } from '@/lib/supabase';
import { updateJobStatus, ProductionJob, JobType, JobPriority } from './productionEngine';

// Import workflows
import { processContentJob } from './contentWorkflow';
import { processVisualJob } from './visualWorkflow';
import { processBrandJob } from './brandWorkflow';
import { processSocialJob } from './socialWorkflow';
import { processSeoJob } from './seoWorkflow';
import { processWebsiteJob } from './websiteWorkflow';
import { processVoiceJob } from './voiceScriptWorkflow';

// Priority weights for queue ordering
const PRIORITY_WEIGHTS: Record<JobPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * Queue a job for processing
 */
export async function queueJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  return updateJobStatus(jobId, 'queued');
}

/**
 * Get next job to process from queue
 */
export async function getNextJob(): Promise<{ success: boolean; job?: ProductionJob; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get oldest queued job, ordered by priority then creation time
    const { data, error } = await supabase
      .from('production_jobs')
      .select('*')
      .eq('status', 'queued')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, job: data };
  } catch (error) {
    console.error('Error getting next job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get next job',
    };
  }
}

/**
 * Get queue stats
 */
export async function getQueueStats(
  organizationId?: string
): Promise<{
  success: boolean;
  stats?: {
    pending: number;
    queued: number;
    processing: number;
    byType: Record<JobType, number>;
    byPriority: Record<JobPriority, number>;
  };
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('production_jobs')
      .select('status, job_type, priority')
      .in('status', ['pending', 'queued', 'processing']);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate stats
    const stats = {
      pending: 0,
      queued: 0,
      processing: 0,
      byType: {} as Record<JobType, number>,
      byPriority: {} as Record<JobPriority, number>,
    };

    data?.forEach(job => {
      // Status counts
      if (job.status === 'pending') stats.pending++;
      if (job.status === 'queued') stats.queued++;
      if (job.status === 'processing') stats.processing++;

      // Type counts
      stats.byType[job.job_type as JobType] = (stats.byType[job.job_type as JobType] || 0) + 1;

      // Priority counts
      stats.byPriority[job.priority as JobPriority] = (stats.byPriority[job.priority as JobPriority] || 0) + 1;
    });

    return { success: true, stats };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
  }
}

/**
 * Process a job based on its type
 */
export async function processJob(
  job: ProductionJob
): Promise<{ success: boolean; error?: string }> {
  try {
    // Mark job as processing
    await updateJobStatus(job.id, 'processing');

    // Route to appropriate workflow
    let result: { success: boolean; error?: string };

    switch (job.job_type) {
      case 'content':
        result = await processContentJob(job);
        break;
      case 'visual':
        result = await processVisualJob(job);
        break;
      case 'brand':
        result = await processBrandJob(job);
        break;
      case 'social':
        result = await processSocialJob(job);
        break;
      case 'seo':
        result = await processSeoJob(job);
        break;
      case 'website':
        result = await processWebsiteJob(job);
        break;
      case 'voice':
        result = await processVoiceJob(job);
        break;
      default:
        result = { success: false, error: `Unknown job type: ${job.job_type}` };
    }

    // Update status based on result
    if (result.success) {
      // Move to review if requires approval, otherwise complete
      const nextStatus = job.requires_client_approval ? 'review' : 'completed';
      await updateJobStatus(job.id, nextStatus);
    } else {
      await updateJobStatus(job.id, 'failed', undefined, result.error);
    }

    return result;
  } catch (error) {
    console.error('Error processing job:', error);
    await updateJobStatus(job.id, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process job',
    };
  }
}

/**
 * Process next job in queue
 */
export async function processNextJob(): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const { job } = await getNextJob();

  if (!job) {
    return { success: true }; // No jobs to process
  }

  const result = await processJob(job);
  return { ...result, jobId: job.id };
}

/**
 * Process all pending jobs (queue them)
 */
export async function queuePendingJobs(): Promise<{ success: boolean; queued: number; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data: jobs, error } = await supabase
      .from('production_jobs')
      .select('id')
      .eq('status', 'pending');

    if (error) throw error;

    let queued = 0;
    for (const job of jobs || []) {
      const result = await queueJob(job.id);
      if (result.success) queued++;
    }

    return { success: true, queued };
  } catch (error) {
    console.error('Error queuing pending jobs:', error);
    return {
      success: false,
      queued: 0,
      error: error instanceof Error ? error.message : 'Failed to queue jobs',
    };
  }
}

/**
 * Run queue processor (call from cron)
 */
export async function runQueueProcessor(
  maxJobs: number = 10
): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    processed: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < maxJobs; i++) {
    const { job } = await getNextJob();

    if (!job) break; // No more jobs

    const result = await processJob(job);

    if (result.success) {
      results.processed++;
    } else {
      results.failed++;
      results.errors.push(`Job ${job.id}: ${result.error}`);
    }
  }

  return { success: true, ...results };
}

export default {
  queueJob,
  getNextJob,
  getQueueStats,
  processJob,
  processNextJob,
  queuePendingJobs,
  runQueueProcessor,
};

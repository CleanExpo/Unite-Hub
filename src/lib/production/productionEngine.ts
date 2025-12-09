/**
 * Production Engine
 * Phase 50: Core orchestrator for automated marketing asset production
 */

import { getSupabaseServer } from '@/lib/supabase';

export type JobType = 'content' | 'visual' | 'brand' | 'social' | 'seo' | 'website' | 'voice';
export type JobStatus = 'pending' | 'queued' | 'processing' | 'draft' | 'review' | 'revision' | 'approved' | 'completed' | 'cancelled' | 'failed';
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';
export type JobSource = 'roadmap' | 'voice' | 'text' | 'chatbot' | 'manual';

export interface ProductionJob {
  id: string;
  client_id: string;
  organization_id: string;
  job_type: JobType;
  title: string;
  description: string | null;
  priority: JobPriority;
  status: JobStatus;
  mode: 'draft' | 'refine' | 'final';
  input_data: Record<string, any>;
  source: JobSource;
  output_data: any[];
  output_urls: string[];
  ai_model_used: string | null;
  generation_cost: number;
  requires_client_approval: boolean;
  requires_owner_oversight: boolean;
  approved_by: string | null;
  approved_at: string | null;
  revision_count: number;
  safety_score: number;
  safety_flags: string[];
  truth_layer_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateJobData {
  clientId: string;
  organizationId: string;
  jobType: JobType;
  title: string;
  description?: string;
  priority?: JobPriority;
  inputData?: Record<string, any>;
  source?: JobSource;
  sourceId?: string;
  requiresOwnerOversight?: boolean;
}

/**
 * Create a new production job
 */
export async function createJob(
  data: CreateJobData
): Promise<{ success: boolean; job?: ProductionJob; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Determine if high-impact task requiring owner oversight
    const highImpactTypes: JobType[] = ['brand', 'website'];
    const requiresOversight = data.requiresOwnerOversight ?? highImpactTypes.includes(data.jobType);

    const { data: job, error } = await supabase
      .from('production_jobs')
      .insert({
        client_id: data.clientId,
        organization_id: data.organizationId,
        job_type: data.jobType,
        title: data.title,
        description: data.description,
        priority: data.priority || 'normal',
        input_data: data.inputData || {},
        source: data.source || 'manual',
        source_id: data.sourceId,
        requires_owner_oversight: requiresOversight,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
throw error;
}

    // Log creation event
    await logJobEvent(job.id, 'created', null, 'pending');

    return { success: true, job };
  } catch (error) {
    console.error('Error creating production job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create job',
    };
  }
}

/**
 * Get a job by ID
 */
export async function getJob(
  jobId: string
): Promise<{ success: boolean; job?: ProductionJob; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('production_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
throw error;
}

    return { success: true, job: data };
  } catch (error) {
    console.error('Error fetching job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch job',
    };
  }
}

/**
 * Get all jobs for a client
 */
export async function getClientJobs(
  clientId: string,
  options?: { status?: JobStatus; limit?: number }
): Promise<{ success: boolean; jobs?: ProductionJob[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('production_jobs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
throw error;
}

    return { success: true, jobs: data };
  } catch (error) {
    console.error('Error fetching client jobs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch jobs',
    };
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  newStatus: JobStatus,
  userId?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get current status
    const { data: currentJob } = await supabase
      .from('production_jobs')
      .select('status')
      .eq('id', jobId)
      .single();

    const previousStatus = currentJob?.status;

    // Update status
    const updateData: Record<string, any> = { status: newStatus };

    if (newStatus === 'queued') {
      updateData.queued_at = new Date().toISOString();
    } else if (newStatus === 'processing') {
      updateData.started_at = new Date().toISOString();
    } else if (newStatus === 'completed' || newStatus === 'failed') {
      updateData.completed_at = new Date().toISOString();
    } else if (newStatus === 'approved') {
      updateData.approved_by = userId;
      updateData.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('production_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
throw error;
}

    // Log event
    await logJobEvent(jobId, statusToEventType(newStatus), previousStatus, newStatus, userId, notes);

    return { success: true };
  } catch (error) {
    console.error('Error updating job status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

/**
 * Add output to a job
 */
export async function addJobOutput(
  jobId: string,
  clientId: string,
  output: {
    outputType: string;
    title: string;
    content?: string;
    fileUrl?: string;
    thumbnailUrl?: string;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; outputId?: string; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('production_outputs')
      .insert({
        job_id: jobId,
        client_id: clientId,
        output_type: output.outputType,
        title: output.title,
        content: output.content,
        file_url: output.fileUrl,
        thumbnail_url: output.thumbnailUrl,
        metadata: output.metadata || {},
      })
      .select('id')
      .single();

    if (error) {
throw error;
}

    return { success: true, outputId: data.id };
  } catch (error) {
    console.error('Error adding job output:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add output',
    };
  }
}

/**
 * Get outputs for a job
 */
export async function getJobOutputs(
  jobId: string
): Promise<{ success: boolean; outputs?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('production_outputs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) {
throw error;
}

    return { success: true, outputs: data };
  } catch (error) {
    console.error('Error fetching job outputs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch outputs',
    };
  }
}

/**
 * Request revision for a job
 */
export async function requestRevision(
  jobId: string,
  clientId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get current revision count
    const { data: job } = await supabase
      .from('production_jobs')
      .select('revision_count, status')
      .eq('id', jobId)
      .single();

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    const { error } = await supabase
      .from('production_jobs')
      .update({
        status: 'revision',
        revision_count: job.revision_count + 1,
        revision_notes: notes,
      })
      .eq('id', jobId);

    if (error) {
throw error;
}

    await logJobEvent(jobId, 'revision_requested', job.status, 'revision', clientId, notes);

    return { success: true };
  } catch (error) {
    console.error('Error requesting revision:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request revision',
    };
  }
}

/**
 * Approve a job
 */
export async function approveJob(
  jobId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  return updateJobStatus(jobId, 'approved', userId);
}

/**
 * Cancel a job
 */
export async function cancelJob(
  jobId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return updateJobStatus(jobId, 'cancelled', userId, reason);
}

/**
 * Update job safety information
 */
export async function updateJobSafety(
  jobId: string,
  safetyScore: number,
  safetyFlags: string[],
  truthLayerVerified: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('production_jobs')
      .update({
        safety_score: safetyScore,
        safety_flags: safetyFlags,
        truth_layer_verified: truthLayerVerified,
      })
      .eq('id', jobId);

    if (error) {
throw error;
}

    return { success: true };
  } catch (error) {
    console.error('Error updating job safety:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update safety',
    };
  }
}

/**
 * Log a job event to history
 */
async function logJobEvent(
  jobId: string,
  eventType: string,
  previousStatus: string | null,
  newStatus: string,
  userId?: string,
  notes?: string
): Promise<void> {
  try {
    const supabase = await getSupabaseServer();

    await supabase.from('production_job_history').insert({
      job_id: jobId,
      event_type: eventType,
      previous_status: previousStatus,
      new_status: newStatus,
      user_id: userId,
      notes,
    });
  } catch (error) {
    console.error('Error logging job event:', error);
  }
}

/**
 * Map status to event type
 */
function statusToEventType(status: JobStatus): string {
  const map: Record<JobStatus, string> = {
    pending: 'created',
    queued: 'queued',
    processing: 'started',
    draft: 'completed',
    review: 'completed',
    revision: 'revision_requested',
    approved: 'approved',
    completed: 'completed',
    cancelled: 'cancelled',
    failed: 'failed',
  };
  return map[status] || 'created';
}

export default {
  createJob,
  getJob,
  getClientJobs,
  updateJobStatus,
  addJobOutput,
  getJobOutputs,
  requestRevision,
  approveJob,
  cancelJob,
  updateJobSafety,
};

/**
 * Production Jobs API Route
 * Phase 50: Manage production jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseBrowser } from '@/lib/supabase';
import {
  createProductionJob,
  getClientJobs,
  updateJobStatus,
  updateJobSafety,
  type JobType,
  type JobStatus,
} from '@/lib/production/productionEngine';
import { addToQueue } from '@/lib/production/jobQueue';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const clientId = req.nextUrl.searchParams.get('clientId');
    const status = req.nextUrl.searchParams.get('status');
    const jobType = req.nextUrl.searchParams.get('jobType');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    let query = supabase
      .from('production_jobs')
      .select(`
        *,
        production_outputs (*),
        production_job_history (*)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Production jobs GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { clientId, jobType, title, description, inputData, priority, autoProcess } = body;

    if (!clientId || !jobType || !title) {
      return NextResponse.json(
        { error: 'clientId, jobType, and title are required' },
        { status: 400 }
      );
    }

    // Create the job
    const job = await createProductionJob(
      clientId,
      jobType as JobType,
      title,
      description || '',
      inputData || {},
      priority || 'normal'
    );

    if (!job) {
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    // Optionally add to queue for automatic processing
    if (autoProcess) {
      await addToQueue(job.id);
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Production jobs POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { jobId, action, notes, safetyScore, safetyFlags } = body;

    if (!jobId || !action) {
      return NextResponse.json(
        { error: 'jobId and action are required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get current job
    const { data: job, error: jobError } = await supabase
      .from('production_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    let newStatus: JobStatus;

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'cancelled';
        break;
      case 'revision':
        newStatus = 'revision';
        break;
      case 'cancel':
        newStatus = 'cancelled';
        break;
      case 'complete':
        newStatus = 'completed';
        break;
      case 'process':
        await addToQueue(jobId);
        return NextResponse.json({ success: true, message: 'Job added to queue' });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await updateJobStatus(jobId, newStatus, notes);

    // Update safety if provided
    if (safetyScore !== undefined) {
      await updateJobSafety(jobId, safetyScore, safetyFlags || []);
    }

    // Fetch updated job
    const { data: updatedJob } = await supabase
      .from('production_jobs')
      .select(`
        *,
        production_outputs (*),
        production_job_history (*)
      `)
      .eq('id', jobId)
      .single();

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error('Production jobs PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const jobId = req.nextUrl.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Only allow deletion of cancelled or failed jobs
    const { data: job } = await supabase
      .from('production_jobs')
      .select('status')
      .eq('id', jobId)
      .single();

    if (!job || !['cancelled', 'failed'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Only cancelled or failed jobs can be deleted' },
        { status: 400 }
      );
    }

    // Delete related records first
    await supabase.from('production_outputs').delete().eq('job_id', jobId);
    await supabase.from('production_job_history').delete().eq('job_id', jobId);

    // Delete job
    const { error } = await supabase
      .from('production_jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      console.error('Error deleting job:', error);
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Production jobs DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

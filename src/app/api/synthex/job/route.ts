/**
 * Job Management APIs
 *
 * POST /api/synthex/job - Create new job
 * GET /api/synthex/job - List jobs for tenant
 * GET /api/synthex/job/:id - Get job details with results
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';
import { createJob, routeJobToAgent } from '@/lib/synthex/synthexJobRouter';
import { routeAndExecuteJob } from '@/lib/synthex/synthexAgiBridge';

// ============================================================================
// POST /api/synthex/job - Create new job
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tenantId, brandId, jobType, payload } = body;

    if (!tenantId || !jobType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user owns tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('synthex_tenants')
      .select('id')
      .eq('id', tenantId)
      .eq('owner_user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Create job via router
    const { jobId, error: jobError } = await createJob({
      tenantId,
      brandId,
      jobType,
      payload,
    });

    if (jobError) {
      return NextResponse.json({ error: jobError }, { status: 400 });
    }

    // Log usage event
    await supabaseAdmin.from('synthex_usage_logs').insert({
      tenant_id: tenantId,
      event_type: 'job_created',
      feature: jobType,
      metadata_json: { jobId, payload },
      created_at: new Date().toISOString(),
    });

    // Trigger async job execution (in production, use background queue)
    // For MVP, we'll execute synchronously but track in database
    setImmediate(() => {
      routeAndExecuteJob(jobId).catch((error) => {
        console.error(`Failed to execute job ${jobId}:`, error);
      });
    });

    return NextResponse.json({
      jobId,
      status: 'queued',
      message: 'Job created and queued for processing',
    });
  } catch (error) {
    console.error('POST /api/synthex/job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// GET /api/synthex/job - List jobs for tenant
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    const jobId = req.nextUrl.searchParams.get('jobId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    // Verify user owns tenant
    const { data: tenant } = await supabase
      .from('synthex_tenants')
      .select('id')
      .eq('id', tenantId)
      .eq('owner_user_id', user.id)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (jobId) {
      // Get single job with results
      const { data: job, error: jobError } = await supabase
        .from('synthex_project_jobs')
        .select(
          `
          *,
          synthex_job_results (*)
        `
        )
        .eq('id', jobId)
        .eq('tenant_id', tenantId)
        .single();

      if (jobError || !job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({ job });
    } else {
      // Get all jobs for tenant
      const { data: jobs, error: jobError } = await supabase
        .from('synthex_project_jobs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (jobError) {
        return NextResponse.json({ error: jobError.message }, { status: 500 });
      }

      return NextResponse.json({ jobs: jobs || [] });
    }
  } catch (error) {
    console.error('GET /api/synthex/job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

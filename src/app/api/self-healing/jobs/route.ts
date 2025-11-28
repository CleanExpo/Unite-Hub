/**
 * Self-Healing Jobs API
 *
 * GET - List open self-healing jobs
 * POST - Create a new self-healing job (internal use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { selfHealingService } from '@/lib/selfHealing';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify FOUNDER/ADMIN role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['FOUNDER', 'ADMIN'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Founder/Admin access only' }, { status: 403 });
    }

    // Get query params
    const url = new URL(req.url);
    const includeAll = url.searchParams.get('includeAll') === 'true';

    // Fetch jobs
    let jobs;
    if (includeAll) {
      const { data, error } = await supabase
        .from('self_healing_jobs')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(100);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      jobs = data;
    } else {
      jobs = await selfHealingService.listOpenJobs();
    }

    // Get summary stats
    const summary = await selfHealingService.getHealthSummary();

    return NextResponse.json({
      jobs,
      summary,
    });
  } catch (err) {
    console.error('[API] Self-healing jobs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Verify authentication (allows service calls too)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Note: We allow unauthenticated calls for automated error recording
    // RLS on the table will handle access control

    const body = await req.json();
    const { route, method, statusCode, errorMessage, stack, observabilityLogId } = body;

    if (!route) {
      return NextResponse.json({ error: 'Route is required' }, { status: 400 });
    }

    const job = await selfHealingService.recordErrorAndCreateJob({
      route,
      method,
      statusCode,
      errorMessage,
      stack,
      observabilityLogId,
    });

    if (!job) {
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error('[API] Self-healing jobs POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/synthex/visual/jobs?tenantId=...
 *
 * Fetch visual generation jobs for a tenant
 *
 * Response:
 * {
 *   jobs: [
 *     {
 *       id: string
 *       job_type: string
 *       status: string
 *       prompt: string
 *       created_at: string
 *       completed_at?: string
 *       result?: { output_url, model_used, cost }
 *       error_message?: string
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    const limit = req.nextUrl.searchParams.get('limit') || '20';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    // Fetch recent visual generation jobs
    const { data: jobs, error } = await supabaseAdmin
      .from('synthex_visual_generation_jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobs: jobs || [] }, { status: 200 });
  } catch (error) {
    console.error('Jobs GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

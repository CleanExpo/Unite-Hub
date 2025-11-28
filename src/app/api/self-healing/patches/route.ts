/**
 * Self-Healing Patches API
 *
 * GET - List patches for a job
 * POST - Create a new patch proposal
 * PATCH - Update patch status (approve/reject)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { selfHealingService, PatchType } from '@/lib/selfHealing';

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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['FOUNDER', 'ADMIN'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get job ID from query
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      // Return all pending patches
      const { data, error } = await supabase
        .from('self_healing_patches')
        .select('*, self_healing_jobs!inner(route, error_category, severity)')
        .in('status', ['PROPOSED', 'VALIDATED', 'AWAITING_APPROVAL'])
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ patches: data });
    }

    // Get patches for specific job
    const { job, patches, decisions } = await selfHealingService.getJobWithPatches(jobId);

    return NextResponse.json({ job, patches, decisions });
  } catch (err) {
    console.error('[API] Self-healing patches GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['FOUNDER', 'ADMIN'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      jobId,
      patchType,
      description,
      filesChanged,
      sqlMigrationPath,
      aiDiffProposal,
      aiPatchPayload,
      confidenceScore,
    } = body;

    if (!jobId || !patchType || !description) {
      return NextResponse.json(
        { error: 'jobId, patchType, and description are required' },
        { status: 400 }
      );
    }

    const patch = await selfHealingService.attachPatch(jobId, {
      patchType: patchType as PatchType,
      description,
      filesChanged: filesChanged || [],
      sqlMigrationPath,
      aiDiffProposal,
      aiPatchPayload,
      confidenceScore,
    });

    if (!patch) {
      return NextResponse.json({ error: 'Failed to create patch' }, { status: 500 });
    }

    return NextResponse.json({ patch }, { status: 201 });
  } catch (err) {
    console.error('[API] Self-healing patches POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['FOUNDER', 'ADMIN'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { patchId, jobId, action, reason } = body as {
      patchId: string;
      jobId: string;
      action: 'APPROVE' | 'REJECT' | 'APPLY_SANDBOX' | 'APPLY_MAIN';
      reason?: string;
    };

    if (!patchId || !jobId || !action) {
      return NextResponse.json(
        { error: 'patchId, jobId, and action are required' },
        { status: 400 }
      );
    }

    // Map action to decision type
    const decisionType =
      action === 'APPROVE'
        ? 'APPROVED'
        : action === 'REJECT'
          ? 'REJECTED'
          : action === 'APPLY_SANDBOX'
            ? 'APPLY_SANDBOX'
            : 'APPLY_MAIN';

    const decision = await selfHealingService.recordDecision(
      jobId,
      decisionType as any,
      user.id,
      reason,
      patchId
    );

    if (!decision) {
      return NextResponse.json({ error: 'Failed to record decision' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      decision,
      message: `Patch ${action.toLowerCase()}ed successfully`,
    });
  } catch (err) {
    console.error('[API] Self-healing patches PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

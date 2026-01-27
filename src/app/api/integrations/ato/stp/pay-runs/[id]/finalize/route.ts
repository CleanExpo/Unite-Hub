/**
 * Finalize Pay Run API
 *
 * PATCH /api/integrations/ato/stp/pay-runs/[id]/finalize
 * Mark pay run as finalized (ready for STP submission)
 *
 * Related to: UNI-178 [ATO] STP Phase 2 Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { finalizePayRun } from '@/lib/integrations/ato/stpComplianceService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: payRunId } = await context.params;
    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Finalize pay run
    const payRun = await finalizePayRun(workspaceId, payRunId);

    return NextResponse.json({
      success: true,
      payRun,
    });
  } catch (error) {
    console.error('Finalize pay run error:', error);
    return NextResponse.json(
      {
        error: 'Failed to finalize pay run',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

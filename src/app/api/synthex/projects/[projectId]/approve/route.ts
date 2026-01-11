/**
 * Synthex Project Approval API
 *
 * POST /api/synthex/projects/:projectId/approve
 * Approves the latest draft run (awaiting_approval) and moves project to scheduled.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantAccess, hasTenantRole } from '@/lib/synthex/tenantAccess';
import { approveLatestRun, type SynthexApprovalType } from '@/lib/synthex/projectsService';

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await req.json();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { tenantId, approvalType, notes } = body as {
    tenantId?: string;
    approvalType?: SynthexApprovalType;
    notes?: string | null;
  };

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const access = await getTenantAccess(user.id, tenantId);
  if (!access) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (!hasTenantRole(access, ['owner', 'admin', 'editor'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { projectId } = await ctx.params;
  const result = await approveLatestRun({
    tenantId,
    projectId,
    userId: user.id,
    approvalType,
    notes: notes ?? null,
  });

  if (result.error || !result.approval) {
    return NextResponse.json({ error: result.error ?? 'Approval failed' }, { status: 400 });
  }

  return NextResponse.json({ status: 'ok', approval: result.approval }, { status: 200 });
}

